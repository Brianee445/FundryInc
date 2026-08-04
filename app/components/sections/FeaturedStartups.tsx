import { Container } from '@/app/components/ui/Container';
import { Button } from '@/app/components/ui/Button';
import { BadgeCheck, Rocket, Leaf, Briefcase } from 'lucide-react';

const STARTUPS = [
  { name: 'Aerospace AI', industry: 'AI & Robotics', stage: 'Seed', ask: '$2M', icon: Rocket },
  { name: 'GreenGrid', industry: 'CleanTech', stage: 'Pre-seed', ask: '$1.2M', icon: Leaf },
  { name: 'MediFlow', industry: 'HealthTech', stage: 'Series A', ask: '$5M', icon: Briefcase },
];

export function FeaturedStartups() {
  return (
    <section className="py-24">
      <Container>
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold md:text-5xl">Featured Startups</h2>
            <p className="mt-2 text-secondaryText">Discover top innovators raising capital.</p>
          </div>
          <Button variant="ghost">View All</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STARTUPS.map((startup) => (
            <div
              key={startup.name}
              className="rounded-card border border-borderColor bg-cardBg p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-secondaryBg">
                  <startup.icon size={28} className="text-primaryBlue" />
                </div>
                <BadgeCheck size={20} className="text-primaryBlue" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{startup.name}</h3>
              <p className="text-sm text-secondaryText">
                {startup.industry} · {startup.stage}
              </p>
              <p className="mt-3 text-sm font-medium">Asking: {startup.ask}</p>
              <Button variant="secondary" size="sm" className="mt-4 w-full">
                View Profile
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
