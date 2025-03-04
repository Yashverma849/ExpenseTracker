"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/app/_components/Header';

function Hero() {
  const router = useRouter();

  const handleGetStarted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // User is signed in, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not signed in, redirect to sign-in page
      router.push('/signup');
    }
  };

  return (
    <section className="bg-gray-50 flex items-center flex-col pb-16">
      <div className="mx-auto max-w-screen-xl px-4 py-32 m:flex m:h-screen m:items-center">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-3xl font-extrabold sm:text-5xl">
            Get A Quick 
            <strong className="font-extrabold text-primary sm:block"> Overview Of Your Expenses. </strong>
          </h1>

          <p className="mt-4 sm:text-xl/relaxed">
            Get Detailed Analysis About Your Expenses.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              className="block w-full rounded-sm bg-primary px-12 py-3 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-3 focus:outline-hidden sm:w-auto"
              onClick={handleGetStarted}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center w-full pb-16">
        <Image src="/Screenshot 2025-02-22 041333.png" alt="logo" width={1000} height={1000} />
      </div>
    </section>
  );
}

export default Hero;