import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

const SERVICE_AREA = {
  name: "Chabua Town",
  latitude: 27.48253,
  longitude: 95.17451,
  radiusKm: 10,
};

function getCoordinates(location) {
  if (!location || typeof location !== "object") {
    return null;
  }

  const latitude = Number(location.latitude ?? location.lat);
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

function validateCheckout(cart, paymentMethod, idempotencyKey) {
  if (
    typeof idempotencyKey !== "string" ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)
  ) {
    throw new Error("INVALID_IDEMPOTENCY_KEY");
  }

  if (!cart || typeof cart !== "object" || Array.isArray(cart)) {
    throw new Error("INVALID_CART");
  }

  if (paymentMethod !== "cod") {
    throw new Error("INVALID_PAYMENT_METHOD");
  }

  const cartEntries = Object.entries(cart);

  if (cartEntries.length === 0) {
    throw new Error("EMPTY_CART");
  }

  if (cartEntries.length > 50) {
    throw new Error("CART_TOO_LARGE");
  }

  const requestedItems = cartEntries.map(([productId, quantity]) => {
    if (!/^\d+$/.test(productId)) {
      throw new Error("INVALID_PRODUCT_ID");
    }

    const numericId = Number(productId);

    if (!Number.isSafeInteger(numericId)) {
      throw new Error("INVALID_PRODUCT_ID");
    }

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      throw new Error("INVALID_PRODUCT_QUANTITY");
    }

    return {
      numericId,
      quantity,
      documentId: `product-${numericId}`,
    };
  });

  const fingerprintItems = requestedItems
    .map(({ numericId, quantity }) => ({
      productId: numericId,
      quantity,
    }))
    .sort(
      (left, right) =>
        left.productId - right.productId ||
        left.quantity - right.quantity
    );
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        paymentMethod,
        items: fingerprintItems,
      })
    )
    .digest("hex");

  return { requestedItems, requestHash };
}

export async function createOrder({
  db,
  uid,
  email,
  cart,
  paymentMethod,
  idempotencyKey,
}) {
  if (typeof uid !== "string" || !uid) {
    throw new Error("AUTHENTICATED_CUSTOMER_REQUIRED");
  }

  const { requestedItems, requestHash } = validateCheckout(
    cart,
    paymentMethod,
    idempotencyKey
  );

  const profileRef = db.collection("users").doc(uid);
  const checkoutAttemptRef = profileRef
    .collection("checkoutAttempts")
    .doc(idempotencyKey);
  const orderRef = db.collection("orders").doc();
  const cartRef = db.collection("carts").doc(uid);
  const productRefs = requestedItems.map((item) =>
    db.collection("products").doc(item.documentId)
  );

  return db.runTransaction(async (transaction) => {
    const attemptSnapshot = await transaction.get(checkoutAttemptRef);

    if (attemptSnapshot.exists) {
      const attempt = attemptSnapshot.data();

      if (attempt.requestHash !== requestHash) {
        throw new Error("IDEMPOTENCY_KEY_REUSED");
      }

      if (!attempt.result || typeof attempt.result.orderId !== "string") {
        throw new Error("INVALID_IDEMPOTENCY_RECORD");
      }

      return { ...attempt.result, replayed: true };
    }

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

    const customerCoordinates = getCoordinates(profile.location);

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

    const productSnapshots = await Promise.all(
      productRefs.map((ref) => transaction.get(ref))
    );
    const orderItems = [];
    const stockUpdates = [];
    let subtotal = 0;

    for (let index = 0; index < requestedItems.length; index++) {
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

      const lineTotal = product.price * requested.quantity;
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

    const deliveryFee = subtotal >= 299 ? 0 : 19;
    const handlingFee = 4;
    const total = subtotal + deliveryFee + handlingFee;

    if (total <= 100) {
      throw new Error("COD_MINIMUM_NOT_MET");
    }

    for (const update of stockUpdates) {
      transaction.update(update.ref, {
        stock: update.newStock,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const orderData = {
      orderId: orderRef.id,
      userId: uid,
      customer: {
        name: profile.name,
        email: profile.email || email || "",
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
        distanceFromCentreKm: Number(distanceFromCentre.toFixed(2)),
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
    const result = {
      orderId: orderRef.id,
      total,
      itemCount: orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      distanceFromCentreKm: Number(distanceFromCentre.toFixed(2)),
    };

    transaction.create(orderRef, orderData);
    transaction.create(checkoutAttemptRef, {
      requestHash,
      result,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.delete(cartRef);

    return { ...result, replayed: false };
  });
}
