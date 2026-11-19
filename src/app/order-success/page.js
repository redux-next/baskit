
import Link from "next/link";

export const instant = false;

export default async function OrderSuccessPage({ searchParams }) {
  const params = await searchParams;
  const orderId =
    typeof params?.orderId === "string" ? params.orderId : "";

  return (
    <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center px-3 py-6 sm:p-5">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 sm:mb-6">
          ✓
        </div>

        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-green-700">
          DailyCart
        </p>

        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2 sm:mt-3">
          Order placed successfully!
        </h1>

        <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 leading-5 sm:leading-6">
          Thank you for shopping with us. Your Cash on Delivery order
          has been received.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mt-5 sm:mt-6">
            <p className="text-[11px] sm:text-xs text-gray-500">
              Your order ID
            </p>

            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-2 break-all">
              {orderId}
            </p>
          </div>
        )}

        <div className="bg-green-50 rounded-xl p-3 sm:p-4 mt-3 sm:mt-4 text-left">
          <p className="text-xs sm:text-sm font-semibold text-green-800">
            Payment method: Cash on Delivery
          </p>

          <p className="text-[11px] sm:text-xs text-green-700 mt-1">
            Please pay when your order arrives.
          </p>
        </div>

        <Link
          href="/"
          className="block w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-bold rounded-xl py-3 sm:py-3.5 mt-5 sm:mt-7 transition"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
