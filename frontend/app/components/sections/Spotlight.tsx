"use client";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function Spotlight() {
  return (
    <section className="py-24">
      <Container>
        <div className="relative bg-cardBg border border-borderColor rounded-card p-12 md:p-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primaryBlue/20 blur-[80px] rounded-full" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-primaryBlue font-medium text-sm tracking-widest uppercase">Founder Spotlight</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Innovating the future of logistics</h2>
            <p className="text-secondaryText text-lg mt-4">
              Read the story of how Sarah K. is revolutionizing supply chain in Africa with AI-driven optimization.
            </p>
            <Button variant="primary" className="mt-6">Read Story <ArrowRight size={18} /></Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
