"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

// Wrapper component for reset password
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // state variables
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showEmailSent, setShowEmailSent] = useState(false);

  useEffect(() => {
    // Redirect to forgot-password if no email is provided
    if (!email) {
      router.push("/forgot-password");
    }
  }, [email, router]);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess("");

    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Call our custom API endpoint to reset the password
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Show success message
      setSuccess(data.message || "Password reset initiated. Please check your email.");
      setShowEmailSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage: "url('/pexels-adrien-olichon-1257089-2387793.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Header />
      <div className="flex flex-grow items-center justify-center">
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:px-16 lg:py-12">
          <div className="max-w-xl lg:max-w-3xl bg-white bg-opacity-10 p-8 rounded-lg shadow-lg backdrop-blur-md">
            {!showEmailSent ? (
              <>
                <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                  Reset Your Password
                </h2>
                {email && (
                  <p className="mt-4 text-center text-white">
                    Create a new password for <span className="font-semibold">{email}</span>
                  </p>
                )}

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="password" className="block text-sm font-medium text-white">
                      New Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {error && <div className="col-span-6 text-red-500 text-sm text-center">{error}</div>}
                  {success && !showEmailSent && <div className="col-span-6 text-green-500 text-sm text-center">{success}</div>}

                  <div className="col-span-6">
                    <Button
                      type="submit"
                      variant="attractive"
                      className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Reset Password"}
                    </Button>
                  </div>

                  <div className="col-span-6 text-center">
                    <p className="text-white">
                      Remember your password?{" "}
                      <a href="/login" className="text-indigo-400 hover:text-indigo-300">
                        Sign in
                      </a>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">Check Your Email</h2>
                <div className="bg-indigo-900 bg-opacity-50 p-6 rounded-lg mb-6">
                  <p className="text-white mb-4">
                    We've sent a password reset link to <span className="font-semibold">{email}</span>.
                  </p>
                  <p className="text-white">
                    Please check your inbox and follow the instructions to complete the password reset.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  variant="attractive"
                  className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                >
                  Return to Login
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}

// Loading component for suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-4">Loading reset password page...</h2>
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

// Main component with suspense boundary
export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
} 