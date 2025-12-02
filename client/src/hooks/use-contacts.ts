import type { Contact } from "@/_types";
import { useAuth } from "@/lib/auth-context";
import {
  addContact as addContactDB,
  deleteContact as deleteContactDB,
  getAllContacts,
  updateContact as updateContactDB,
} from "@/lib/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to fetch all contacts from IndexedDB
 */
export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: getAllContacts,
  });
}

/**
 * Hook to add a new contact
 */
export function useAddContact() {
  const queryClient = useQueryClient();

  const { signIn } = useAuth();

  return useMutation({
    mutationFn: async (contact: Omit<Contact, "id" | "createdAt">) => {
      await signIn();
      const newContact: Contact = {
        ...contact,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      await addContactDB(newContact);
      return newContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added successfully");
    },
    onError: () => {
      toast.error("Failed to add contact");
    },
  });
}

/**
 * Hook to update an existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { getMnemonic } = useAuth();

  return useMutation({
    mutationFn: async (contact: Contact) => {
      await getMnemonic();
      await updateContactDB(contact);
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated successfully");
    },
    onError: () => {
      toast.error("Failed to update contact");
    },
  });
}

/**
 * Hook to delete a contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { getMnemonic } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // requires passkey usage
      await getMnemonic();
      await deleteContactDB(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete contact");
    },
  });
}

/**
 * Search/filter contacts by query string
 * Searches nickname, evmAddress, privateAddress, and envelopeAddress
 */
export function useSearchContacts(query: string) {
  const { data: contacts, ...rest } = useContacts();

  const filteredContacts = contacts?.filter((contact) => {
    if (!query) return true;

    const searchLower = query.toLowerCase();

    return (
      contact.nickname?.toLowerCase().includes(searchLower) ||
      contact.evmAddress?.toLowerCase().includes(searchLower) ||
      contact.privateAddress?.toLowerCase().includes(searchLower) ||
      contact.envelopeAddress?.toLowerCase().includes(searchLower)
    );
  });

  return {
    data: filteredContacts,
    ...rest,
  };
}
