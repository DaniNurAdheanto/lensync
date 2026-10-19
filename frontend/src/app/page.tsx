'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesShowcaseSection } from '@/components/landing/FeaturesShowcaseSection';
import { CameraCompatibilitySection } from '@/components/landing/CameraCompatibilitySection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';
import { Footer } from '@/components/landing/Footer';
import { GetStartedModal } from '@/components/landing/GetStartedModal';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isGetStartedOpen, setIsGetStartedOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'how-it-works', 'pricing', 'faq'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLaunchSession = (config: any) => {
    setIsGetStartedOpen(false);
    // Navigate to live shoot dashboard
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar
        onOpenGetStarted={() => router.push('/signup')}
        onOpenLogin={() => router.push('/login')}
        onToggleWorkbench={() => router.push('/dashboard')}
        activeSection={activeSection}
      />

      <main className="flex-1">
        <HeroSection
          onStartClick={() => router.push('/signup')}
          onHowItWorksClick={() => {
            const el = document.getElementById('how-it-works');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <HowItWorksSection />
        <FeaturesShowcaseSection />
        <CameraCompatibilitySection />
        <PricingSection onSelectPlan={() => router.push('/signup')} />
        <FaqSection />
        <CtaBannerSection onStartClick={() => router.push('/signup')} />
      </main>

      <Footer onToggleWorkbench={() => router.push('/dashboard')} />

      <GetStartedModal
        isOpen={isGetStartedOpen}
        onClose={() => setIsGetStartedOpen(false)}
        onLaunchLiveSession={handleLaunchSession}
      />
    </div>
  );
}
