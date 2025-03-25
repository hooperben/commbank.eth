"use client";

import CommBankDotETHLogo from "@/components/commbankdotethlogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Lock, Repeat, Shield, Zap } from "lucide-react";
import Link from "next/link";

function ZkFlowDiagram() {
  return (
    <div className="w-full h-[300px] md:h-[400px] relative bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        {/* Background grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
          />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Merkle Tree */}
        <g className="merkle-tree">
          <path
            d="M400 100 L300 200 L400 100 L500 200"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <path
            d="M300 200 L250 300 L300 200 L350 300"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          <path
            d="M500 200 L450 300 L500 200 L550 300"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Root node */}
          <circle
            cx="400"
            cy="100"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="400"
            y="105"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Root
          </text>

          {/* Level 1 nodes */}
          <circle
            cx="300"
            cy="200"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="300"
            y="205"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Hash
          </text>

          <circle
            cx="500"
            cy="200"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="500"
            y="205"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Hash
          </text>

          {/* Level 2 nodes */}
          <circle
            cx="250"
            cy="300"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="250"
            y="305"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Note
          </text>

          <circle
            cx="350"
            cy="300"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="350"
            y="305"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Note
          </text>

          <circle
            cx="450"
            cy="300"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="450"
            y="305"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Note
          </text>

          <circle
            cx="550"
            cy="300"
            r="20"
            fill="#292524"
            stroke="#F59E0B"
            strokeWidth="2"
          />
          <text
            x="550"
            y="305"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="12"
          >
            Note
          </text>
        </g>

        {/* Verifier Contract */}
        <rect
          x="100"
          y="150"
          width="120"
          height="60"
          rx="5"
          fill="#292524"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <text x="160" y="185" textAnchor="middle" fill="#F59E0B" fontSize="12">
          ZK Verifiers
        </text>

        {/* User Wallet */}
        <rect
          x="600"
          y="150"
          width="120"
          height="60"
          rx="5"
          fill="#292524"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <text x="660" y="185" textAnchor="middle" fill="#F59E0B" fontSize="12">
          User Wallet
        </text>

        {/* Encrypted Notes */}
        <rect
          x="600"
          y="350"
          width="120"
          height="60"
          rx="5"
          fill="#292524"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <text x="660" y="375" textAnchor="middle" fill="#F59E0B" fontSize="12">
          Encrypted
        </text>
        <text x="660" y="395" textAnchor="middle" fill="#F59E0B" fontSize="12">
          Notes
        </text>

        {/* Arrows */}
        <path
          d="M220 180 L270 180"
          stroke="#F59E0B"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <path
          d="M530 180 L600 180"
          stroke="#F59E0B"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <path
          d="M660 210 L660 350"
          stroke="#F59E0B"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <path
          d="M600 380 L580 380 L580 300 L570 300"
          stroke="#F59E0B"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

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
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground hover:cursor-pointer"
              >
                <Link href="/home" className="hover:cursor-pointer">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4 md:px-6 bg-gray-100 dark:bg-zinc-900/50 rounded-2xl">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
                How It Works
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                commbank.eth uses advanced cryptography to ensure your
                transactions remain private while maintaining the security and
                decentralisation of ethereum.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <Card className="bg-white dark:bg-zinc-800/70 border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-amber-500">
                    Encrypted Deposits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Deposit any ERC20 token into an encrypted account. Your
                    funds are represented as encrypted notes in a Merkle tree
                    data structure, which only you have knowledge of.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-800/70 border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-amber-500">
                    Private Transfers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Send encrypted balances to other users without revealing
                    amounts or addresses to anyone but the recipient.
                    Zero-knowledge proofs verify transaction validity without
                    exposing details.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-800/70 border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <Repeat className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle className="text-amber-500">
                    Public/Private Swaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    Seamlessly convert between public and private balances
                    whenever you want, giving you complete control over your
                    privacy preferences.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technical Diagram Section */}
        <section className="py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
                Technical Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Understanding the zero-knowledge infrastructure that powers
                commbank.eth
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700 p-6 md:p-8 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/2">
                  <ZkFlowDiagram />
                </div>
                <div className="w-full md:w-1/2">
                  <h3 className="text-xl font-semibold text-amber-500 mb-4">
                    Zero-Knowledge Architecture
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-amber-500 text-sm font-bold">
                          1
                        </span>
                      </div>
                      <p className="dark:text-gray-300">
                        <span className="font-semibold text-amber-500">
                          Note Creation:
                        </span>{" "}
                        When you deposit funds, a commitment hash is created and
                        added to the Merkle tree.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-amber-500 text-sm font-bold">
                          2
                        </span>
                      </div>
                      <p className="dark:text-gray-300">
                        <span className="font-semibold text-amber-500">
                          ZK Verification:
                        </span>{" "}
                        DepositVerifier.sol, TransactVerifier.sol and
                        WithdrawVerifier.sol contracts validate proofs without
                        revealing sensitive data.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-amber-500 text-sm font-bold">
                          3
                        </span>
                      </div>
                      <p className="dark:text-gray-300">
                        <span className="font-semibold text-amber-500">
                          Encrypted Sharing:
                        </span>{" "}
                        Notes are encrypted with the recipient&apos;s RSA public
                        key and shared through the chain, no third parties
                        required.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <span className="text-amber-500 text-sm font-bold">
                          4
                        </span>
                      </div>
                      <p className="dark:text-gray-300">
                        <span className="font-semibold text-amber-500">
                          Encrypted Browser Storage:
                        </span>{" "}
                        Your browser monitors for incoming notes encrypted to
                        your key and stores them in IndexedDB for future use.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 md:px-6 bg-gray-100 dark:bg-zinc-900/50 rounded-2xl">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-4">
                Key Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                What makes commbank.eth the right bank for you?
              </p>
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
                    ERC20 Support
                  </h3>
                  <p className="text-gray-400">
                    Deposit and transfer any ERC20 token with the same level of
                    privacy and security.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-500 mb-2">
                    Secure Note Sharing
                  </h3>
                  <p className="text-gray-400">
                    RSA encryption ensures only intended recipients can decrypt
                    and access their notes.
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
                    Switch between public and private modes at any time, giving
                    you control over your privacy preferences.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-white dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/50 transition-all">
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
        </section>

        {/* CTA Section */}
        <section className="py-10 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gradient-to-r from-amber-50 to-amber-600 dark:from-amber-900/30 dark:to-amber-700/30 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-amber-500 mb-4">
                Curious?
              </h2>
              <p className="text-gray-700 dark:dark:text-gray-300 max-w-2xl mx-auto mb-8">
                Create your account now!
              </p>
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
