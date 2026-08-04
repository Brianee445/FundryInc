import { Container } from '@/app/components/ui/Container';

const STATS = [
  { label: 'Capital Raised', value: '$120M+' },
  { label: 'Founders', value: '6,000+' },
  { label: 'Investors', value: '1,300+' },
  { label: 'Countries', value: '40+' },
];

export function Stats() {
  return (
    <section className="border-y border-borderColor bg-secondaryBg/30 py-20">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-primaryText md:text-5xl">{stat.value}</div>
              <div className="mt-2 text-secondaryText">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
