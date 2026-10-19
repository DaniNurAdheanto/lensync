import React, { useState } from 'react';
import { Camera, ArrowRight, Menu, X, Code2, Sparkles } from 'lucide-react';
import { Button } from '../design-system/Button';
import { Badge } from '../design-system/Badge';

interface NavbarProps {
  onOpenGetStarted: () => void;
  onOpenLogin: () => void;
  onToggleWorkbench: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGetStarted,
  onOpenLogin,
  onToggleWorkbench,
  activeSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#home', id: 'home' },
    { label: 'Features', href: '#features', id: 'features' },
    { label: 'How It Works', href: '#how-it-works', id: 'how-it-works' },
    { label: 'Pricing', href: '#pricing', id: 'pricing' },
    { label: 'FAQ', href: '#faq', id: 'faq' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>Camera-to-Cloud v1.0 Foundation is Ready.</span>
        </span>
        <button
          onClick={onToggleWorkbench}
          className="underline hover:text-indigo-200 font-semibold cursor-pointer inline-flex items-center gap-1 ml-1"
        >
          <span>Buka Monorepo & Architecture Explorer</span>
          <ArrowRight className="w-3 h-3 inline" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-gray-900 tracking-tight font-sans">
                Camera-to-Cloud
              </span>
            </div>
          </a>

          {/* Desktop Center Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Desktop Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onToggleWorkbench}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              title="Lihat kode Go Backend, Desktop Agent & Schema"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dev Workbench</span>
            </button>

            <Button
              variant="tertiary"
              size="md"
              onClick={onOpenLogin}
              className="text-gray-700 hover:text-gray-900"
            >
              Login
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onOpenGetStarted}
              className="rounded-lg shadow-sm"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleWorkbench();
              }}
              iconLeading={<Code2 className="w-4 h-4 text-indigo-600" />}
              className="w-full justify-center"
            >
              Buka Dev Workbench
            </Button>

            <Button
              variant="tertiary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full justify-center"
            >
              Login
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenGetStarted();
              }}
              className="w-full justify-center"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
