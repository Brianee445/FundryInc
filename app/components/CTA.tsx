import { Container } from '@/app/components/ui/Container';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-24">
      <Container>
        <div className="rounded-card bg-gradient-to-br from-primaryBlue to-accentCyan p-16 text-center text-white shadow-hover">
          <h2 className="text-4xl font-bold md:text-6xl">Join thousands building tomorrow.</h2>
          <p className="mx-auto mt-4 max-w-xl text-xl opacity-90">
            Get early access to the most trusted founder-investor marketplace.
          </p>
          <Link href="/waitlist">
            <Button variant="secondary" size="lg" className="mt-8 bg-white text-background hover:bg-gray-100">
              Join Waitlist
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
