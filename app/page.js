// filepath: /c:/Users/verma/expensetracker/app/page.js
import React from 'react';
import Image from 'next/image';
import Header from '@/app/_components/Header'; // Correct import path
import Hero from '@/app/_components/Hero'; // Correct import path

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
    </div>
  );
}