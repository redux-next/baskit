import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "../../../lib/firebase-admin";
import { createOrder } from "../../../lib/order-creation.mjs";

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function POST(request) {
  try {
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

    let body;

    try {
      body = await request.json();
    } catch {
      return responseError("Invalid request body.");
    }

    const result = await createOrder({
      db: adminDb,
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      cart: body?.cart,
      paymentMethod: body?.paymentMethod,
      idempotencyKey: request.headers.get("idempotency-key"),
    });

    const { replayed, ...order } = result;

    return NextResponse.json(
      {
        success: true,
        message: replayed
          ? "Order was already placed."
          : "Order placed successfully.",
        order,
      },
      { status: replayed ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    const knownErrors = {
      INVALID_IDEMPOTENCY_KEY: [
        "A valid checkout attempt key is required.",
        400,
      ],
      INVALID_CART: ["Invalid cart.", 400],
      INVALID_PAYMENT_METHOD: [
        "Only Cash on Delivery is currently available. UPI will be enabled after payment integration.",
        400,
      ],
      EMPTY_CART: ["Your cart is empty.", 400],
      CART_TOO_LARGE: [
        "Too many different products in your cart.",
        400,
      ],
      INVALID_PRODUCT_ID: ["Invalid product ID in cart.", 400],
      INVALID_PRODUCT_QUANTITY: [
        "Invalid product quantity.",
        400,
      ],
      PROFILE_NOT_FOUND: ["Customer profile not found.", 404],
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
      IDEMPOTENCY_KEY_REUSED: [
        "This checkout key was already used with different details. Start a new checkout.",
        409,
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
