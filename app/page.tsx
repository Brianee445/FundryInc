import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { FeaturedStartups } from "@/components/sections/FeaturedStartups";
import { WhyFundry } from "@/components/sections/WhyFundry";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Spotlight } from "@/components/sections/Spotlight";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <FeaturedStartups />
      <WhyFundry />
      <HowItWorks />
      <Spotlight />
      <CTA />
      <Footer />
    </main>
  );
}
