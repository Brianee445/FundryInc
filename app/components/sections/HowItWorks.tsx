import { Container } from '@/app/components/ui/Container';
import { UserPlus, ShieldCheck, Handshake } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Create Profile', desc: 'Sign up and showcase your startup journey.' },
  { icon: ShieldCheck, title: 'Get Verified', desc: 'Complete KYC to unlock trust badges.' },
  { icon: Handshake, title: 'Connect With Investors', desc: 'Pitch, network, and raise capital.' },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <Container>
        <h2 className="text-center text-4xl font-bold md:text-5xl">How It Works</h2>
        <div className="relative mt-16 grid gap-12 md:grid-cols-3">
          <div className="absolute left-1/3 right-1/3 top-1/2 hidden h-[2px] -translate-y-1/2 bg-borderColor md:block" />
          {STEPS.map((step) => (
            <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primaryBlue/30 bg-primaryBlue/10">
                <step.icon size={32} className="text-primaryBlue" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-secondaryText">{step.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
