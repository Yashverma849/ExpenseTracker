"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const router = useRouter();

  // state variables
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
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
              Set New Password
            </h2>
            <p className="mt-4 text-center text-white">
              Please enter your new password below.
            </p>

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
              {success && <div className="col-span-6 text-green-500 text-sm text-center">{success}</div>}

              <div className="col-span-6">
                <Button
                  type="submit"
                  variant="attractive"
                  className="w-full px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
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