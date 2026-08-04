import { Container } from '@/app/components/ui/Container';
import { ShieldCheck, Users, MessageCircle, BarChart3, Star, Globe } from 'lucide-react';

const FEATURES = [
  { icon: ShieldCheck, title: 'Verified Founders', desc: 'Rigorous KYC checks ensure trust.' },
  { icon: Users, title: 'Smart Investor Matching', desc: 'AI-driven alignment of interests.' },
  { icon: MessageCircle, title: 'Secure Messaging', desc: 'Privacy-first connection protocols.' },
  { icon: BarChart3, title: 'Startup Analytics', desc: 'Track profile performance and interest.' },
  { icon: Star, title: 'Founder Spotlight', desc: 'Get featured and increase visibility.' },
  { icon: Globe, title: 'Global Network', desc: 'Connect with investors worldwide.' },
];

export function WhyFundry() {
  return (
    <section className="bg-secondaryBg/20 py-24">
      <Container>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold md:text-5xl">Why Fundry</h2>
          <p className="mt-2 text-lg text-secondaryText">Built to bridge the gap between vision and capital.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-card border border-borderColor bg-cardBg p-8 transition hover:border-primaryBlue/50"
            >
              <feature.icon size={32} className="mb-4 text-primaryBlue" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-secondaryText">{feature.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
