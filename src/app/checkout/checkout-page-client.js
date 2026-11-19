
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useAuth } from "../../components/auth-provider";
import { useCart } from "../../components/cart-provider";
import { useCatalog } from "../../hooks/use-catalog";
import LoadingImage from "../../components/loading-image";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const { cart, isLoaded: cartLoaded } = useCart();

  const {
    products = [],
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notice, setNotice] = useState("");

  // Load the authenticated customer's saved profile.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (authLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (!active) return;

        if (!snapshot.exists() || snapshot.data().profileCompleted !== true) {
          router.replace("/complete-profile");
          return;
        }

        setProfile(snapshot.data());
      } catch (error) {
        console.error("Checkout profile error:", error);

        if (active) {
          setProfileError(
            "Unable to load your delivery details. Please try again."
          );
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, authLoading, router]);

  // Match cart product IDs with the live catalogue.
  const cartItems = useMemo(() => {
    return products
      .filter((product) => Number(cart[String(product.id)]) > 0)
      .map((product) => ({
        ...product,
        quantity: cart[String(product.id)],
      }));
  }, [products, cart]);

  const missingItems = useMemo(() => {
    return Object.entries(cart).filter(
      ([id, quantity]) =>
        quantity > 0 &&
        !products.some((product) => String(product.id) === id)
    );
  }, [cart, products]);

  const itemCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * product.quantity,
    0
  );

  // Current DailyCart delivery policy.
  const deliveryFee =
    subtotal === 0 || subtotal >= 299 ? 0 : 19;

  const handlingFee = subtotal === 0 ? 0 : 4;

  const total = subtotal + deliveryFee + handlingFee;

  // COD is available only when the order total is strictly above ₹100.
  const codEligible = total > 100;

  const isLoading =
    authLoading ||
    !cartLoaded ||
    catalogLoading ||
    profileLoading;

  const canContinue =
    !isLoading &&
    !catalogError &&
    !profileError &&
    Boolean(profile) &&
    itemCount > 0 &&
    cartItems.length > 0 &&
    missingItems.length === 0 &&
    (paymentMethod !== "cod" || codEligible);

  function handleContinue() {
    setNotice("");

    if (!canContinue) return;

    setNotice(
      paymentMethod === "upi"
        ? "UPI payment will be enabled after secure payment gateway integration."
        : "Order placement will be enabled after the secure Orders API is connected."
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
          <p className="mt-4 text-sm text-gray-500">
            Preparing your checkout...
          </p>
        </div>
      </main>
    );
  }

  if (profileError || catalogError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-4">
        <section className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Checkout unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {profileError || catalogError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white hover:bg-green-700"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (itemCount === 0 && missingItems.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🧺</div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Your basket is empty
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add some products before proceeding to checkout.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
          >
            Start shopping
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-gray-900"
          >
            DailyCart<span className="text-green-600">.</span>
          </Link>

          <Link
            href="/cart"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to basket
          </Link>
        </header>

        {/* Heading */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
            ALMOST THERE
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Confirm your delivery details and payment method.
          </p>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {/* Delivery address */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-xl">
                    📍
                  </div>

                  <div>
                    <h2 className="font-extrabold text-gray-900">
                      Delivery address
                    </h2>
                    <p className="text-xs text-gray-500">
                      Your saved delivery location
                    </p>
                  </div>
                </div>

                <Link
                  href="/complete-profile"
                  className="text-sm font-bold text-green-700 hover:text-green-800"
                >
                  Edit
                </Link>
              </div>

              <div className="mt-5 rounded-xl border border-green-100 bg-green-50/60 p-4">
                <p className="font-bold text-gray-900">
                  {profile?.name}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  +91 {profile?.phoneNumber}
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {profile?.address}
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-700">
                  PIN: {profile?.pincode}
                </p>
              </div>

              {profile?.location?.latitude != null &&
                profile?.location?.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${profile.location.latitude},${profile.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-xs font-semibold text-green-700 hover:text-green-800"
                  >
                    View saved GPS location ↗
                  </a>
                )}
            </section>

            {/* Payment method */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-xl">
                  💳
                </div>

                <div>
                  <h2 className="font-extrabold text-gray-900">
                    Payment method
                  </h2>
                  <p className="text-xs text-gray-500">
                    Choose how you want to pay
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {/* UPI */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("upi");
                    setNotice("");
                  }}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                    paymentMethod === "upi"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">
                    📱
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-gray-900">
                      UPI
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Pay online using UPI
                    </span>
                  </span>

                  <span
                    className={`h-5 w-5 rounded-full border-2 ${
                      paymentMethod === "upi"
                        ? "border-green-600 bg-green-600"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "upi" && (
                      <span className="block text-center text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </span>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => {
                    if (!codEligible) return;
                    setPaymentMethod("cod");
                    setNotice("");
                  }}
                  disabled={!codEligible}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    paymentMethod === "cod"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">
                    💵
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-gray-900">
                      Cash on Delivery
                    </span>

                    <span className="mt-1 block text-xs text-gray-500">
                      {codEligible
                        ? "Pay when your order arrives"
                        : "Available only for orders above ₹100"}
                    </span>
                  </span>

                  <span
                    className={`h-5 w-5 rounded-full border-2 ${
                      paymentMethod === "cod"
                        ? "border-green-600 bg-green-600"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "cod" && (
                      <span className="block text-center text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </span>
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-gray-400">
                Payment processing and order confirmation will be activated
                after the secure payment and order services are connected.
              </p>
            </section>

            {/* Products */}
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-gray-900">
                  Your items
                </h2>

                <Link
                  href="/cart"
                  className="text-xs font-bold text-green-700 hover:text-green-800"
                >
                  Edit basket
                </Link>
              </div>

              <div className="mt-5 divide-y divide-gray-100">
                {cartItems.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f0f8f0]">
                      <LoadingImage
                        src={product.image}
                        alt={product.name}
                        sizes="64px"
                        objectFit="contain"
                        className="p-2"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {product.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatPrice(product.price)} × {product.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(
                        Number(product.price || 0) * product.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {missingItems.length > 0 && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-800">
                    Unavailable products in your basket
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    Return to your basket and remove unavailable products
                    before checkout.
                  </p>

                  <Link
                    href="/cart"
                    className="mt-3 inline-block text-xs font-bold text-amber-900 underline"
                  >
                    Review basket
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Bill summary */}
          <aside className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-extrabold text-gray-900">
              Bill details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your order
            </p>

            <div className="mt-6 space-y-4 border-b border-dashed border-gray-200 pb-5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Item total</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery fee</span>

                {deliveryFee === 0 ? (
                  <span className="font-bold text-green-600">FREE</span>
                ) : (
                  <span className="font-semibold text-gray-900">
                    {formatPrice(deliveryFee)}
                  </span>
                )}
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Handling fee</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(handlingFee)}
                </span>
              </div>
            </div>

            <div className="flex justify-between py-5 text-base font-extrabold text-gray-900">
              <span>Grand total</span>
              <span>{formatPrice(total)}</span>
            </div>

            {subtotal > 0 && subtotal < 299 && (
              <p className="mb-5 rounded-xl bg-green-50 p-3 text-xs leading-5 text-green-800">
                Add {formatPrice(299 - subtotal)} more to unlock free delivery.
              </p>
            )}

            {paymentMethod === "cod" && !codEligible && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Cash on Delivery is available only when your total exceeds
                ₹100. You can choose UPI instead.
              </p>
            )}

            {notice && (
              <div
                role="status"
                className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
              >
                {notice}
              </div>
            )}

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full rounded-xl bg-green-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              Continue →
            </button>

            <div className="mt-5 space-y-2 text-center text-xs text-gray-400">
              <p>🔒 Secure checkout experience</p>
              <p>Your delivery details are saved to your account.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
