"use client";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/Container";
import { ShieldCheck, Users, MessageCircle, BarChart3, Star, Globe } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Verified Founders", desc: "Rigorous KYC checks ensure trust." },
  { icon: Users, title: "Smart Investor Matching", desc: "AI-driven alignment of interests." },
  { icon: MessageCircle, title: "Secure Messaging", desc: "Privacy-first connection protocols." },
  { icon: BarChart3, title: "Startup Analytics", desc: "Track profile performance and interest." },
  { icon: Star, title: "Founder Spotlight", desc: "Get featured and increase visibility." },
  { icon: Globe, title: "Global Network", desc: "Connect with investors worldwide." },
];

export function WhyFundry() {
  return (
    <section className="py-24 bg-secondaryBg/20">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">Why Fundry</h2>
          <p className="text-secondaryText text-lg mt-2">Built to bridge the gap between vision and capital.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-cardBg border border-borderColor rounded-card p-8 hover:border-primaryBlue/50 transition"
            >
              <f.icon size={32} className="text-primaryBlue mb-4" />
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-secondaryText text-sm mt-2">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
