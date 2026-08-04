import { Container } from '@/app/components/ui/Container';
import { Logo } from '@/app/components/layout/Logo';
import { Twitter, Linkedin, Youtube } from 'lucide-react';

const FOOTER_LINKS: Record<string, string[]> = {
  Company: ['About', 'Careers'],
  Product: ['Features', 'Pricing'],
  Resources: ['Blog', 'Help Center'],
  Legal: ['Privacy', 'Terms'],
};

export function Footer() {
  return (
    <footer className="border-t border-borderColor py-16">
      <Container>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 text-sm text-secondaryText">Connecting Visionary Founders with Serious Investors.</p>
            <div className="mt-4 flex gap-4">
              <Twitter size={20} className="cursor-pointer text-secondaryText hover:text-primaryText" />
              <Linkedin size={20} className="cursor-pointer text-secondaryText hover:text-primaryText" />
              <Youtube size={20} className="cursor-pointer text-secondaryText hover:text-primaryText" />
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-4 font-semibold">{title}</h4>
              <ul className="space-y-2 text-sm text-secondaryText">
                {items.map((item) => (
                  <li key={item} className="cursor-pointer hover:text-primaryText">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-borderColor pt-8 text-center text-sm text-secondaryText">
          &copy; {new Date().getFullYear()} Fundry. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
