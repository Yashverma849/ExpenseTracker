"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const router = useRouter();

  // state variables
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess("");

    try {
      if (!email) {
        throw new Error("Email is required");
      }
      
      // Skip verification and directly redirect to reset-password page
      setSuccess("Redirecting to reset password page...");
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 2000);
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
            <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Forgot Your Password
            </h2>
            <p className="mt-4 text-center text-white">
              Enter your email address to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && <div className="col-span-6 text-red-500 text-sm text-center">{error}</div>}
              {success && <div className="col-span-6 text-green-500 text-sm text-center">{success}</div>}

              <div className="col-span-6">
                <Button
                  type="submit"
                  variant="attractive"
                  className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Continue to Reset Password"}
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
          </div>
        </main>
      </div>
    </section>
  );
} 