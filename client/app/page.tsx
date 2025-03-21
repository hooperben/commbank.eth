"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addContact, getAllContacts, initDB } from "@/lib/db";
import { HeroBackground } from "@/components/ui/hero-background";
import Link from "next/link";

export default function Home() {
  const [contact, setContact] = useState("");
  const [contacts, setContacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupDB = async () => {
      await initDB();
      const storedContacts = await getAllContacts();
      setContacts(storedContacts);
      setIsLoading(false);
    };

    setupDB().catch((error) => {
      console.error("Failed to initialize database:", error);
      toast({
        title: "Database Error",
        description: "Failed to initialize the contacts database",
        variant: "destructive",
      });
      setIsLoading(false);
    });
  }, []);

  const handleAddContact = async () => {
    if (contact.length <= 5) {
      toast({
        title: "Validation Error",
        description: "Contact must be longer than 5 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      await addContact(contact);
      const updatedContacts = await getAllContacts();
      setContacts(updatedContacts);
      setContact("");
      toast({
        title: "Contact Added",
        description: "The contact has been successfully added",
      });
    } catch (error) {
      console.error("Failed to add contact:", error);
      toast({
        title: "Error",
        description: "Failed to add the contact",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
            <HeroBackground />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  commbank.eth
                </span>
              </h1>
              <p className="text-xl md:text-2xl max-w-2xl mb-8 text-foreground/80">
                private, unstoppable money
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
