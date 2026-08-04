"use client";
import { motion } from "framer-motion";
import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import { BadgeCheck, Rocket, Leaf, Briefcase } from "lucide-react";

const startups = [
  { name: "Aerospace AI", industry: "AI & Robotics", stage: "Seed", ask: "$2M", icon: Rocket },
  { name: "GreenGrid", industry: "CleanTech", stage: "Pre-seed", ask: "$1.2M", icon: Leaf },
  { name: "MediFlow", industry: "HealthTech", stage: "Series A", ask: "$5M", icon: Briefcase },
];

export function FeaturedStartups() {
  return (
    <section className="py-24">
      <Container>
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold">Featured Startups</h2>
            <p className="text-secondaryText mt-2">Discover top innovators raising capital.</p>
          </div>
          <Button variant="ghost">View All</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {startups.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-cardBg border border-borderColor rounded-card p-6 hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 bg-secondaryBg rounded-[16px] flex items-center justify-center">
                  <s.icon size={28} className="text-primaryBlue" />
                </div>
                <BadgeCheck size={20} className="text-primaryBlue" />
              </div>
              <h3 className="text-xl font-semibold mt-4">{s.name}</h3>
              <p className="text-secondaryText text-sm">{s.industry} • {s.stage}</p>
              <p className="text-sm font-medium mt-3">Asking: {s.ask}</p>
              <Button variant="secondary" size="sm" className="w-full mt-4">View Profile</Button>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
