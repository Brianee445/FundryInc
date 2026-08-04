import { Container } from "@/components/ui/Container";
import { Twitter, Linkedin, Youtube } from "lucide-react";

const footerLinks = {
  Company: ["About", "Careers"],
  Product: ["Features", "Pricing"],
  Resources: ["Blog", "Help Center"],
  Legal: ["Privacy", "Terms"],
};

export function Footer() {
  return (
    <footer className="border-t border-borderColor py-16">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">Fundry</span>
            </div>
            <p className="text-secondaryText text-sm mt-3">Connecting Visionary Founders with Serious Investors.</p>
            <div className="flex gap-4 mt-4">
              <Twitter size={20} className="text-secondaryText hover:text-primaryText cursor-pointer" />
              <Linkedin size={20} className="text-secondaryText hover:text-primaryText cursor-pointer" />
              <Youtube size={20} className="text-secondaryText hover:text-primaryText cursor-pointer" />
            </div>
          </div>
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4">{title}</h4>
              <ul className="space-y-2 text-sm text-secondaryText">
                {items.map((item) => (
                  <li key={item} className="hover:text-primaryText cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-borderColor mt-12 pt-8 text-sm text-secondaryText text-center">
          &copy; {new Date().getFullYear()} Fundry. All rights reserved.
        </div>
      </Container>
    </section>
  );
}
