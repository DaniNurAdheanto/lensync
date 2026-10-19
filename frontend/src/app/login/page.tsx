import { Metadata } from 'next';
import { AuthPageContent } from '@/features/auth/AuthPageContent';

export const metadata: Metadata = {
  title: 'Masuk ke Studio Workspace | Camera-to-Cloud',
  description: 'Masuk ke akun Lensync Camera-to-Cloud untuk memantau sinkronisasi tethering kamera secara real-time.',
};

export default function LoginPage() {
  return <AuthPageContent initialMode="login" />;
}
