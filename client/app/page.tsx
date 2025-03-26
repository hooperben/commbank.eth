"use client";

import CommBankDotETHLogo from "@/components/commbankdotethlogo";
import { Button } from "@/components/ui/button";
import ZKArchitecture from "@/components/zk-animation";
import { ArrowRight, Zap } from "lucide-react";
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
                <Link href="/home" className="hover:cursor-pointer">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-6 bg-gray-100 dark:bg-zinc-900/50 rounded-2xl">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-4xl font-bold text-amber-500 mb-4">
                why commbank.eth?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-500 mb-2">
                    Open Source
                  </h3>
                  <p className="text-gray-400">
                    All code used for commbank.eth is public and auditable by
                    anyone. You can view the repository{" "}
                    <a
                      href="https://github.com/hooperben/commbank.eth"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-500 hover:underline"
                    >
                      here
                    </a>
                    .
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-500 mb-2">
                    No Third Parties
                  </h3>
                  <p className="text-gray-400">
                    If commbank.eth can connect to the ethereum network, it
                    works. There is no other middlemen or third party services
                    required to operate.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-500 mb-2">
                    All ERC-20s supported by default
                  </h3>
                  <p className="text-gray-400">
                    Deposit and encrypt your balance of any ERC20 balance on any
                    supported network.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-500 mb-2">
                    Flexible Privacy Control
                  </h3>
                  <p className="text-gray-400">
                    Switch between public and private transfer balances at any
                    time, giving you more control over your privacy preferences.
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-center">
                <div className="flex justify-center gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all max-w-md">
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-amber-500 mb-2">
                      Passkey Authentication
                    </h3>
                    <p className="text-gray-400">
                      No emails, phone numbers or passwords - just an encrypted
                      secret stored securely on your device.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ZKArchitecture />

        <section className="py-10 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gradient-to-r from-amber-50 to-amber-600 dark:from-amber-900/30 dark:to-amber-700/30 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-amber-500 mb-4">
                Curious?
              </h2>
              <p className="text-gray-700 dark:dark:text-gray-300 max-w-2xl mx-auto mb-8">
                Create your account now!
              </p>

              <div className="flex flex-row gap-2 w-full justify-center">
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
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Link href="/home">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-5 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl text-center text-xs">
            <h6>
              created, owned and maintained by{" "}
              <a
                href="https://github.com/hooperben"
                className="text-amber-500 hover:underline"
              >
                Ben Hooper
              </a>
            </h6>
          </div>
        </section>
      </div>
    </main>
  );
}
