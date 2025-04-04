"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Header from "../_components/Header";
import { Button } from "@/components/ui/button";

// Create a client component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // state variables
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(true);
  const [success, setSuccess] = useState("");
  const [session, setSession] = useState(null);
  const [resetCode, setResetCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);

  useEffect(() => {
    console.log("ResetPassword page mounted");
    let isMounted = true;
    
    // Get the code from URL query parameters (Next.js way)
    const code = searchParams?.get('code');
    console.log("Reset code from URL:", code);
    
    if (code) {
      setResetCode(code);
      
      // Immediately try to verify the OTP code
      const verifyCode = async () => {
        try {
          console.log("Verifying reset code:", code);
          setValidatingCode(true);
          
          // Use the verification code to get a session
          const { data, error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token: code,
          });
          
          console.log("Reset code verification result:", { data, error });
          
          if (!isMounted) return;
          
          if (error) {
            console.error("Code verification error:", error);
            setError("Invalid or expired reset code. Please request a new password reset link.");
            setValidatingCode(false);
          } else if (data?.session) {
            console.log("Session established from reset code");
            setSession(data.session);
            setCodeVerified(true);
            setValidatingCode(false);
          } else {
            setError("Could not verify the reset code. Please request a new password reset link.");
            setValidatingCode(false);
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Error verifying reset code:", err);
          setError("An error occurred while verifying your reset code. Please try again.");
          setValidatingCode(false);
        }
      };
      
      verifyCode();
    } else {
      setValidatingCode(false);
      setError("No reset code found in URL. Please request a password reset link.");
    }
    
    return () => {
      isMounted = false;
    };
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
        console.log("Password updated successfully:", data);
        setSuccess("Password updated successfully! Redirecting to login...");
        
        // Clear query parameters from URL before redirecting
        if (typeof window !== "undefined") {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        
        // Sign out the user to clear the recovery session
        await supabase.auth.signOut();
        
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setError("An error occurred. Please try again or request a new password reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (validatingCode) {
    return (
      <div className="max-w-xl lg:max-w-3xl bg-white bg-opacity-10 p-8 rounded-lg shadow-lg backdrop-blur-md">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
          Verifying Reset Code
        </h2>
        <p className="mt-4 text-center text-white">
          Please wait while we verify your password reset code...
        </p>
        <div className="flex justify-center mt-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
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
          {error.includes("Authentication") || error.includes("expired") || error.includes("reset code") ? (
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

      {!error && (
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
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Updating Password...</span>
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Loading fallback for the Suspense boundary
function ResetPasswordLoading() {
  return (
    <div className="max-w-xl lg:max-w-3xl bg-white bg-opacity-10 p-8 rounded-lg shadow-lg backdrop-blur-md">
      <h2 className="text-center text-2xl font-bold text-white sm:text-3xl md:text-4xl">
        Set New Password
      </h2>
      <p className="mt-4 text-center text-white">
        Loading...
      </p>
      <div className="flex justify-center mt-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPassword() {
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
          <Suspense fallback={<ResetPasswordLoading />}>
            <ResetPasswordForm />
          </Suspense>
        </main>
      </div>
    </section>
  );
} 