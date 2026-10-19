import { Metadata } from 'next';
import { AuthPageContent } from '@/features/auth/AuthPageContent';

export const metadata: Metadata = {
  title: 'Daftar Akun Studio | Camera-to-Cloud',
  description: 'Daftar akun baru Lensync Camera-to-Cloud untuk otomatisasi pengunggahan foto kamera langsung ke Google Drive & Cloud.',
};

export default function SignUpPage() {
  return <AuthPageContent initialMode="signup" />;
}
