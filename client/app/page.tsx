"use client";

import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { addContact, getAllContacts, initDB } from "@/lib/db";

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
          <h1 className="text-3xl font-bold">commbank.eth</h1>

          <Card>
            <CardHeader>
              <CardTitle>Add Contact</CardTitle>
              <CardDescription>Add a new contact to your list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="contact">Contact</Label>
                  <div className="flex gap-2">
                    <Input
                      id="contact"
                      placeholder="Enter contact (more than 5 characters)"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                    <Button
                      onClick={handleAddContact}
                      disabled={contact.length <= 5}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Your saved contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading contacts...</p>
              ) : contacts.length === 0 ? (
                <p className="text-muted-foreground">No contacts added yet</p>
              ) : (
                <ul className="space-y-2">
                  {contacts.map((contact, index) => (
                    <li
                      key={index}
                      className="rounded-md border p-3 hover:bg-accent transition-colors"
                    >
                      {contact}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
