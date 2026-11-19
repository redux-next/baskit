import { Geist, Geist_Mono } from "next/font/google";
import AuthGate from "../components/auth-gate";
import { CartProvider } from "../components/cart-provider";
import { AuthProvider } from "../components/auth-provider";
import MobileBottomNav from "../components/mobile-bottom-nav";
import "./globals.css";

import "leaflet/dist/leaflet.css";
import PWARegister from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DailyCart",
  description:
    "Fresh groceries and everyday essentials delivered to your doorstep.",

  applicationName: "DailyCart",
  manifest: "/manifest.json",
  openGraph: {
    title: "DailyCart",
    description:
      "Fresh groceries and everyday essentials delivered to your doorstep.",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailyCart",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />

        <AuthProvider>
          <AuthGate>
            <CartProvider>
              <div className="app-content">{children}</div>
              <MobileBottomNav />
            </CartProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}