"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
  Share2,
  Database,
  LockKeyhole,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZKArchitecture() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarousel, setIsCarousel] = useState(false);

  const steps = [
    {
      title: "Note Creation",
      description:
        "When a user deposit funds, a commitment hash is created and added to the Merkle tree.",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "ZK Verification",
      description:
        "DepositVerifier.sol, TransactVerifier.sol and WithdrawVerifier.sol smart contracts validate transactions without revealing any information about the contents of transactions.",
      icon: <Key className="h-5 w-5" />,
    },
    {
      title: "Encrypted Sharing",
      description:
        "Notes are encrypted with the recipient's RSA public key and shared through the chain, no third parties required.",
      icon: <Share2 className="h-5 w-5" />,
    },
    {
      title: "Encrypted Browser Storage",
      description:
        "Your browser monitors for incoming notes encrypted to your key and stores them in IndexedDB for future use.",
      icon: <Database className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    if (isCarousel) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % steps.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isCarousel, steps.length]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-12">
      <div className="text-center mb-12">
        <h2 className="text-xl md:text-4xl font-bold text-amber-500 mb-4">
          How does commbank.eth enable completely anonymous payments?
        </h2>
      </div>
      <div className=" border border-gray-200 dark:border-zinc-700 p-6 md:p-8 rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Left side - Animation or Illustration */}
          <div className="w-full md:w-1/2 flex justify-center items-center">
            {!isCarousel && (
              <div className="relative h-64 w-64">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    {/* Central lock icon */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 3,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="h-24 w-24 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <LockKeyhole className="h-12 w-12 text-amber-500" />
                      </div>
                    </motion.div>

                    {/* Orbiting circles */}
                    {steps.map((step, index) => (
                      <motion.div
                        key={index}
                        className="absolute h-10 w-10"
                        style={{
                          top: "calc(50% - 20px)",
                          left: "calc(50% - 20px)",
                        }}
                        animate={{
                          x:
                            Math.cos(
                              index * (Math.PI / 2) + Date.now() / 3000,
                            ) * 80,
                          y:
                            Math.sin(
                              index * (Math.PI / 2) + Date.now() / 3000,
                            ) * 80,
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 8,
                          ease: "linear",
                          delay: -index * 2,
                        }}
                      >
                        <motion.div
                          className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center"
                          whileHover={{
                            scale: 1.2,
                            backgroundColor: "rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          <div className="text-amber-500">{step.icon}</div>
                        </motion.div>
                      </motion.div>
                    ))}

                    {/* Connection lines */}
                    <svg
                      className="absolute inset-0 h-full w-full"
                      style={{ zIndex: -1 }}
                    >
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="80"
                        fill="none"
                        stroke="rgba(245, 158, 11, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 30,
                          ease: "linear",
                        }}
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>
            )}

            {isCarousel && (
              <div className="relative h-64 w-full flex items-center justify-center">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="h-32 w-32 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <div className="text-amber-500 transform scale-150">
                      {steps[activeSlide].icon}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Right side - Content */}
          <div className="w-full md:w-1/2">
            <h3 className="text-xl font-semibold text-amber-500 mb-4">
              High Level Overview
            </h3>

            {!isCarousel && (
              <ul className="space-y-4">
                {steps.map((step, index) => (
                  <motion.li
                    key={index}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <div className="text-amber-500">{step.icon}</div>
                    </div>
                    <p className="dark:text-gray-300">
                      <span className="font-semibold text-amber-500">
                        {step.title}:
                      </span>{" "}
                      {step.description}
                    </p>
                  </motion.li>
                ))}
              </ul>
            )}

            {isCarousel && (
              <div className="relative">
                <div className="overflow-hidden">
                  <motion.div
                    key={activeSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="py-4"
                  >
                    <h4 className="text-lg font-semibold text-amber-500 mb-2">
                      {(index) => index + 1}. {steps[activeSlide].title}
                    </h4>
                    <p className="dark:text-gray-300">
                      {steps[activeSlide].description}
                    </p>
                  </motion.div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() =>
                      setActiveSlide(
                        (prev) => (prev - 1 + steps.length) % steps.length,
                      )
                    }
                    className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex gap-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all",
                          activeSlide === index
                            ? "bg-amber-500 w-4"
                            : "bg-amber-500/30 hover:bg-amber-500/50",
                        )}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setActiveSlide((prev) => (prev + 1) % steps.length)
                    }
                    className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
