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
  const [session, setSession] = useState(null);
  const [hash, setHash] = useState("");
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    console.log("ResetPassword page mounted");
    
    // Get the hash from the URL if it exists (Supabase auth redirects with hash parameters)
    if (typeof window !== "undefined") {
      console.log("Current URL:", window.location.href);
      
      // Extract access token from URL if present
      const hashParams = window.location.hash;
      console.log("URL hash parameters:", hashParams);
      
      if (hashParams) {
        setHash(hashParams);
        
        // Try to extract the access token
        const params = new URLSearchParams(hashParams.substring(1)); // Remove the # character
        const token = params.get("access_token");
        if (token) {
          console.log("Found access token in URL");
          setAccessToken(token);
        }
      }
    }

    const checkSession = async () => {
      try {
        // Check if we have a session already
        console.log("Checking authentication session...");
        const { data, error: sessionError } = await supabase.auth.getSession();
        console.log("Session data:", data);
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Error checking authentication session.");
          return;
        }

        if (data?.session) {
          console.log("Active session found:", data.session.user.email);
          setSession(data.session);
        } else {
          console.log("No active session found, checking for auth callback...");
          // If no session, check if we're in the auth callback flow
          if (hash) {
            try {
              console.log("Processing authentication callback...");
              // Exchange the access token in the URL for a session
              const { data: refreshData, error: callbackError } = await supabase.auth.refreshSession();
              console.log("Refresh session result:", { refreshData, callbackError });
              
              if (callbackError) {
                console.error("Auth callback error:", callbackError);
                // Don't set an error, let user try password reset anyway
              } else {
                // Get the session again after refresh
                console.log("Session refreshed, getting updated session...");
                const { data: refreshedSession } = await supabase.auth.getSession();
                console.log("Updated session data:", refreshedSession);
                
                if (refreshedSession?.session) {
                  console.log("Session established after refresh");
                  setSession(refreshedSession.session);
                }
              }
            } catch (err) {
              console.error("Auth handling error:", err);
              // Don't set an error, let user try password reset anyway
            }
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
        // Continue anyway, let user try password reset
      }
    };

    checkSession();
  }, [hash]);

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
      console.log("Updating password...");
      
      let updateResult;
      
      // If we have a session, use updateUser directly
      if (session) {
        console.log("Using session to update password");
        updateResult = await supabase.auth.updateUser({
          password: password,
        });
      } 
      // If we have an access token from the URL, try to use it
      else if (accessToken) {
        console.log("Using access token to update password");
        // Set the auth token manually first
        supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
        updateResult = await supabase.auth.updateUser({
          password: password,
        });
      }
      // Fallback to just trying the update (works in some Supabase versions)
      else {
        console.log("Attempting password update without session");
        updateResult = await supabase.auth.updateUser({
          password: password,
        });
      }
      
      const { data, error } = updateResult || { error: { message: "Failed to update password" } };
      console.log("Update password result:", { data, error });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Password update error:", err);
      setError("An error occurred. Please try again.");
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
                {!session && !accessToken && (
                  <div className="mt-2">
                    <Button
                      onClick={() => router.push("/password-reset")}
                      variant="attractive"
                      className="px-3 py-2 text-sm font-medium rounded-md shadow-sm"
                    >
                      Request New Reset Link
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Always show the form regardless of session state */}
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