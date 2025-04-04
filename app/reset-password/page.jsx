"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // state variables
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [session, setSession] = useState(null);
  const [resetCode, setResetCode] = useState("");

  useEffect(() => {
    console.log("ResetPassword page mounted");
    
    // Get the code from URL query parameters (Next.js way)
    const code = searchParams.get('code');
    console.log("Reset code from URL:", code);
    
    if (code) {
      setResetCode(code);
    }

    // Check session status
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        } else if (data?.session) {
          console.log("Active session found:", data.session);
          setSession(data.session);
        } else {
          console.log("No active session found");
          
          // If we have a reset code, we can verify it
          if (code) {
            try {
              // Use the verification code to get a session
              console.log("Verifying reset code...");
              const { data, error } = await supabase.auth.verifyOtp({
                type: 'recovery',
                token: code,
              });
              
              console.log("Reset code verification result:", { data, error });
              
              if (error) {
                console.error("Code verification error:", error);
                setError("Invalid or expired reset code. Please request a new password reset link.");
              } else if (data?.session) {
                console.log("Session established from reset code");
                setSession(data.session);
              }
            } catch (err) {
              console.error("Error verifying reset code:", err);
            }
          }
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkSession();
  }, [searchParams]);

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess("");

    try {
      console.log("Attempting to update password");
      
      // Now attempt to update the password
      console.log("Updating password...");
      const { data, error } = await supabase.auth.updateUser({ password });
      
      console.log("Update result:", { data, error });
      
      if (error) {
        console.error("Password update error:", error);
        
        // Special handling for common errors
        if (error.message.includes("session")) {
          setError("Authentication error. Please request a new password reset link.");
        } else {
          setError(error.message);
        }
      } else {
        setSuccess("Password updated successfully! Redirecting to login...");
        
        // Clear query parameters from URL before redirecting
        if (typeof window !== "undefined") {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setError("An error occurred. Please try again or request a new password reset link.");
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
              Enter and confirm your new password below.
            </p>

            {error && (
              <div className="mt-4 text-red-500 text-center">
                {error}
                {error.includes("Authentication") || error.includes("expired") ? (
                  <div className="mt-2">
                    <Button
                      onClick={() => router.push("/password-reset")}
                      variant="attractive"
                      className="px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                    >
                      Request New Reset Link
                    </Button>
                  </div>
                ) : null}
              </div>
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
                <label htmlFor="confirm-password" className="block text-sm font-medium text-white">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

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
            </form>
          </div>
        </main>
      </div>
    </section>
  );
} 