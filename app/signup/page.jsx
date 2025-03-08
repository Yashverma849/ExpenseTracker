"use client";

import React, { useState } from "react";
import Header from "../_components/Header";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, passwordConfirmation } = formData;

    if (!firstName || !lastName || !email || !password || !passwordConfirmation) {
      setError("All fields are required");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: `${firstName} ${lastName}` } },
    });

    if (error) {
      setError(error.message);
    } else {
      setAlertMessage("Account created successfully!");
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        window.location.href = "/dashboard";
      }, 2000);
    }

    setLoading(false);
  };

  return (
    <section
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/pexels-adrien-olichon-1257089-2387793.jpg')" }}
    >
      <Header />
      <div className="flex flex-grow items-center justify-center">
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:px-16 lg:py-12">
          <div className="max-w-xl lg:max-w-3xl bg-white bg-opacity-10 p-8 rounded-lg shadow-lg backdrop-blur-md">
            <div className="flex justify-center">
              <Image src="/finz-removebg-preview.png" alt="logo" width={100} height={100} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Welcome To Finzarc
            </h1>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
              {["firstName", "lastName", "email", "password", "passwordConfirmation"].map(
                (field, index) => (
                  <div
                    key={field}
                    className={`col-span-6 ${index < 2 ? "sm:col-span-3" : ""}`}
                  >
                    <label htmlFor={field} className="block text-sm font-medium text-white">
                      {field.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      type={field.includes("password") ? "password" : "text"}
                      id={field}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )
              )}

              {error && <div className="col-span-6 text-red-500 text-sm">{error}</div>}

              <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-all"
                >
                  {loading ? "Creating Account..." : "Create an account"}
                </Button>
                <p className="mt-4 text-sm text-gray-300 sm:mt-0">
                  Already have an account?{" "}
                  <a href="/login" className="text-gray-100 underline">
                    Log in
                  </a>
                  .
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>

      {showAlert && (
        <Alert className="mb-4 fixed bottom-5 left-1/2 transform -translate-x-1/2 w-full max-w-xs bg-green-600 text-white">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}

export default Signup;