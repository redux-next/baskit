
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

export async function GET(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  }

  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(
      authorization.slice(7),
      true
    );
  } catch (error) {
    console.error("Firebase Admin test authentication failed:", error);

    return NextResponse.json(
      { success: false, message: "Your session has expired. Please sign in again." },
      { status: 401 }
    );
  }

  if (decodedToken.admin !== true) {
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 }
    );
  }

  try {
    await adminDb.listCollections();

    return NextResponse.json({
      success: true,
      message: "Firebase Admin connected successfully!",
    });
  } catch (error) {
    console.error("Firebase Admin test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Firebase Admin connection failed.",
      },
      { status: 500 }
    );
  }
}
