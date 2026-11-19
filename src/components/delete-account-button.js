"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";

export default function DeleteAccountButton({ className = "" }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Permanently delete your DailyCart account, saved profile, and order history? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      if (!user) {
        throw new Error("Please sign in again before deleting your account.");
      }

      const token = await user.getIdToken();
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to delete your account. Please try again."
        );
      }

      await logout();
      router.replace("/login");
    } catch (deleteError) {
      console.error("Account deletion failed:", deleteError);
      setError(
        deleteError.message ||
          "Unable to delete your account. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleDeleteAccount}
        disabled={deleting || !user}
      >
        {deleting ? "Deleting account..." : "Delete account"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
