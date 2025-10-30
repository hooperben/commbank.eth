"use client";

import { CommBankDotETHLogo } from "@/components/commbankdotethlogo";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { ArrowRight, XIcon, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: number]: boolean }>({});

  const sections = [
    "hero-section",
    "intro-section",
    "public-computing-section",
    "privacy-tech-section",
    "open-source-section",
  ];

  const scrollToSection = (index: number) => {
    const element = document.getElementById(sections[index]);
    element?.scrollIntoView({ behavior: "smooth" });
    setCurrentSection(index);
  };

  const scrollToNext = () => {
    const nextIndex = Math.min(currentSection + 1, sections.length - 1);
    scrollToSection(nextIndex);
  };

  const scrollToPrev = () => {
    const prevIndex = Math.max(currentSection - 1, 0);
    scrollToSection(prevIndex);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionIndex = sections.indexOf(entry.target.id);
          if (entry.isIntersecting) {
            setCurrentSection(sectionIndex);
            setIsVisible((prev) => ({ ...prev, [sectionIndex]: true }));
          }
        });
      },
      { threshold: 0.5 },
    );

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="flex flex-col relative">
      {/* Navigation Dots */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
              currentSection === index
                ? "bg-primary border-primary"
                : "bg-transparent border-primary/50 hover:border-primary"
            }`}
          />
        ))}
      </div>

      {/* Scroll Navigation Buttons */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-2">
        {currentSection > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToPrev}
            className="w-10 h-10 p-0 bg-background/80 backdrop-blur-sm"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
        {currentSection > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection(0)}
            className="w-10 h-10 p-0 bg-background/80 backdrop-blur-sm"
          >
            top
          </Button>
        )}
        {currentSection < sections.length - 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToNext}
            className="w-10 h-10 p-0 bg-background/80 backdrop-blur-sm"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <section
        id="hero-section"
        className="relative h-screen w-full overflow-hidden flex justify-center"
      >
        <div
          className={`text-center p-28 transition-all duration-500 transform ${
            isVisible[0]
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <div className="mb-8 transform transition-all duration-1000 delay-300 flex w-full justify-center">
            <CommBankDotETHLogo />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 transform transition-all duration-1000 delay-500">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              commbank.eth
            </span>
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-8 text-foreground/80 transform transition-all duration-1000 delay-700">
            the bank you don&apos;t need to trust
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 delay-1000">
            <Button
              variant="outline"
              size="lg"
              onClick={() => scrollToSection(1)}
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

      {/* Introduction Section */}
      <section
        id="intro-section"
        className="min-h-screen flex flex-col items-center justify-center text-center p-6"
      >
        <div
          className={`max-w-4xl transition-all duration-1000 transform ${
            isVisible[1]
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-12">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              commbank.eth?
            </span>
          </h2>

          <div className="space-y-8 text-lg md:text-xl leading-relaxed">
            <p className="transform transition-all duration-700 delay-300">
              commbank.eth is a project showcase that aims to demonstrate
              <span className="text-primary font-semibold">
                {" "}
                privacy enhancing technologies
              </span>
              , specifically privacy enhancing financial technologies.
            </p>

            <p className="transform transition-all duration-700 delay-500">
              it&apos;s a tool intended to help you take advantage of the
              pro&apos;s of
              <span className="text-primary font-semibold">
                {" "}
                private, public computing
              </span>{" "}
              with the ultimate goal of giving you and your money more power.
            </p>
          </div>
        </div>
      </section>

      {/* Public Computing Section */}
      <section
        id="public-computing-section"
        className="min-h-screen flex flex-col items-center justify-center text-center p-6"
      >
        <div
          className={`max-w-4xl transition-all duration-1000 transform ${
            isVisible[2]
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <div className="space-y-8 text-lg md:text-xl leading-relaxed">
            <p className="transform transition-all duration-700 delay-500">
              a public computer is exactly that, one in which{" "}
              <span className="text-primary font-semibold">
                all the rules are all the same
              </span>{" "}
              for all individuals using it, just like any other (idealistic)
              public space.
            </p>

            <p className="transform transition-all duration-700 delay-300">
              ethereum (eth) just celebrated its{" "}
              <span className="text-primary font-semibold">10th birthday</span>{" "}
              running, with{" "}
              <span className="text-primary font-semibold">0 down time</span>,
              demonstrating why it&apos;s (probably) currently humanity&apos;s
              best attempt at creating a public computer.
            </p>

            <p className="transform transition-all duration-700 delay-700">
              the applications that have catalysed public computing adoption is
              <span className="text-primary font-semibold">
                {" "}
                financial technologies
              </span>
              , i.e the reason you know what the word &apos;cryptocurrency&apos;
              means.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Technology Section */}
      <section
        id="privacy-tech-section"
        className="min-h-screen flex flex-col items-center justify-center text-center p-6"
      >
        <div
          className={`max-w-4xl transition-all duration-1000 transform ${
            isVisible[3]
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <div className="space-y-8 text-lg md:text-xl leading-relaxed">
            <p className="transform transition-all duration-700 delay-300">
              Up until reasonably recently, most public computers have had
              mostly all
              <span className="text-primary font-semibold"> public state</span>,
              meaning that everybody can see anything happening on it.
            </p>

            <p className="transform transition-all duration-700 delay-500">
              Recent advancements in applied cryptography (
              <span className="text-primary font-semibold">
                zero knowledge proofs
              </span>{" "}
              specifically), have enabled{" "}
              <span className="text-primary font-semibold">
                programmable privacy
              </span>{" "}
              in a way that unlocks a lot of new use cases not previously
              feasible.
            </p>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section
        id="open-source-section"
        className="min-h-screen flex flex-col items-center justify-center text-center p-6"
      >
        <div
          className={`max-w-4xl transition-all duration-1000 transform ${
            isVisible[4]
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-12">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Open Source
            </span>
          </h2>

          <div className="space-y-8 text-lg md:text-xl leading-relaxed mb-12">
            <p className="transform transition-all duration-700 delay-300">
              Anything ever deployed to commbank.eth will always be
              <span className="text-primary font-semibold"> open source</span>,
              open for anyone to look at or do whatever they please with it.
            </p>
          </div>

          <div className="flex justify-center gap-6 transform transition-all duration-700 delay-500">
            <Link
              href="https://github.com/hooperben/commbank.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
              <GitHubLogoIcon className="w-6 h-6 text-primary" />
              <span className="text-primary font-semibold">View on GitHub</span>
            </Link>

            <Link
              href="https://x.com/commbankdoteth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
            >
              <XIcon className="w-6 h-6 text-primary" />
              <span className="text-primary font-semibold">Follow Updates</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
