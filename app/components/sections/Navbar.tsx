'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Container } from '@/app/components/ui/Container';
import { Logo } from '@/app/components/layout/Logo';

const NAV_LINKS = ['Features', 'Spotlight', 'Pricing', 'About', 'Contact'];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-20 border-b border-borderColor bg-background/80 backdrop-blur-xl">
      <Container className="flex h-full items-center justify-between">
        <Logo />

        <ul className="hidden items-center gap-8 text-sm font-medium text-secondaryText md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link} className="cursor-pointer transition hover:text-primaryText">
              {link}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" size="sm">
            Login
          </Button>
          <Link href="/waitlist">
            <Button variant="primary" size="sm">
              Join Waitlist
            </Button>
          </Link>
        </div>

        <button className="text-primaryText md:hidden" onClick={() => setIsOpen((v) => !v)} aria-label="Toggle menu">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </Container>

      {isOpen && (
        <div className="flex flex-col gap-4 border-b border-borderColor bg-background px-6 py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <span key={link} className="text-lg text-secondaryText hover:text-primaryText">
              {link}
            </span>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="ghost">Login</Button>
            <Link href="/waitlist">
              <Button variant="primary" className="w-full">
                Join Waitlist
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
