"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
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
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset email sent! Please check your inbox.");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
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
              Reset Your Password
            </h2>
            <p className="mt-4 text-center text-white">
              Enter your email address and we'll send you a link to reset your password.
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
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>

              <div className="col-span-6 text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-white hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
} 