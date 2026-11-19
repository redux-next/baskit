import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "../../../lib/firebase-admin";

function responseError(message, status = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export async function DELETE(request) {
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
  } catch (error) {
    console.error("Account deletion authentication failed:", error);
    return responseError(
      "Your session has expired. Please sign in again.",
      401
    );
  }

  if (
    decodedToken.admin === true ||
    decodedToken.deliveryBoy === true
  ) {
    return responseError(
      "Staff accounts cannot be deleted from the customer account page.",
      403
    );
  }

  try {
    const orders = adminDb.collection("orders");
    const bulkWriter = adminDb.bulkWriter();
    let orderSnapshot;

    try {
      do {
        orderSnapshot = await orders
          .where("userId", "==", decodedToken.uid)
          .limit(400)
          .get();

        await Promise.all(
          orderSnapshot.docs.map((order) =>
            adminDb.recursiveDelete(order.ref, bulkWriter)
          )
        );
      } while (orderSnapshot.size === 400);
    } finally {
      await bulkWriter.close();
    }

    await adminDb
      .recursiveDelete(
        adminDb.collection("users").doc(decodedToken.uid)
      );
    await adminDb
      .recursiveDelete(
        adminDb.collection("carts").doc(decodedToken.uid)
      );
    await adminAuth.deleteUser(decodedToken.uid);

    return NextResponse.json({
      success: true,
      message: "Your DailyCart account and saved data have been deleted.",
    });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return responseError(
      "Unable to completely delete your account. Please try again.",
      500
    );
  }
}
