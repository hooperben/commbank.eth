import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { getNoteHash, getNullifier } from "@/_constants/notes";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { useDBStats } from "@/_hooks/use-indexed-db";
import { fetchIndexerLeafs } from "@/_hooks/use-indexer-leafs";
import { fetchIndexerNotes } from "@/_hooks/use-indexer-notes";
import { fetchIndexerNullifiers } from "@/_hooks/use-indexer-nullifiers";
import { useAuth } from "@/_providers/auth-provider";
import PageContainer from "@/_providers/page-container";
import type { Note, Payload, TreeLeaf } from "@/_types";
import {
  addNote,
  addPayload,
  addTreeLeaf,
  clearNotes,
  clearPayloads,
  clearTree,
  findNoteByFields,
  getAllTreeLeaves,
  updatePayload,
} from "@/lib/db";
import { AlertCircle, Loader2, Lock, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { NoteDecryption } from "shared/classes/Note";
import { toast } from "sonner";

const AppStatePage = () => {
  const [isPayloadsLoading, setIsPayloadsLoading] = useState(false);
  const [isLeafsLoading, setIsLeafsLoading] = useState(false);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [decryptingPayloadId, setDecryptingPayloadId] = useState<string | null>(
    null,
  );

  const { getEnvelopeKey, refreshNotes, getMnemonic, privateAddress } =
    useAuth();

  const {
    allNotes,
    allTreeLeaves,
    allPayloads,
    isLoading: isDBLoading,
    refresh: refreshDBStats,
    db,
  } = useDBStats();

  // Clear payloads and re-fetch from indexer
  const handleClearAndRefetchPayloads = async () => {
    setIsPayloadsLoading(true);
    try {
      await clearPayloads();
      const indexerPayloads = await fetchIndexerNotes(100, 0);

      if (indexerPayloads) {
        for (const payload of indexerPayloads) {
          await addPayload({
            id: payload.id,
            encryptedNote: payload.encryptedNote,
            decryptAttempted: false,
          });
        }
      }

      await refreshDBStats();
      toast.success(
        `Refetched ${indexerPayloads?.length || 0} payloads from indexer`,
      );
    } catch (error) {
      console.error("Error refetching payloads:", error);
      toast.error("Failed to refetch payloads");
    } finally {
      setIsPayloadsLoading(false);
    }
  };

  // Clear tree leaves and re-fetch from indexer
  const handleClearAndRefetchLeafs = async () => {
    setIsLeafsLoading(true);
    try {
      await clearTree();
      const indexerLeafs = await fetchIndexerLeafs(100, 0);

      if (indexerLeafs) {
        for (const leaf of indexerLeafs) {
          await addTreeLeaf({
            id: leaf.id,
            leafIndex: leaf.leafIndex,
            leafValue: leaf.leafValue,
          });
        }
      }

      await refreshDBStats();
      toast.success(
        `Refetched ${indexerLeafs?.length || 0} tree leaves from indexer`,
      );
    } catch (error) {
      console.error("Error refetching tree leaves:", error);
      toast.error("Failed to refetch tree leaves");
    } finally {
      setIsLeafsLoading(false);
    }
  };

  // Clear notes, clear payloads, re-fetch payloads, then re-decrypt
  const handleClearAndRedecryptNotes = async () => {
    setIsNotesLoading(true);
    try {
      // Clear notes
      await clearNotes();

      // Clear payloads and re-fetch with decryptAttempted: false
      await clearPayloads();
      const indexerPayloads = await fetchIndexerNotes(100, 0);

      if (indexerPayloads) {
        for (const payload of indexerPayloads) {
          await addPayload({
            id: payload.id,
            encryptedNote: payload.encryptedNote,
            decryptAttempted: false,
          });
        }
      }

      // Run refreshNotes to re-decrypt
      const mnemonic = await getMnemonic();
      const newNotesCount = await refreshNotes(mnemonic ?? undefined);

      await refreshDBStats();
      toast.success(`Re-decrypted and found ${newNotesCount} notes`);
    } catch (error) {
      console.error("Error re-decrypting notes:", error);
      toast.error("Failed to re-decrypt notes");
    } finally {
      setIsNotesLoading(false);
    }
  };

  // Decrypt a single payload and add to notes if successful
  const handleDecryptPayload = async (payload: Payload) => {
    setDecryptingPayloadId(payload.id);
    try {
      const envelopeKey = await getEnvelopeKey();
      if (!envelopeKey) {
        toast.error("Please sign in to decrypt notes");
        return;
      }

      const decrypted = await NoteDecryption.decryptEncryptedNote(
        payload.encryptedNote,
        envelopeKey,
      );

      // Check if note already exists
      const existingNote = await findNoteByFields(
        decrypted.asset_id,
        decrypted.asset_amount,
        decrypted.secret,
      );

      if (existingNote) {
        await updatePayload({ ...payload, decryptAttempted: true });
        await refreshDBStats();
        toast.info("Note already exists in database");
        return;
      }

      // Calculate nullifier to check if note is used
      const parsedNote = {
        assetId: decrypted.asset_id,
        assetAmount: decrypted.asset_amount,
        secret: decrypted.secret,
        owner: decrypted.owner,
      };
      const noteHash = getNoteHash(parsedNote);

      const leafs = await getAllTreeLeaves();
      const [leaf] = leafs.filter(
        (item) => BigInt(item.leafValue) === BigInt(noteHash),
      );

      const nullifiers = await fetchIndexerNullifiers(100, 0);
      const nullifier = getNullifier({
        leaf_index: leaf?.leafIndex,
        owner: decrypted.owner,
        secret: decrypted.secret,
        asset_id: decrypted.asset_id,
        asset_amount: decrypted.asset_amount,
        owner_secret: "",
        path: [],
        path_indices: [],
      });

      // Add note to database
      await addNote({
        id: payload.id,
        assetId: decrypted.asset_id,
        assetAmount: decrypted.asset_amount,
        nullifier: payload.id,
        secret: decrypted.secret,
        entity_id: decrypted.owner,
        isUsed: nullifiers.some(
          (item) => BigInt(item.nullifier) === BigInt(nullifier),
        ),
        note_payload_id: payload.id,
      });

      // Mark payload as attempted
      await updatePayload({ ...payload, decryptAttempted: true });

      await refreshDBStats();
      toast.success("Note decrypted and added to database");
      console.log("Decrypted note:", decrypted);
    } catch (error) {
      // Mark payload as attempted even on failure
      await updatePayload({ ...payload, decryptAttempted: true });
      await refreshDBStats();
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt note (not for this user)");
    } finally {
      setDecryptingPayloadId(null);
    }
  };

  // Show loading state while DB initializes
  if (db.isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing database...</p>
      </div>
    );
  }

  // Show error if DB failed to initialize
  if (db.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="text-lg font-semibold">
            Database Initialization Failed
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {db.error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer {...PAGE_METADATA.state}>
      <div className="flex flex-col gap-6 max-w-6xl text-left">
        <h1 className="text-xl font-bold">App State</h1>
        <p>
          View and manage all account state needed for private transactions.
        </p>

        {/* Payloads Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payloads ({allPayloads.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAndRefetchPayloads}
              disabled={isPayloadsLoading}
            >
              {isPayloadsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <RefreshCw className="h-4 w-4 mr-2" />
                </>
              )}
              Clear & Refetch
            </Button>
          </CardHeader>
          <CardContent>
            {isDBLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allPayloads.length > 0 ? (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr className="text-left">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Encrypted Note</th>
                      <th className="p-2 font-semibold">Attempted</th>
                      <th className="p-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayloads.map((payload: Payload) => (
                      <tr
                        key={payload.id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="p-2 font-mono text-xs">{payload.id}</td>
                        <td className="p-2 font-mono text-xs truncate max-w-xs">
                          {payload.encryptedNote.slice(0, 50)}...
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              payload.decryptAttempted
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payload.decryptAttempted ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDecryptPayload(payload)}
                            disabled={decryptingPayloadId === payload.id}
                            className="h-7 text-xs"
                          >
                            {decryptingPayloadId === payload.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Decrypt
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No payloads in database
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tree Leaves Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tree Leaves ({allTreeLeaves.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAndRefetchLeafs}
              disabled={isLeafsLoading}
            >
              {isLeafsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <RefreshCw className="h-4 w-4 mr-2" />
                </>
              )}
              Clear & Refetch
            </Button>
          </CardHeader>
          <CardContent>
            {isDBLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allTreeLeaves.length > 0 ? (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr className="text-left">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Leaf Index</th>
                      <th className="p-2 font-semibold">Leaf Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTreeLeaves.map((leaf: TreeLeaf) => (
                      <tr key={leaf.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{leaf.id}</td>
                        <td className="p-2 font-mono text-xs">
                          {leaf.leafIndex}
                        </td>
                        <td className="p-2 font-mono text-xs truncate max-w-md">
                          {leaf.leafValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No tree leaves in database
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notes ({allNotes.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAndRedecryptNotes}
              disabled={isNotesLoading}
            >
              {isNotesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <RefreshCw className="h-4 w-4 mr-2" />
                </>
              )}
              Clear & Re-decrypt
            </Button>
          </CardHeader>
          <CardContent>
            {isDBLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allNotes.length > 0 ? (
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="border-b sticky top-0 bg-background">
                    <tr className="text-left">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Asset ID</th>
                      <th className="p-2 font-semibold">Amount</th>
                      <th className="p-2 font-semibold">Owned</th>
                      <th className="p-2 font-semibold">Used</th>
                      <th className="p-2 font-semibold">Payload ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allNotes.map((note: Note) => (
                      <tr key={note.id} className="border-b hover:bg-muted/50">
                        <td className="p-1 font-mono text-xs">{note.id}</td>
                        <td className="p-1 font-mono text-xs truncate max-w-[80px]">
                          {`0x${BigInt(note.assetId).toString(16)}`}
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {note.assetAmount}
                        </td>
                        <td className="p-2 font-mono text-xs truncate max-w-[150px]">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              !(
                                BigInt(note.entity_id) ===
                                BigInt(privateAddress!)
                              )
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {BigInt(note.entity_id) === BigInt(privateAddress!)
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              note.isUsed
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {note.isUsed ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-xs truncate">
                          {note.note_payload_id || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No notes in database
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default AppStatePage;
