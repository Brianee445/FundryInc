"use client";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

const stats = [
  { label: "Capital Raised", value: "$120M+" },
  { label: "Founders", value: "6,000+" },
  { label: "Investors", value: "1,300+" },
  { label: "Countries", value: "40+" },
];

export function Stats() {
  return (
    <section className="py-20 border-y border-borderColor bg-secondaryBg/30">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primaryText">{stat.value}</div>
              <div className="text-secondaryText mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
