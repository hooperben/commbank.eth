import { AddContactModal } from "@/_components/contacts/add-contact-modal";
import PageContainer from "@/_providers/page-container";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/_components/ui/table";
import { useDeleteContact, useSearchContacts } from "@/_hooks/use-contacts";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contacts, isLoading } = useSearchContacts(searchQuery);

  const deleteContactMutation = useDeleteContact();

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContactMutation.mutate(id);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return "—";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <PageContainer
      {...PAGE_METADATA.contacts}
      title="Contacts"
      description="Manage your commbank.eth contacts"
    >
      <div className="container mx-auto p-6 max-w-6xl space-y-6 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/account" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Contacts</CardTitle>
                <CardDescription>
                  Manage your saved commbank.eth contacts
                </CardDescription>
              </div>
              <AddContactModal />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contacts by nickname or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contacts Table */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading contacts...
              </div>
            ) : !contacts || contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No contacts match your search"
                  : "No contacts yet. Add contacts from shared profiles."}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Public Address</TableHead>
                      <TableHead>Private Addresses</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.nickname || "Anonymous"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatAddress(contact.evmAddress)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatAddress(contact.privateAddress)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(contact.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
