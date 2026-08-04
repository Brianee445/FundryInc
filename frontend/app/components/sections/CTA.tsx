"use client";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primaryBlue to-accentCyan rounded-card p-16 text-center text-white shadow-hover"
        >
          <h2 className="text-4xl md:text-6xl font-bold">Join thousands building tomorrow.</h2>
          <p className="text-xl opacity-90 mt-4 max-w-xl mx-auto">Get early access to the most trusted founder-investor marketplace.</p>
          <Link href="/waitlist">
            <Button variant="secondary" size="lg" className="mt-8 bg-white text-background hover:bg-gray-100">
              Join Waitlist
            </Button>
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
