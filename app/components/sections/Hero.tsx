import { ArrowRight, ShieldCheck, Users, Rocket } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
      <div className="pointer-events-none absolute right-[-10%] top-[-30%] h-[600px] w-[600px] rounded-full bg-primaryBlue/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-accentCyan/10 blur-[100px]" />

      <Container className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
        <div className="animate-fade-in space-y-8">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
            Raise Capital. <br />
            <span className="text-primaryBlue">Build the Future.</span>
          </h1>
          <p className="max-w-md text-xl text-secondaryText">
            Connecting ambitious founders with investors ready to fund the next generation of innovation.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/waitlist">
              <Button variant="primary" size="lg" className="text-base">
                Join Waitlist <ArrowRight size={20} />
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              Explore Startups
            </Button>
          </div>
        </div>

        <div className="relative hidden animate-fade-in justify-center lg:flex" style={{ animationDelay: '0.15s' }}>
          <div className="relative h-[400px] w-full max-w-md">
            <div className="absolute left-0 top-0 w-60 rounded-card border border-borderColor bg-cardBg p-6 shadow-card">
              <div className="mb-2 flex items-center gap-3">
                <ShieldCheck className="text-primaryBlue" size={24} />
                <span className="font-semibold">Verified Founder</span>
              </div>
              <p className="text-sm text-secondaryText">Jane Doe · Pre-seed</p>
            </div>
            <div className="absolute bottom-10 right-0 w-64 rounded-card border border-borderColor bg-cardBg p-6 shadow-card">
              <div className="mb-2 flex items-center gap-3">
                <Rocket className="text-accentCyan" size={24} />
                <span className="font-semibold">Funding Progress</span>
              </div>
              <p className="text-sm text-secondaryText">$120k raised of $500k</p>
            </div>
            <div className="absolute right-[-20px] top-32 w-56 rounded-card border border-borderColor bg-cardBg p-6 shadow-card">
              <div className="mb-2 flex items-center gap-3">
                <Users className="text-success" size={24} />
                <span className="font-semibold">Investor Activity</span>
              </div>
              <p className="text-sm text-secondaryText">8 interested this week</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
