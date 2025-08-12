"use client";

import CommBankDotETHLogo from "@/components/commbankdotethlogo";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ArrowRight, XIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const scrollToSection = () => {
    document.getElementById("commbank-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

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
              the bank you don&apos;t need to trust
            </p>
            <div className="flex flex-col sm:flex-row gap-4 cursor-pointer">
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToSection}
                className="hover:bg-primary/90 hover:cursor-pointer"
              >
                Learn More
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

        <section
          id="commbank-section"
          className="h-screen flex flex-col  items-center justify-center text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              commbank.eth?
            </span>
          </h2>

          <div>
            commbank.eth is a project showcase that aims to demonstrate privacy
            enhancing technologies, specifically privacy enhancing financial
            technologies.
          </div>

          <div>
            everything every deployed to commbank.eth will be open source. You
            can follow the progress or audit the code yourself with the links
            below.
          </div>

          <Link
            href="https://github.com/hooperben/commbank.eth"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubLogoIcon className="w-6 h-6 hover:text-primary cursor-pointer" />
          </Link>
          <Link
            href="https://x.com/commbankdoteth"
            target="_blank"
            rel="noopener noreferrer"
          >
            <XIcon className="w-6 h-6 hover:text-primary cursor-pointer" />
          </Link>
        </section>
      </div>
    </main>
  );
}
