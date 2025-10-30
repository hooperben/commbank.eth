import Link from "next/link";
import { Button } from "./ui/button";

const Hero = () => (
  <div className="relative overflow-hidden">
    {/* Animated Background Gradients */}
    <div className="absolute inset-0 gradient-bg-1 animate-gradient opacity-30"></div>
    <div
      className="absolute inset-0 gradient-bg-2 animate-gradient opacity-20"
      style={{ animationDelay: "2s" }}
    ></div>

    {/* Floating Background Elements */}
    <div className="absolute top-10 left-10 w-4 h-4 bg-primary/20 rounded-full animate-float"></div>
    <div className="absolute top-32 right-20 w-6 h-6 bg-primary/30 rounded-full animate-float-delayed"></div>
    <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-primary/25 rounded-full animate-float-slow"></div>
    <div className="absolute top-1/2 right-10 w-5 h-5 bg-primary/20 rounded-full animate-float"></div>

    {/* Original Hero Section */}
    <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6 relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            commbank.eth?
          </h1>

          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              commbank.eth has a unique value proposition
            </p>

            <p className="text-base leading-relaxed">
              for me, it legally has no value and cannot make money or I could
              potentially be in some legally murky waters.
            </p>

            <p className="text-base leading-relaxed">
              However, as the owner of commbank.eth, it is within my rights to
              use it to publish and demonstrate new applications of cryptography
              and distributed computer systems.
            </p>
            <p className="text-base leading-relaxed">
              anything ever deployed to commbank.eth will always be 100% open
              source software - all code for everything you read and use hear is
              available on Github.
            </p>

            <p className="text-xl font-semibold text-foreground mt-8">
              commbank.eth is a tool to give you and your money more power
            </p>
          </div>
        </div>

        {/* Right Content - Enhanced Animated Triangles */}
        <div className="flex justify-center items-center relative h-96 lg:h-[500px]">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/10 to-primary/5 rounded-full blur-3xl animate-pulse"></div>

            {/* Outermost Triangle */}
            <svg
              className="absolute animate-triangle-dance"
              width="400"
              height="400"
              viewBox="0 0 400 400"
              style={{ animationDuration: "20s" }}
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.8"
                  />
                  <stop
                    offset="50%"
                    stopColor="hsl(var(--accent-foreground))"
                    stopOpacity="0.6"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.4"
                  />
                </linearGradient>
              </defs>
              <polygon
                points="200,50 350,300 50,300"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            {/* Second Triangle */}
            <svg
              className="absolute animate-spin-slow animate-float"
              width="320"
              height="320"
              viewBox="0 0 320 320"
              style={{
                animationDuration: "16s",
                animationDirection: "reverse",
              }}
            >
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.9"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--accent-foreground))"
                    stopOpacity="0.5"
                  />
                </linearGradient>
              </defs>
              <polygon
                points="160,60 260,240 60,240"
                fill="none"
                className="animate-scale-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </svg>

            {/* Third Triangle */}
            <svg
              className="absolute animate-triangle-dance"
              width="240"
              height="240"
              viewBox="0 0 240 240"
              style={{ animationDuration: "12s", animationDelay: "1s" }}
            >
              <polygon
                points="120,70 180,180 60,180"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            {/* Fourth Triangle */}
            <svg
              className="absolute animate-spin-slow animate-float-delayed"
              width="160"
              height="160"
              viewBox="0 0 160 160"
              style={{ animationDuration: "8s", animationDirection: "reverse" }}
            >
              <polygon
                points="80,50 120,120 40,120"
                fill="none"
                className="animate-scale-pulse"
                style={{ animationDelay: "1.5s" }}
              />
            </svg>

            {/* Innermost Triangle */}
            <svg
              className="absolute animate-triangle-dance"
              width="80"
              height="80"
              viewBox="0 0 80 80"
              style={{ animationDuration: "4s", animationDelay: "2s" }}
            >
              <polygon
                points="40,25 60,60 20,60"
                fill="hsl(var(--primary) / 0.2)"
                className="animate-pulse"
              />
            </svg>

            {/* Additional Floating Triangles */}
            <svg
              className="absolute animate-float top-10 right-10"
              width="40"
              height="40"
              viewBox="0 0 40 40"
            >
              <polygon
                points="20,5 35,30 5,30"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            <svg
              className="absolute animate-float-slow bottom-10 left-10"
              width="30"
              height="30"
              viewBox="0 0 30 30"
            >
              <polygon
                points="15,5 25,20 5,20"
                fill="hsl(var(--primary) / 0.3)"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>

    {/* Second Section - Applied Cryptography */}
    <section className="relative py-16 px-4">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            To simplify the most, commbank.eth is intended to be an applied
            cryptography showcase.
          </p>

          <p className="text-lg leading-relaxed">
            Specifically, commbank.eth is intended to showcase advancements in
            compliant, privacy enhancing, financial technologies.
          </p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-8 h-8 bg-primary/10 rounded-full animate-float-slow"></div>
      <div className="absolute bottom-20 right-20 w-6 h-6 bg-primary/15 rounded-full animate-float"></div>
    </section>

    {/* Third Section - Account Creation */}
    <section className="relative py-16 px-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content - Enhanced Animated Triangles */}
        <div className="flex justify-center items-center relative h-64 lg:h-80 order-2 lg:order-1">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-l from-primary/10 via-accent/15 to-primary/10 rounded-full blur-2xl animate-pulse"></div>

            {/* Triangle Set 2 with Enhanced Animations */}
            <svg
              className="absolute animate-triangle-dance"
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{
                animationDuration: "15s",
                animationDirection: "reverse",
              }}
            >
              <defs>
                <radialGradient id="radialGrad1" cx="50%" cy="50%" r="50%">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.8"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--accent-foreground))"
                    stopOpacity="0.3"
                  />
                </radialGradient>
              </defs>
              <polygon
                points="100,30 170,150 30,150"
                fill="none"
                className="animate-pulse"
              />
            </svg>

            <svg
              className="absolute animate-spin-slow animate-float"
              width="140"
              height="140"
              viewBox="0 0 140 140"
              style={{ animationDuration: "10s" }}
            >
              <polygon
                points="70,35 105,105 35,105"
                fill="hsl(var(--primary) / 0.1)"
                className="animate-scale-pulse"
                style={{ animationDelay: "1s" }}
              />
            </svg>

            <svg
              className="absolute animate-triangle-dance"
              width="80"
              height="80"
              viewBox="0 0 80 80"
              style={{ animationDuration: "6s", animationDirection: "reverse" }}
            >
              <polygon
                points="40,25 60,60 20,60"
                fill="hsl(var(--primary) / 0.3)"
                className="animate-pulse"
                style={{ animationDelay: "2s" }}
              />
            </svg>

            {/* Additional Floating Elements */}
            <div className="absolute top-5 right-5 w-3 h-3 bg-primary/40 rounded-full animate-float"></div>
            <div className="absolute bottom-5 left-5 w-4 h-4 bg-primary/30 rounded-full animate-float-delayed"></div>
          </div>
        </div>

        {/* Right Content */}
        <div className="space-y-6 order-1 lg:order-2 relative z-10">
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg leading-relaxed text-right">
              <span className="font-semibold text-foreground">
                You can create your account{" "}
                <Link href="/account" className="ml-4">
                  <Button>On the Account Page.</Button>
                </Link>
              </span>
            </p>

            <p className="text-base leading-relaxed text-right">
              commbank.eth has no idea how many customers it has, and never
              will. When you create your commbank.eth account, all you are doing
              is storing a secret value on your device that only you have access
              to.
            </p>

            <p className="text-base leading-relaxed text-right">
              commbank.eth uses passkey to do all of this, standard included on
              almost all modern browsers to securely store and use secret
              values.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Fourth Section - Development Status */}
    <section className="relative py-16 px-4 pb-24">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">
            The current functionality of commbank.eth&apos;s web is still very
            much in development, with most of the focus being directed to future
            showcase protocols.
          </p>

          <p className="text-lg leading-relaxed">
            commbank.eth is currently in experiment beta - please do not deposit
            any funds without backing up your account secret (you can do this in
            the settings page).
          </p>
        </div>
      </div>

      {/* Final Floating Elements */}
      <div className="absolute top-10 left-1/4 w-5 h-5 bg-primary/20 rounded-full animate-float-slow"></div>
      <div className="absolute bottom-10 right-1/3 w-7 h-7 bg-primary/15 rounded-full animate-float"></div>
      <div className="absolute top-1/2 left-10 w-4 h-4 bg-primary/25 rounded-full animate-float-delayed"></div>
    </section>
  </div>
);

export default Hero;
