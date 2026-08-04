import { Container } from '@/app/components/ui/Container';
import { Button } from '@/app/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export function Spotlight() {
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-card border border-borderColor bg-cardBg p-12 md:p-20">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primaryBlue/20 blur-[80px]" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-sm font-medium uppercase tracking-widest text-primaryBlue">Founder Spotlight</span>
            <h2 className="mt-2 text-4xl font-bold md:text-5xl">Innovating the future of logistics</h2>
            <p className="mt-4 text-lg text-secondaryText">
              Read the story of how Sarah K. is revolutionizing supply chain in Africa with AI-driven optimization.
            </p>
            <Button variant="primary" className="mt-6">
              Read Story <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
