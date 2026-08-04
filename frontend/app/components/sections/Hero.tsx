"use client";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Users, Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import Link from "next/link";

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-20 relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-primaryBlue/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-accentCyan/10 blur-[100px] rounded-full pointer-events-none" />

      <Container className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
            Raise Capital. <br />
            <span className="text-primaryBlue">Build the Future.</span>
          </h1>
          <p className="text-xl text-secondaryText max-w-md">
            Connecting ambitious founders with investors ready to fund the next generation of innovation.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/waitlist">
              <Button variant="primary" size="lg" className="text-base">
                Join Waitlist <ArrowRight size={20} />
              </Button>
            </Link>
            <Button variant="secondary" size="lg">Explore Startups</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="relative hidden lg:flex justify-center">
          <div className="relative h-[400px] w-full max-w-md">
            <div className="absolute top-0 left-0 bg-cardBg border border-borderColor rounded-card p-6 shadow-card w-60">
              <div className="flex items-center gap-3 mb-2"><ShieldCheck className="text-primaryBlue" size={24} /><span className="font-semibold">Verified Founder</span></div>
              <p className="text-sm text-secondaryText">Jane Doe • Pre-seed</p>
            </div>
            <div className="absolute bottom-10 right-0 bg-cardBg border border-borderColor rounded-card p-6 shadow-card w-64">
              <div className="flex items-center gap-3 mb-2"><Rocket className="text-accentCyan" size={24} /><span className="font-semibold">Funding Progress</span></div>
              <p className="text-sm text-secondaryText">120k raised of 500k</p>
            </div>
            <div className="absolute top-32 right-[-20px] bg-cardBg border border-borderColor rounded-card p-6 shadow-card w-56">
              <div className="flex items-center gap-3 mb-2"><Users className="text-success" size={24} /><span className="font-semibold">Investor Activity</span></div>
              <p className="text-sm text-secondaryText">8 interested this week</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
