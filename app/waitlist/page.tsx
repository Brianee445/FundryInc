'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { CheckCircle, Shield, Clock, Award } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/Select';
import { Container } from '@/app/components/ui/Container';
import { Logo } from '@/app/components/layout/Logo';
import { apiPost, ApiError } from '@/app/lib/api';

// Matches the backend's WaitlistCreate schema exactly:
// { email: EmailStr, role: "founder" | "investor" | "advisor" | "accelerator" }
const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['founder', 'investor', 'advisor', 'accelerator']),
});

type FormData = z.infer<typeof schema>;

interface WaitlistResponse {
  success: boolean;
  message: string;
}

const BENEFITS = [
  { icon: Clock, title: 'Priority Access', desc: 'Be the first to join when we launch.' },
  { icon: Shield, title: 'Verification Discount', desc: 'Get 50% off KYC verification fees.' },
  { icon: Award, title: 'Exclusive Interviews', desc: 'Access to premium founder stories.' },
  { icon: CheckCircle, title: 'Early Launch Rewards', desc: 'Special perks for early adopters.' },
];

export default function WaitlistPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      // Trailing slash is required — the backend route is defined as
      // @router.post("/") under prefix "/api/v1/waitlist", so the real
      // path is "/api/v1/waitlist/". Without the slash, FastAPI 307-redirects,
      // which breaks the CORS preflight on a cross-origin POST.
      const result = await apiPost<WaitlistResponse>('/api/v1/waitlist/', data);
      if (result.success) {
        setSuccess(true);
        reset();
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col justify-center bg-background py-16">
      <Container className="mx-auto max-w-[700px]">
        <div className="mb-12 text-center">
          <Logo className="mb-6 justify-center" />
          <h1 className="text-4xl font-bold md:text-5xl">Join the Future of Startup Funding</h1>
          <p className="mt-2 text-lg text-secondaryText">Get exclusive early access to Fundry.</p>
        </div>

        {success ? (
          <div className="rounded-card border border-borderColor bg-cardBg p-8 text-center">
            <CheckCircle size={56} className="mx-auto mb-4 text-success" />
            <h2 className="text-2xl font-bold">You&apos;re on the list!</h2>
            <p className="mt-2 text-secondaryText">We&apos;ll notify you the moment we launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-card border border-borderColor bg-cardBg p-8">
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
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-secondaryText">
                I am a
              </label>
              <Select id="role" defaultValue="" {...register('role')}>
                <option value="" disabled>
                  Select one
                </option>
                <option value="founder">Founder</option>
                <option value="investor">Investor</option>
                <option value="advisor">Advisor</option>
                <option value="accelerator">Accelerator</option>
              </Select>
              {errors.role && <p className="mt-1 text-sm text-error">{errors.role.message}</p>}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </Button>

            <div className="text-center text-sm text-secondaryText">
              <span>2,300+ already waiting</span>
            </div>
          </form>
        )}

        <div className="mt-12 grid grid-cols-2 gap-4">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col items-center rounded-[16px] border border-borderColor bg-secondaryBg/50 p-4 text-center"
            >
              <benefit.icon size={24} className="mb-2 text-primaryBlue" />
              <h4 className="text-sm font-semibold">{benefit.title}</h4>
              <p className="text-xs text-secondaryText">{benefit.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-secondaryText">
          <Link href="/" className="hover:text-primaryText">
            &larr; Back to home
          </Link>
        </p>
      </Container>
    </main>
  );
}
