"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

export default function Login() {
  const router = useRouter();

  // state variables
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess("");

    if (isResetMode) {
      // Handle password reset request
      console.log(`Requesting password reset for email: ${email}`);
      console.log(`Redirect URL: ${window.location.origin}/reset-password`);
      
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || `${window.location.origin}/reset-password`,
        });
        
        console.log("Reset password response:", data ? "Data received" : "No data", error || "No error");
        
        if (error) {
          console.error("Reset password error:", error);
          setError(error.message);
        } else {
          console.log("Reset password email sent successfully");
          setSuccess(
            "Reset password link sent to your email. Please check your inbox and spam folders. " +
            "The link will expire in 24 hours."
          );
        }
      } catch (err) {
        console.error("Exception during reset password:", err);
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Handle normal login
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setSuccess("Login successful! Redirecting...");
          setTimeout(() => router.push("/dashboard"), 2000); // Redirect after 2 seconds
        } else {
          setError("Failed to authenticate user.");
        }
        setLoading(false);
      }
    }
  };

  // Toggle between login and reset password modes
  const toggleResetMode = (e) => {
    e.preventDefault();
    setIsResetMode(!isResetMode);
    setError(null);
    setSuccess("");
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
              {isResetMode ? "Reset your password" : "Sign in to your account"}
            </h2>

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

              {!isResetMode && (
                <div className="col-span-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-white">
                      Password
                    </label>
                    <button 
                      onClick={toggleResetMode} 
                      className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {error && <div className="col-span-6 text-red-500 text-sm text-center">{error}</div>}
              {success && <div className="col-span-6 text-green-500 text-sm text-center">{success}</div>}

              <div className="col-span-6">
                <Button
                  type="submit"
                  variant="attractive"
                  className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                  disabled={loading}
                >
                  {loading 
                    ? (isResetMode ? "Sending..." : "Signing in...") 
                    : (isResetMode ? "Send Reset Link" : "Sign in")}
                </Button>
              </div>
              
              {isResetMode && (
                <div className="col-span-6 text-center">
                  <button 
                    onClick={toggleResetMode}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </section>
  );
}