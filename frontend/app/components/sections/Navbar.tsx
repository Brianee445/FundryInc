"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Container } from "@/app/components/ui/Container";

const navLinks = ["Features", "Spotlight", "Pricing", "About", "Contact"];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-borderColor h-20">
      <Container className="flex items-center justify-between h-full">
        <div className="flex items-center gap-2">
          <Image src="/logo/fundry.svg" alt="Fundry" width={42} height={42} priority />
          <span className="text-xl font-bold tracking-tight">Fundry</span>
        </div>

        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-secondaryText">
          {navLinks.map((link) => (
            <li key={link} className="hover:text-primaryText cursor-pointer transition">{link}</li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm">Login</Button>
          <Link href="/waitlist">
            <Button variant="primary" size="sm">Join Waitlist</Button>
          </Link>
        </div>

        <button className="md:hidden text-primaryText" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </Container>

      {isOpen && (
        <div className="md:hidden bg-background border-b border-borderColor px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <span key={link} className="text-secondaryText hover:text-primaryText text-lg">{link}</span>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="ghost">Login</Button>
            <Link href="/waitlist">
              <Button variant="primary" className="w-full">Join Waitlist</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
