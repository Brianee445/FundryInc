import { Navbar } from "@/app/components/sections/Navbar";
import { Hero } from "@/app/components/sections/Hero";
import { Stats } from "@/app/components/sections/Stats";
import { FeaturedStartups } from "@/app/components/sections/FeaturedStartups";
import { WhyFundry } from "@/app/components/sections/WhyFundry";
import { HowItWorks } from "@/app/components/sections/HowItWorks";
import { Spotlight } from "@/app/components/sections/Spotlight";
import { CTA } from "@/app/components/sections/CTA";
import { Footer } from "@/app/components/sections/Footer";

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
