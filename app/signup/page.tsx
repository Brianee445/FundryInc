'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Container } from '@/app/components/ui/Container';
import { GoogleSignInButton } from '@/app/components/ui/GoogleSignInButton';
import { Logo } from '@/app/components/layout/Logo';
import { useAuth } from '@/app/providers/AuthProvider';
import { signupSchema, type SignupFormData } from '@/app/lib/validations/auth';
import { ApiError } from '@/app/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  // The Google button needs a role up front — unlike the email/password
  // form, there's no separate submit step to validate it at, so we read it
  // live and simply keep the button disabled until one is picked.
  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormData) => {
    setError('');
    try {
      await signup(data);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    try {
      await loginWithGoogle(idToken, selectedRole);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background py-16">
      <Container className="mx-auto max-w-[440px]">
        <div className="mb-10 text-center">
          <Logo className="mb-6 justify-center" />
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-secondaryText">Join Fundry as a founder or an investor.</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-card border border-borderColor bg-cardBg p-8"
        >
          {error && (
            <div className="rounded-[14px] border border-error bg-error/10 p-4 text-sm text-error">{error}</div>
          )}

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-secondaryText">
              I am a
            </label>
            <Select id="role" defaultValue="" {...register('role')}>
              <option value="" disabled>
                Select one
              </option>
              <option value="founder">Founder</option>
              <option value="investor">Investor</option>
            </Select>
            {errors.role && <p className="mt-1 text-sm text-error">{errors.role.message}</p>}
          </div>

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
            <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-error">{errors.password.message}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-borderColor" />
          <span className="text-xs uppercase text-secondaryText">or</span>
          <div className="h-px flex-1 bg-borderColor" />
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            disabled={!selectedRole}
            disabledHint="Select whether you're a founder or an investor above first."
          />
        </div>

        <p className="mt-6 text-center text-sm text-secondaryText">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primaryBlue hover:text-hoverBlue">
            Log in
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
