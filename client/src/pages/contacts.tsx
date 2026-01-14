import { AddContactModal } from "@/_components/contacts/add-contact-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_components/ui/accordion";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { PAGE_METADATA } from "@/_constants/seo-config";
import {
  useDeleteContact,
  useSearchContacts,
  useUpdateContact,
} from "@/_hooks/use-contacts";
import PageContainer from "@/_providers/page-container";
import type { Contact } from "@/_types";
import { ArrowLeft, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{
    id: string;
    nickname: string;
  } | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  const { data: contacts, isLoading } = useSearchContacts(searchQuery);

  const deleteContactMutation = useDeleteContact();
  const updateContactMutation = useUpdateContact();

  const handleDeleteClick = (id: string, nickname: string) => {
    setContactToDelete({ id, nickname });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id, {
        onSuccess: () => {
          toast.success(`${contactToDelete.nickname || "Contact"} deleted`);
          setDeleteDialogOpen(false);
          setContactToDelete(null);
        },
      });
    }
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditForm({
      nickname: contact.nickname || "",
      evmAddress: contact.evmAddress || "",
      privateAddress: contact.privateAddress || "",
      envelopeAddress: contact.envelopeAddress || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingContactId(null);
    setEditForm({});
  };

  const handleSaveEdit = (contact: Contact) => {
    updateContactMutation.mutate(
      {
        ...contact,
        nickname: editForm.nickname,
        evmAddress: editForm.evmAddress,
        privateAddress: editForm.privateAddress,
        envelopeAddress: editForm.envelopeAddress,
      },
      {
        onSuccess: () => {
          setEditingContactId(null);
          setEditForm({});
        },
      },
    );
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
            <div className="flex flex-row justify-between">
              <CardTitle className="text-2xl">Contacts</CardTitle>
              <AddContactModal />
            </div>
            <CardDescription>
              Manage your saved commbank.eth contacts
            </CardDescription>
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

            {/* Contacts List */}
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
              <Accordion type="single" collapsible className="w-full">
                {contacts.map((contact) => (
                  <AccordionItem key={contact.id} value={contact.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <span className="font-medium">
                          {contact.nickname || "Anonymous"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {editingContactId === contact.id ? (
                          <>
                            {/* Edit Mode */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Nickname
                              </p>
                              <Input
                                value={editForm.nickname || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    nickname: e.target.value,
                                  })
                                }
                                placeholder="Nickname"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Public Address
                              </p>
                              <Input
                                value={editForm.evmAddress || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    evmAddress: e.target.value,
                                  })
                                }
                                placeholder="0x..."
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Private Address
                              </p>
                              <Input
                                value={editForm.privateAddress || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    privateAddress: e.target.value,
                                  })
                                }
                                placeholder="Private address"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Envelope Address
                              </p>
                              <Input
                                value={editForm.envelopeAddress || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    envelopeAddress: e.target.value,
                                  })
                                }
                                placeholder="Envelope address"
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(contact)}
                                disabled={updateContactMutation.isPending}
                              >
                                {updateContactMutation.isPending
                                  ? "Saving..."
                                  : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* View Mode */}
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Public Address
                              </p>
                              <p className="font-mono text-sm break-all">
                                {contact.evmAddress || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground my-1">
                                Private Address
                              </p>
                              <p className="font-mono text-sm break-all">
                                {contact.privateAddress || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground my-1">
                                Envelope Address
                              </p>
                              <p className="font-mono text-sm break-all">
                                {contact.envelopeAddress || "—"}
                              </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(contact)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteClick(
                                    contact.id,
                                    contact.nickname || "Anonymous",
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {contactToDelete?.nickname || "this contact"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
