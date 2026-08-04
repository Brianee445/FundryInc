"use client";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/Container";
import { UserPlus, ShieldCheck, Handcoin } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Create Profile", desc: "Sign up and showcase your startup journey." },
  { icon: ShieldCheck, title: "Get Verified", desc: "Complete KYC to unlock trust badges." },
  { icon: Handcoin, title: "Connect With Investors", desc: "Pitch, network, and raise capital." },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <Container>
        <h2 className="text-4xl md:text-5xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12 mt-16 relative">
          <div className="hidden md:block absolute top-1/2 left-1/3 right-1/3 h-[2px] bg-borderColor -translate-y-1/2" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className="flex flex-col items-center text-center relative z-10"
            >
              <div className="w-20 h-20 bg-primaryBlue/10 rounded-full flex items-center justify-center border border-primaryBlue/30">
                <s.icon size={32} className="text-primaryBlue" />
              </div>
              <h3 className="text-2xl font-semibold mt-6">{s.title}</h3>
              <p className="text-secondaryText mt-2">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
