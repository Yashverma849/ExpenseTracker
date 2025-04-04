"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/_components/Header";
import { Button } from "@/components/ui/button";

function Hero() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && sectionRef.current) {
          sectionRef.current.classList.add("fade-in");
          sectionRef.current.classList.remove("fade-out");
        } else if (sectionRef.current) {
          sectionRef.current.classList.add("fade-out");
          sectionRef.current.classList.remove("fade-in");
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const handleGetStarted = () => {
    router.push(isAuthenticated ? "/dashboard" : "/signup");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-cover bg-center relative pb-16"
      style={{ backgroundImage: "url('/pexels-adrien-olichon-1257089-2387793.jpg')" }}
    >
      <Header />

      {/* Hero Section */}
      <section
        ref={sectionRef}
        className="flex flex-col items-center justify-center flex-grow pb-16 px-6 fade-in"
      >
        <div className="max-w-screen-xl mx-auto text-center py-20">
          <div className="w-full max-w-4xl px-4 mx-auto mt-8 flex justify-center pb-16">
            <Image
              src="/Finz.png"
              alt="Finz Logo - Expense Tracking"
              width={250}
              height={250}
              className="rounded-2xl shadow-lg flex justify-center"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            <span className="text-primary block">
              Quick Overview Of Your Expenses
            </span>
            <span className="text-primary block">
              Get Detailed Analysis About Your Expenses
            </span>
          </h1>

          <p className="mt-4 sm:text-xl text-white italic">
            Get a detailed analysis of your expenses.
          </p>

          <div className="col-span-6 pt-10">
            <Button
              type="submit"
              variant="attractive"
              className="px-3 py-2 text-lg font-lg rounded-md shadow-xs"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Image Section */}
      <div className="w-full max-w-4xl px-4 mx-auto mt-8">
        <Image
          src="/Untitled_design__1_-removebg-preview.png"
          alt="Expense Dashboard Preview"
          width={900}
          height={600}
          className="rounded-2xl shadow-lg"
          priority
        />
      </div>
    </div>
  );
}

export default Hero;