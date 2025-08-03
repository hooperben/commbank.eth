"use client";

import CommBankDotETHLogo from "@/components/commbankdotethlogo";
import Hero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 p-6">
      <div className="flex flex-col gap-6">
        <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <CommBankDotETHLogo />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                commbank.eth
              </span>
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl mb-8 text-foreground/80">
              a bank you don&apos;t need to trust
            </p>
            <div className="flex flex-col sm:flex-row gap-4 cursor-pointer">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="hover:bg-primary/90 hover:cursor-pointer"
              >
                <Link href="/proof-of-concept">Learn More</Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground hover:cursor-pointer"
              >
                <Link href="/account" className="hover:cursor-pointer">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Hero />
    </main>
  );
}
