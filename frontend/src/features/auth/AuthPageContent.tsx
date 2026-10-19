'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Cloud,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '@/features/auth/AuthContext';
import { Button, Input, Badge, Card, Tabs } from '@/components/design-system';

interface AuthPageContentProps {
  initialMode: 'login' | 'signup';
}

export const AuthPageContent: React.FC<AuthPageContentProps> = ({ initialMode }) => {
  const router = useRouter();
  const { login, signUp, quickDemoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [role, setRole] = useState<'photographer' | 'admin' | 'editor' | 'assistant'>('photographer');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Password Strength Calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Lemah', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Cukup', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Bagus', color: 'bg-indigo-600' };
      case 4:
        return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-600' };
      default:
        return { score: 10, label: 'Lemah', color: 'bg-rose-500' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Harap isi alamat email dan kata sandi Anda.');
        }
        const user = await login(email, password);
        setSuccessMessage(`Selamat datang kembali, ${user.full_name}! Mengalihkan ke dashboard...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      } else {
        // Sign Up
        if (!fullName.trim()) throw new Error('Harap isi nama lengkap Anda.');
        if (!email.trim() || !email.includes('@')) throw new Error('Format email tidak valid.');
        if (password.length < 6) throw new Error('Kata sandi minimal 6 karakter.');
        if (password !== confirmPassword) throw new Error('Konfirmasi kata sandi tidak cocok.');
        if (!agreedToTerms) throw new Error('Harap menyetujui Syarat dan Ketentuan layanan.');

        const user = await signUp({
          full_name: fullName,
          email,
          password,
          studio_name: studioName,
          role,
        });

        setSuccessMessage(`Akun studio ${user.full_name} berhasil dibuat! Mengalihkan ke dashboard...`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 900);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan autentikasi. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (key: 'dani' | 'alex' | 'claire' | 'marcus') => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const demoUser = DEMO_ACCOUNTS[key];
      setEmail(demoUser.email);
      setPassword(demoUser.password);
      const user = await quickDemoLogin(key);
      setSuccessMessage(`Login cepat sebagai ${user.full_name} (${demoUser.title}) berhasil! Mengalihkan...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login demo');
    } finally {
      setLoading(false);
    }
  };

  const authTabItems = [
    { id: 'login', label: 'Masuk' },
    { id: 'signup', label: 'Daftar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center selection:bg-indigo-600 selection:text-white">
      {/* Top Header Navigation (Untitled UI style) */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-xs sm:text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-gray-500" />
          <span>Kembali ke Beranda</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4 stroke-[2.3]" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-base font-sans">
            Lensync
          </span>
          <Badge variant="brand" size="sm">C2C v1.2</Badge>
        </Link>

        <div className="text-xs text-gray-500 hidden sm:flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>TLS 1.3 Studio Encryption</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex items-center justify-center">
        <Card variant="elevated" padding="none" className="w-full grid lg:grid-cols-12 overflow-hidden border border-gray-200 shadow-xl rounded-2xl">
          
          {/* LEFT COLUMN: Visual Showcase & Camera HUD Telemetry */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 xl:p-10 flex-col justify-between relative overflow-hidden">
            {/* Background Studio Light Glow */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            {/* Viewfinder Decorative HUD Grid lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

            {/* Top Brand Showcase */}
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2">
                <Badge variant="dark" size="md" iconLeading={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                  Next-Gen Tethering to Cloud
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
                  Take a Shot.<br />Let It Sync Instan.
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed font-normal">
                  Otomatisasi pengunggahan foto tethering kamera langsung ke Google Drive & Cloud dalam hitungan detik tanpa hambatan memindahkan kartu memori.
                </p>
              </div>

              {/* Viewfinder Camera Card Preview */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="dark" size="sm" dot={true}>
                    SONY ILCE-7M4 ONLINE
                  </Badge>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">RAW + PREVIEW</span>
                </div>

                {/* Viewfinder HUD Mockup Frame */}
                <div className="relative aspect-[16/10] rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="absolute inset-x-4 top-3 flex justify-between text-[10px] font-mono text-slate-400">
                    <span>AF-C [WIDE]</span>
                    <span>BATTERY 94%</span>
                  </div>
                  
                  {/* Rule of Thirds Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Focus Box */}
                  <div className="w-16 h-16 border-2 border-emerald-400/80 rounded-md flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </div>

                  {/* Camera Telemetry Bar */}
                  <div className="absolute inset-x-3 bottom-2.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-200">
                    <span>f/2.8</span>
                    <span>1/500s</span>
                    <span>ISO 100</span>
                    <span>50mm</span>
                  </div>
                </div>

                {/* Dual Stream Highlights */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Fast Preview</div>
                      <div className="font-semibold text-white">&lt; 1 Detik</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Google Drive</div>
                      <div className="font-semibold text-white">Full RAW Auto</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Testimonial */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-300 italic leading-relaxed">
                &ldquo;Lensync memangkas alur kerja pengiriman foto runway Fashion Week dari berjam-jam menjadi seketika. Klien kami dapat meninjau hasil jepretan secara real-time saat show masih berlangsung.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                  AW
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Alexander Wright</div>
                  <div className="text-[11px] text-slate-400">Lead Fashion Photographer, Lumina Paris</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Form (Sign In / Sign Up) */}
          <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-center bg-white">
            
            {/* Mode Switcher Tabs (Using Untitled UI Tabs component) */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-5 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">
                  {mode === 'login' ? 'Masuk ke Studio Workspace' : 'Daftar Akun Studio Baru'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                  {mode === 'login'
                    ? 'Akses live dashboard, pantau antrean sync, dan kelola sesi photoshoot.'
                    : 'Mulai otomatisasi pengunggahan foto kamera studio Anda ke Google Drive.'}
                </p>
              </div>

              {/* Untitled UI Segmented Tabs */}
              <Tabs
                items={authTabItems}
                activeId={mode}
                onChange={(id) => {
                  setMode(id as any);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                variant="segmented"
              />
            </div>

            {/* Quick 1-Click Demo Logins */}
            {mode === 'login' && (
              <div className="mb-6 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick Demo Logins (1-Klik Masuk)</span>
                  </div>
                  <Badge variant="brand" size="sm">Ready to test</Badge>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('dani')}
                    className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                      <span>Dani Nur</span>
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">Lead Photographer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('claire')}
                    className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                      <span>Claire</span>
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">Studio Producer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('marcus')}
                    className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-xs transition-all text-left group hidden sm:block cursor-pointer"
                  >
                    <div className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                      <span>Marcus</span>
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">RAW Retoucher</div>
                  </button>
                </div>
              </div>
            )}

            {/* Error & Success Feedback Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* Auth Form with Untitled UI Input components */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sign Up Exclusive Fields */}
              {mode === 'signup' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <Input
                      label="Nama Lengkap"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dani Nur Adheanto"
                      iconLeading={<User className="w-4 h-4 text-gray-400" />}
                    />

                    {/* Studio / Team Name */}
                    <Input
                      label="Nama Studio / Creative Team"
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="Dani Studio Paris"
                      iconLeading={<Building2 className="w-4 h-4 text-gray-400" />}
                    />
                  </div>

                  {/* Role Selection (Untitled UI Pills) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Peran Anda dalam Workflow Fotografi
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'photographer', label: 'Fotografer' },
                        { id: 'admin', label: 'Lead / Producer' },
                        { id: 'editor', label: 'Retoucher' },
                        { id: 'assistant', label: 'Asisten' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRole(item.id as any)}
                          className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                            role === item.id
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs ring-2 ring-indigo-100'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <Input
                label="Alamat Email Profesional"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@studiofotografi.com"
                iconLeading={<Mail className="w-4 h-4 text-gray-400" />}
              />

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">
                    Kata Sandi (Password)
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => alert('Untuk versi demo pengujian, silakan gunakan kata sandi: pass123 atau pilih Quick Demo Login di atas.')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-colors duration-150 py-2 pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator on Sign Up */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span>Kekuatan Kata Sandi:</span>
                      <span className="font-semibold text-gray-800">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password on Sign Up */}
              {mode === 'signup' && (
                <Input
                  label="Konfirmasi Kata Sandi"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi Anda"
                  iconLeading={<Lock className="w-4 h-4 text-gray-400" />}
                />
              )}

              {/* Terms Checkbox on Sign Up / Remember Me on Login */}
              {mode === 'signup' ? (
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer font-normal">
                    Saya menyetujui <span className="text-indigo-600 font-semibold underline">Ketentuan Layanan</span> dan <span className="text-indigo-600 font-semibold underline">Kebijakan Privasi</span> enkripsi cloud storage Lensync.
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-gray-600 pt-1 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Ingat sesi saya di komputer studio ini</span>
                  </label>
                </div>
              )}

              {/* Submit Button (Using Untitled UI Button) */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  iconTrailing={<ArrowRight className="w-4 h-4 stroke-[2.2]" />}
                  className="w-full justify-center shadow-sm"
                >
                  {mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun Studio'}
                </Button>
              </div>

              {/* Social Login Separator */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <span className="relative px-3 bg-white text-gray-400 text-xs font-medium uppercase tracking-wider">
                  atau
                </span>
              </div>

              {/* Google Workspace / Drive Sign In (Using Untitled UI Secondary Button) */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleQuickLogin('dani')}
                className="w-full justify-center gap-2.5"
                iconLeading={
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                }
              >
                Lanjutkan dengan Google Workspace (Drive Ready)
              </Button>
            </form>

            {/* Switch Mode Prompt */}
            <div className="mt-8 text-center text-xs text-gray-500 font-medium">
              {mode === 'login' ? (
                <p>
                  Belum memiliki akun studio?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1"
                  >
                    Daftar akun baru
                  </button>
                </p>
              ) : (
                <p>
                  Sudah memiliki akun Lensync?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1"
                  >
                    Masuk di sini
                  </button>
                </p>
              )}
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-6 font-medium">
        &copy; {new Date().getFullYear()} Lensync Camera-to-Cloud. Protected by TLS 1.3 & AES-256 cloud encryption.
      </footer>
    </div>
  );
};
