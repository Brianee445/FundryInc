"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Container } from "@/components/ui/Container";
import api from "@/lib/api";
import { useState } from "react";
import { CheckCircle, Shield, Clock, Award } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["founder", "investor", "advisor", "accelerator"]),
});

type FormData = z.infer<typeof schema>;

export default function WaitlistPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await api.post("/api/v1/waitlist", data);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  const benefits = [
    { icon: Clock, title: "Priority Access", desc: "Be the first to join when we launch." },
    { icon: Shield, title: "Verification Discount", desc: "Get 50% off KYC verification fees." },
    { icon: Award, title: "Exclusive Interviews", desc: "Access to premium founder stories." },
    { icon: CheckCircle, title: "Early Launch Rewards", desc: "Special perks for early adopters." },
  ];

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center py-16">
      <Container className="max-w-[700px] mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold mb-6">Fundry</Link>
          <h1 className="text-4xl md:text-5xl font-bold">Join the Future of Startup Funding</h1>
          <p className="text-secondaryText text-lg mt-2">Get exclusive early access to Fundry.</p>
        </div>

        {success ? (
          <div className="bg-cardBg border border-borderColor rounded-card p-8 text-center">
            <CheckCircle size={56} className="text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold">You're on the list!</h2>
            <p className="text-secondaryText mt-2">We'll notify you the moment we launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-cardBg border border-borderColor rounded-card p-8 space-y-6">
            {error && <div className="bg-error/10 border border-error text-error p-4 rounded-[14px] text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-secondaryText mb-1">Email Address</label>
              <Input {...register("email")} placeholder="you@startup.com" />
              {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondaryText mb-1">I am a</label>
              <Select {...register("role")}>
                <option value="founder">Founder</option>
                <option value="investor">Investor</option>
                <option value="advisor">Advisor</option>
                <option value="accelerator">Accelerator</option>
              </Select>
            </div>

            <Button variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </Button>

            <div className="text-center text-sm text-secondaryText">
              <span>2,300+ already waiting</span>
            </div>
          </form>
        )}

        <div className="grid grid-cols-2 gap-4 mt-12">
          {benefits.map((b) => (
            <div key={b.title} className="bg-secondaryBg/50 border border-borderColor rounded-[16px] p-4 flex flex-col items-center text-center">
              <b.icon size={24} className="text-primaryBlue mb-2" />
              <h4 className="font-semibold text-sm">{b.title}</h4>
              <p className="text-secondaryText text-xs">{b.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
