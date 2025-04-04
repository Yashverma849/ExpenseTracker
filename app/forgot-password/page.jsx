"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

// Main content component
function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    try {
      // Call our API to send reset instructions
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: 'temporary-placeholder' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process reset request');
      }

      if (data.success) {
        setSuccess(data.message || "Password reset instructions sent to your email");
        setEmailSent(true);
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Error in forgot password:", err);
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
            {!emailSent ? (
              <>
                <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                  Forgot your password?
                </h2>
                <p className="mt-4 text-center text-white">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="email" className="block text-sm font-medium text-white">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter your email address"
                    />
                  </div>

                  {error && (
                    <div className="col-span-6 text-red-500 text-sm p-2 bg-red-100 bg-opacity-20 rounded text-center">
                      {error}
                    </div>
                  )}
                  
                  {success && !emailSent && (
                    <div className="col-span-6 text-green-500 text-sm p-2 bg-green-100 bg-opacity-20 rounded text-center">
                      {success}
                    </div>
                  )}

                  <div className="col-span-6">
                    <Button
                      type="submit"
                      variant="attractive"
                      className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Send Reset Instructions"}
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
                    We've sent password reset instructions to <span className="font-semibold">{email}</span>
                  </p>
                  <p className="text-white">
                    Please check your inbox and follow the instructions in the email.
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

// Loading component
function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-4">Loading forgot password page...</h2>
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-r-transparent border-b-indigo-500 border-l-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

// Main component with suspense boundary
export default function ForgotPassword() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordContent />
    </Suspense>
  );
} 