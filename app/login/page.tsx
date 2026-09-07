'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Container } from '@/app/components/ui/Container';
import { GoogleSignInButton } from '@/app/components/ui/GoogleSignInButton';
import { Logo } from '@/app/components/layout/Logo';
import { useAuth } from '@/app/providers/AuthProvider';
import { loginSchema, type LoginFormData } from '@/app/lib/validations/auth';
import { ApiError } from '@/app/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    try {
      await login(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    try {
      await loginWithGoogle(idToken);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 428) {
        // No Fundry account exists for this Google account yet — login
        // can't create one without a role, so send them to signup instead
        // of asking for a role here.
        setError("We couldn't find an account for that Google sign-in. Head to Sign up to create one.");
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background py-16">
      <Container className="mx-auto max-w-[440px]">
        <div className="mb-10 text-center">
          <Logo className="mb-6 justify-center" />
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-secondaryText">Log in to your Fundry account.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-card border border-borderColor bg-cardBg p-8"
        >
          {error && (
            <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-secondaryText">
              Email Address
            </label>
            <Input id="email" type="email" placeholder="you@startup.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-sm text-error">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-secondaryText">
              Password
            </label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-borderColor" />
          <span className="text-xs uppercase text-secondaryText">or</span>
          <div className="h-px flex-1 bg-borderColor" />
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <p className="mt-6 text-center text-sm text-secondaryText">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primaryBlue hover:text-hoverBlue">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-secondaryText">
          <Link href="/" className="hover:text-primaryText">
            &larr; Back to home
          </Link>
        </p>
      </Container>
    </main>
  );
}
