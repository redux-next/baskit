
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "../../../lib/firebase-admin";

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

async function getAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: responseError("Authentication required.", 401),
    };
  }

  const idToken = authorization.slice(7).trim();

  if (!idToken) {
    return {
      error: responseError("Invalid authentication token.", 401),
    };
  }

  try {
    return {
      user: await adminAuth.verifyIdToken(idToken, true),
    };
  } catch (error) {
    console.error("Cart authentication failed:", error.code, error.message);

    return {
      error: responseError(
        "Your session has expired. Please sign in again.",
        401
      ),
    };
  }
}

function validateCart(cart) {
  if (
    !cart ||
    typeof cart !== "object" ||
    Array.isArray(cart)
  ) {
    return null;
  }

  const validCart = {};

  for (const [productId, quantity] of Object.entries(cart)) {
    if (
      !productId.trim() ||
      productId.length > 128 ||
      ["__proto__", "constructor", "prototype"].includes(productId) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return null;
    }

    validCart[productId] = quantity;
  }

  return validCart;
}

export async function GET(request) {
  const authentication = await getAuthenticatedUser(request);

  if (authentication.error) return authentication.error;

  try {
    const snapshot = await adminDb
      .collection("carts")
      .doc(authentication.user.uid)
      .get();

    const storedItems = snapshot.exists
      ? snapshot.get("items") || {}
      : {};

    const cart = validateCart(storedItems);

    if (!cart) {
      console.error(
        "Invalid stored cart for user:",
        authentication.user.uid
      );

      throw new Error("Stored account cart has invalid contents.");
    }

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Unable to load account cart:", {
      code: error.code,
      message: error.message,
    });

    return responseError(
      "Unable to load your saved cart.",
      500
    );
  }
}

export async function PUT(request) {
  const authentication = await getAuthenticatedUser(request);

  if (authentication.error) return authentication.error;

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return responseError("Invalid cart request.");
  }

  const cart = validateCart(body?.cart);

  if (!cart) {
    return responseError("Invalid cart contents.");
  }

  try {
    await adminDb
      .collection("carts")
      .doc(authentication.user.uid)
      .set({
        items: cart,
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      message: "Cart saved.",
    });
  } catch (error) {
    console.error("Unable to save account cart:", {
      code: error.code,
      message: error.message,
    });

    return responseError(
      "Unable to save your account cart.",
      500
    );
  }
}
