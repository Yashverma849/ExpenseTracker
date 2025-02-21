"use client"; // Add this directive at the top

import React, { useState } from 'react';
import Header from '../_components/Header';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';

function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      // Redirect to the login page or home page
      window.location.href = '/login';
    }
  };

  return (
    <section className="bg-white">
      <Header />
      <div className="m:grid m:min-h-screen m:grid-cols-12">
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-xl lg:max-w-3xl">
            <a className="block text-blue-600" href="#">
              <span className="sr-only">Home</span>
              <Image
                src="/Finzarc-removebg-preview.png"
                alt="logo"
                width={100}
                height={100}
              />
            </a>

            <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
              Welcome To Finzarc
            </h1>

            <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="FirstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="FirstName"
                  name="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="LastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="LastName"
                  name="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="Email" className="block text-sm font-medium text-gray-700"> Email </label>
                <input
                  type="email"
                  id="Email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="Password" className="block text-sm font-medium text-gray-700"> Password </label>
                <input
                  type="password"
                  id="Password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="PasswordConfirmation" className="block text-sm font-medium text-gray-700">
                  Password Confirmation
                </label>
                <input
                  type="password"
                  id="PasswordConfirmation"
                  name="password_confirmation"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="mt-1 w-full rounded-md border-2 border-gray-300 bg-white text-sm text-gray-700 shadow-xs hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500"
                />
              </div>

              {error && <div className="col-span-6 text-red-500 text-sm">{error}</div>}

              <div className="col-span-6 sm:flex sm:items-center sm:gap-4">
                <button
                  type="submit"
                  className="inline-block shrink-0 rounded-md border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-transparent hover:text-blue-600 focus:ring-3 focus:outline-hidden"
                >
                  Create an account
                </button>

                <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                  Already have an account?
                  <a href="/login" className="text-gray-700 underline">Log in</a>.
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
}

export default Signup;