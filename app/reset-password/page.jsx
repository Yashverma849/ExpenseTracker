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
  const [isReady, setIsReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [countdown, setCountdown] = useState(0);
  
  // Check for auth session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        console.log("Checking for active session...");
        
        // Log URL hash for debugging - Supabase uses URL fragments for auth
        console.log("URL hash:", window.location.hash);
        
        const { data, error } = await supabase.auth.getSession();
        console.log("Session data:", data?.session ? "Session exists" : "No session");
        
        if (error) {
          console.error("Session error:", error);
          setError("Error verifying your session: " + error.message);
          setCheckingSession(false);
          return;
        }
        
        // If no session, check if there's an access token in the URL
        // Supabase might still be processing the auth link
        if (!data.session) {
          console.log("No active session found. Checking for auth parameters in URL...");
          
          // Look for auth callback in URL - Supabase often uses URL fragments/hash
          const hasAuthParams = window.location.hash.includes('access_token') || 
                               window.location.hash.includes('error_description');
          
          if (hasAuthParams) {
            console.log("Auth parameters found in URL, handling auth state change...");
            // Process the URL parameters - this will establish the session
            await supabase.auth.getSession();
            
            // Wait a moment and check again for the session
            setTimeout(async () => {
              const { data: refreshData, error: refreshError } = await supabase.auth.getSession();
              
              if (refreshError || !refreshData.session) {
                console.error("Failed to establish session:", refreshError);
                setError("Invalid or expired password reset link. Please request a new one.");
                setCheckingSession(false);
                return;
              }
              
              console.log("Session established successfully");
              setIsReady(true);
              setSuccess("Password reset session verified successfully. You can now set a new password.");
              setCheckingSession(false);
            }, 1000);
            
            return;
          }
          
          // No session and no auth params in URL - invalid reset attempt
          console.log("No session or auth parameters");
          setError("Invalid password reset link. Please request a new one.");
          setCheckingSession(false);
          
          // Redirect after a delay
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          
          return;
        }
        
        // Session exists - user can reset password
        console.log("Valid session found, user can reset password");
        setIsReady(true);
        setCheckingSession(false);
        
      } catch (e) {
        console.error("Error in session check:", e);
        setError("An unexpected error occurred. Please try again.");
        setCheckingSession(false);
      }
    }
    
    checkSession();
  }, [router]);
  
  // Add meta refresh tag when password is updated successfully
  useEffect(() => {
    if (success) {
      // Create a meta refresh tag as a backup redirection method
      const meta = document.createElement('meta');
      meta.httpEquiv = 'refresh';
      meta.content = '2;url=/dashboard';
      document.head.appendChild(meta);
      
      return () => {
        document.head.removeChild(meta);
      };
    }
  }, [success]);
  
  // Handle password update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError("");
    setSuccess("");
    setCountdown(0);
    
    // Set up a failsafe redirect in case the main one fails
    let redirectTimer = null;
    const failsafeRedirect = () => {
      console.log("Executing failsafe redirect");
      window.location.href = '/dashboard';
    };
    redirectTimer = setTimeout(failsafeRedirect, 5000);
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      clearTimeout(redirectTimer);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      clearTimeout(redirectTimer);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Updating password...");
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Password update error:", error);
        clearTimeout(redirectTimer);
        throw error;
      }
      
      console.log("Password updated successfully");
      setSuccess("Password updated successfully! Redirecting to dashboard...");
      
      // Force immediate redirect to dashboard
      console.log("Executing immediate redirect to dashboard");
      
      // Try multiple redirection approaches to ensure one works
      try {
        // Method 1: Direct location change (most reliable)
        window.location.href = '/dashboard';
        
        // The methods below are fallbacks and likely won't execute
        // due to the page navigating away, but included just in case
      } catch (e) {
        console.error("Error during redirect:", e);
        
        // Method 2: Try timeout approach
        setTimeout(() => {
          console.log("Redirect method 2");
          window.location.replace('/dashboard');
        }, 100);
        
        // Method 3: Another fallback
        setTimeout(() => {
          console.log("Redirect method 3");
          document.location.href = '/dashboard';
        }, 200);
      }
      
    } catch (error) {
      console.error("Error in password update:", error);
      setError(error.message || "Failed to update password. Please try again.");
      clearTimeout(redirectTimer);
      setCountdown(0);
    } finally {
      setLoading(false);

      // Final failsafe - if we're still on this page, force navigate
      setTimeout(() => {
        if (window.location.pathname === '/reset-password') {
          console.log("Final forced redirection");
          window.location.replace('/dashboard');
        }
      }, 1000);
    }
  };
  
  // Render loading state while checking session
  if (checkingSession) {
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
          <div className="bg-white bg-opacity-10 p-8 rounded-lg shadow-lg backdrop-blur-md">
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-white">Verifying your password reset session...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // Main form or error display
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
            {!isReady ? (
              // Error state - invalid session
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Password Reset Error</h2>
                <div className="mt-4 text-red-400">{error}</div>
                <p className="mt-2 text-white text-sm">Redirecting to login page...</p>
              </div>
            ) : (
              // Valid session - show password reset form
              <>
                <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                  Reset your password
                </h2>
                <p className="text-center mt-2 text-white text-sm">
                  Enter your new password below
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-white">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-gray-300 focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                      Confirm Password
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
                  {success && (
                    <div className="col-span-6 text-center">
                      <div className="text-green-500 text-sm mb-1">{success}</div>
                      <div className="flex justify-center items-center">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-xs text-white">
                          Redirecting to dashboard{countdown > 0 ? ` in ${countdown}...` : '...'}
                        </span>
                      </div>
                    </div>
                  )}

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
                      onClick={() => router.push('/login')}
                      type="button"
                      disabled={loading || success}
                      className={`text-sm font-medium ${loading || success ? 'text-indigo-400/50 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </section>
  );
} 