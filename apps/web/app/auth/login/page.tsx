import LoginClient from './login-client';

export const metadata = {
  title: 'Login | Grows',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-background px-4">
      <LoginClient />
    </div>
  );
}
