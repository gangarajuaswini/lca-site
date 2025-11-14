'use client';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import HowIWork from '@/components/HowIWork';
import WhatIDo from '@/components/WhatIDo';
import CustomerReviews from '@/components/CustomerReviews';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <HowIWork />
      <WhatIDo />
      <CustomerReviews />
      <Footer />
    </main>
  );
}
