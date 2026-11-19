
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../../../lib/firebase-admin";

// DailyCart service area: Chabua Town, Assam.
const SERVICE_AREA = {
  name: "Chabua Town",
  latitude: 27.48253,
  longitude: 95.17451,
  radiusKm: 10,
};

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function getCoordinates(location) {
  if (!location || typeof location !== "object") {
    return null;
  }

  const latitude = Number(
    location.latitude ?? location.lat
  );

  const longitude = Number(
    location.longitude ?? location.lng ?? location.lon
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function calculateDistanceKm(pointA, pointB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    pointB.latitude - pointA.latitude
  );

  const longitudeDifference = toRadians(
    pointB.longitude - pointA.longitude
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(pointA.latitude)) *
      Math.cos(toRadians(pointB.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * centralAngle;
}

export async function POST(request) {
  try {
    // 1. Verify Firebase authentication.
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return responseError("Authentication required.", 401);
    }

    const idToken = authorization.slice(7).trim();

    if (!idToken) {
      return responseError("Invalid authentication token.", 401);
    }

    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch {
      return responseError(
        "Your session has expired. Please sign in again.",
        401
      );
    }

    const uid = decodedToken.uid;

    // 2. Validate request.
    let body;

    try {
      body = await request.json();
    } catch {
      return responseError("Invalid request body.");
    }

    const { cart, paymentMethod } = body || {};

    if (!cart || typeof cart !== "object" || Array.isArray(cart)) {
      return responseError("Invalid cart.");
    }

    if (paymentMethod !== "cod") {
      return responseError(
        "Only Cash on Delivery is currently available. UPI will be enabled after payment integration."
      );
    }

    const cartEntries = Object.entries(cart);

    if (cartEntries.length === 0) {
      return responseError("Your cart is empty.");
    }

    if (cartEntries.length > 50) {
      return responseError(
        "Too many different products in your cart."
      );
    }

    // 3. Validate product IDs and quantities.
    const requestedItems = [];

    for (const [productId, quantity] of cartEntries) {
      if (!/^\d+$/.test(productId)) {
        return responseError("Invalid product ID in cart.");
      }

      const numericId = Number(productId);

      if (!Number.isSafeInteger(numericId)) {
        return responseError("Invalid product ID in cart.");
      }

      if (
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return responseError("Invalid product quantity.");
      }

      requestedItems.push({
        productId,
        numericId,
        quantity,
        documentId: `product-${numericId}`,
      });
    }

    // 4. Prepare Firestore references.
    const profileRef = adminDb.collection("users").doc(uid);
    const orderRef = adminDb.collection("orders").doc();
    const cartRef = adminDb.collection("carts").doc(uid);

    const productRefs = requestedItems.map((item) =>
      adminDb.collection("products").doc(item.documentId)
    );

    // 5. Validate profile, service area, inventory and create order.
    const orderResult = await adminDb.runTransaction(
      async (transaction) => {
        const profileSnapshot = await transaction.get(profileRef);

        if (!profileSnapshot.exists) {
          throw new Error("PROFILE_NOT_FOUND");
        }

        const profile = profileSnapshot.data();

        if (
          profile.profileCompleted !== true ||
          !profile.name ||
          !profile.phoneNumber ||
          !profile.address ||
          !profile.pincode
        ) {
          throw new Error("PROFILE_INCOMPLETE");
        }

        // 6. Validate the customer's saved GPS coordinates.
        const customerCoordinates = getCoordinates(
          profile.location
        );

        if (!customerCoordinates) {
          throw new Error("CUSTOMER_LOCATION_REQUIRED");
        }

        const distanceFromCentre = calculateDistanceKm(
          {
            latitude: SERVICE_AREA.latitude,
            longitude: SERVICE_AREA.longitude,
          },
          customerCoordinates
        );

        if (distanceFromCentre > SERVICE_AREA.radiusKm) {
          throw new Error("OUTSIDE_SERVICE_AREA");
        }

        // Read all products before writing anything.
        const productSnapshots = await Promise.all(
          productRefs.map((ref) => transaction.get(ref))
        );

        const orderItems = [];
        const stockUpdates = [];

        let subtotal = 0;

        for (
          let index = 0;
          index < requestedItems.length;
          index++
        ) {
          const requested = requestedItems[index];
          const productSnapshot = productSnapshots[index];

          if (!productSnapshot.exists) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          const product = productSnapshot.data();

          if (
            product.id !== requested.numericId ||
            typeof product.name !== "string" ||
            typeof product.price !== "number" ||
            !Number.isFinite(product.price) ||
            product.price < 0 ||
            !Number.isSafeInteger(product.stock) ||
            product.stock < 0
          ) {
            throw new Error("INVALID_PRODUCT_DATA");
          }

          if (product.stock < requested.quantity) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          const lineTotal =
            product.price * requested.quantity;

          subtotal += lineTotal;

          orderItems.push({
            productId: requested.numericId,
            productDocumentId: requested.documentId,
            name: product.name,
            category: product.category || "",
            detail: product.detail || "",
            image: product.image || "",
            price: product.price,
            quantity: requested.quantity,
            lineTotal,
          });

          stockUpdates.push({
            ref: productRefs[index],
            newStock: product.stock - requested.quantity,
          });
        }

        // 7. Calculate charges on the server.
        const deliveryFee = subtotal >= 299 ? 0 : 19;
        const handlingFee = 4;
        const total = subtotal + deliveryFee + handlingFee;

        if (total <= 100) {
          throw new Error("COD_MINIMUM_NOT_MET");
        }

        // 8. Deduct inventory atomically.
        for (const update of stockUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // 9. Save order snapshot.
        const orderData = {
          orderId: orderRef.id,
          userId: uid,

          customer: {
            name: profile.name,
            email: profile.email || decodedToken.email || "",
            phoneNumber: profile.phoneNumber,
          },

          deliveryAddress: {
            address: profile.address,
            pincode: profile.pincode,
            location: customerCoordinates,
          },

          serviceArea: {
            name: SERVICE_AREA.name,
            centreLatitude: SERVICE_AREA.latitude,
            centreLongitude: SERVICE_AREA.longitude,
            radiusKm: SERVICE_AREA.radiusKm,
            distanceFromCentreKm: Number(
              distanceFromCentre.toFixed(2)
            ),
          },

          items: orderItems,

          pricing: {
            subtotal,
            deliveryFee,
            handlingFee,
            total,
          },

          payment: {
            method: "cod",
            status: "pending",
          },

          orderStatus: "placed",

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        transaction.set(orderRef, orderData);
        transaction.delete(cartRef);

        return {
          orderId: orderRef.id,
          total,
          itemCount: orderItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
          distanceFromCentreKm: Number(
            distanceFromCentre.toFixed(2)
          ),
        };
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",
        order: orderResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    const knownErrors = {
      PROFILE_NOT_FOUND: [
        "Customer profile not found.",
        404,
      ],
      PROFILE_INCOMPLETE: [
        "Please complete your delivery profile.",
        400,
      ],
      CUSTOMER_LOCATION_REQUIRED: [
        "Please save your GPS delivery location in your profile before ordering.",
        400,
      ],
      OUTSIDE_SERVICE_AREA: [
        "Sorry! DailyCart currently delivers only within 10 km of Chabua Town.",
        403,
      ],
      PRODUCT_NOT_FOUND: [
        "One or more products are no longer available.",
        404,
      ],
      INVALID_PRODUCT_DATA: [
        "A product has invalid pricing or inventory data.",
        400,
      ],
      INSUFFICIENT_STOCK: [
        "One or more products have insufficient stock.",
        409,
      ],
      COD_MINIMUM_NOT_MET: [
        "Cash on Delivery is available only for orders above ₹100.",
        400,
      ],
    };

    const knownError = knownErrors[error.message];

    if (knownError) {
      return responseError(knownError[0], knownError[1]);
    }

    return responseError(
      "Unable to place your order right now. Please try again.",
      500
    );
  }
}
