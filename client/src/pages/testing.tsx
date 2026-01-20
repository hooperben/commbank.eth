import { Button } from "@/_components/ui/button";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { useDBStats } from "@/_hooks/use-indexed-db";
import { useIndexerLeafs } from "@/_hooks/use-indexer-leafs";
import { useIndexerNotes } from "@/_hooks/use-indexer-notes";
import { useAuth } from "@/_providers/auth-provider";
import { NoteDecryption } from "shared/classes/Note";
import {
  AlertCircle,
  Database,
  DatabaseZap,
  Loader2,
  Lock,
} from "lucide-react";
import { Deposit } from "shared/classes/Deposit";
import { Transact } from "shared/classes/Transact";
import { Withdraw } from "shared/classes/Withdraw";
import { toast } from "sonner";

// Component for indexer payload row
const IndexerPayloadRow = ({
  note,
  checkInDB,
  getEnvelopeKey,
}: {
  note: { id: string; encryptedNote: string };
  checkInDB: (id: string) => Promise<boolean>;
  getEnvelopeKey: () => Promise<string | null>;
}) => {
  const [isInDB, setIsInDB] = useState<boolean | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    checkInDB(note.id).then(setIsInDB);
  }, [note.id, checkInDB]);

  const handleDecrypt = async () => {
    setIsDecrypting(true);
    try {
      const envelopeKey = await getEnvelopeKey();
      if (!envelopeKey) {
        toast.error("Please sign in to decrypt notes");
        return;
      }

      const decrypted = await NoteDecryption.decryptEncryptedNote(
        note.encryptedNote,
        envelopeKey,
      );

      console.log("Decrypted note:", decrypted);
      toast.success("Note decrypted! Check console for details");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error("Failed to decrypt note");
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-2 font-mono text-xs">{note.id}</td>
      <td className="p-2 font-mono text-xs truncate max-w-md">
        {note.encryptedNote}
      </td>
      <td className="p-2">
        {isInDB === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isInDB ? (
          <div className="flex items-center gap-1 text-green-600">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">In DB</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <DatabaseZap className="h-4 w-4" />
            <span className="text-xs">Not in DB</span>
          </div>
        )}
      </td>
      <td className="p-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDecrypt}
            disabled={isDecrypting}
            className="h-7 text-xs"
          >
            {isDecrypting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Decrypt
              </>
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Component for indexer leaf row
const IndexerLeafRow = ({
  leaf,
  checkInDB,
}: {
  leaf: { id: string; leafIndex: string; leafValue: string };
  checkInDB: (id: string) => Promise<boolean>;
}) => {
  const [isInDB, setIsInDB] = useState<boolean | null>(null);

  useEffect(() => {
    checkInDB(leaf.id).then(setIsInDB);
  }, [leaf.id, checkInDB]);

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-2 font-mono text-xs">{leaf.id}</td>
      <td className="p-2 font-mono text-xs">{leaf.leafIndex}</td>
      <td className="p-2 font-mono text-xs truncate max-w-md">
        {leaf.leafValue}
      </td>
      <td className="p-2">
        {isInDB === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isInDB ? (
          <div className="flex items-center gap-1 text-green-600">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">In DB</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <DatabaseZap className="h-4 w-4" />
            <span className="text-xs">Not in DB</span>
          </div>
        )}
      </td>
    </tr>
  );
};

const TestingPage = () => {
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  // Get auth context
  const { getEnvelopeKey } = useAuth();

  // Use the IndexedDB hook - it handles initialization automatically
  const {
    stats: dbStats,
    allNotes,
    allTreeLeaves,
    allPayloads,
    isLoading: isDBLoading,
    refresh: refreshDBStats,
    db,
  } = useDBStats();

  // Use indexer hooks
  const {
    data: indexerNotes,
    isLoading: isNotesLoading,
    error: notesError,
  } = useIndexerNotes(50, 0);

  const {
    data: indexerLeafs,
    isLoading: isLeafsLoading,
    error: leafsError,
  } = useIndexerLeafs(50, 0);

  // Check if indexer records exist in IndexedDB
  const checkPayloadInDB = async (id: string): Promise<boolean> => {
    try {
      const payload = await db.getPayload(id);
      return !!payload;
    } catch {
      return false;
    }
  };

  const checkLeafInDB = async (id: string): Promise<boolean> => {
    try {
      const leaf = await db.getTreeLeaf(id);
      return !!leaf;
    } catch {
      return false;
    }
  };

  const handleDepositProof = async () => {
    setIsDepositLoading(true);
    try {
      // const hash =
      // 15877031116292595040191017675338240539290338653409019794000313907399651592164n;
      const asset_id = 1096978651789611665652906124278561787240579697095n;
      const amount = 5n;
      const owner =
        10812186542955647827474372651967207045861174805371180171801345448553285386806n;
      const secret =
        2389312107716289199307843900794656424062350252250388738019021107824217896920n;

      const deposit = new Deposit();

      const noteHash = poseidon2Hash([
        BigInt(asset_id),
        BigInt(amount),
        BigInt(owner),
        BigInt(secret),
      ]);

      const noteHashN = BigInt(noteHash.toString());

      await deposit.depositNoir.init();

      const { witness } = await deposit.depositNoir.execute({
        hash: noteHashN.toString(),
        asset_id: asset_id.toString(),
        asset_amount: amount.toString(),
        owner: owner.toString(),
        secret: secret.toString(),
      });

      const proof = await deposit.depositBackend.generateProof(witness, {
        keccak: true,
      });

      console.log("Deposit Proof:", proof);
    } catch (err) {
      console.error("Deposit error: ", err);
    } finally {
      setIsDepositLoading(false);
    }
  };

  const handleTransferProof = async () => {
    setIsTransferLoading(true);
    try {
      console.log("Starting transfer proof generation...");

      const HEIGHT = 12;

      // Test data from transfer circuit main.nr
      const root =
        4221110344891604176205088962198904729260430126413313722462390172704999703195n;
      const asset_id = 1096978651789611665652906124278561787240579697095n;

      // Input note (Alice spending 5 tokens)
      const input_note = {
        asset_id: asset_id.toString(),
        asset_amount: "5",
        owner:
          "10812186542955647827474372651967207045861174805371180171801345448553285386806",
        owner_secret:
          "10036677144260647934022413515521823129584317400947571241312859176539726523915",
        secret:
          "2389312107716289199307843900794656424062350252250388738019021107824217896920",
        leaf_index: "0",
        path: [
          "13640659629327953230197633652529006805891215582818597888084863207147219313784",
          "19984673905358619496530873554532699316557532969285237470013525856790495658245",
          "16054022188397161938956278061878851932956033792728066452148841350372709856325",
          "5088416905632566847489144423785449560596474956704206833561295200206123281740",
          "7133742548945823648162717112853949322814446130740022056636610844051076979955",
          "15996976533936258369996214630141201173712053425083354410411158951568838211277",
          "12856765864455281126306545538308148448222111081433610923407492298111988109924",
          "4407863489559565071205165471845081321675763465852502126771740970311657294198",
          "20448284296610764092326252358036828964180135505542140040145855516028834425624",
          "7022843789375185322738689530892530453984779704784378294646894048972162829679",
          "10906054357754859492130109809751867122631984061959461434096281674698176679467",
        ],
        path_indices: ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
      };

      // Empty input notes
      const empty_input_note = {
        asset_id: "0",
        asset_amount: "0",
        owner: "0",
        owner_secret: "0",
        secret: "0",
        leaf_index: "0",
        path: Array(HEIGHT - 1).fill("0"),
        path_indices: Array(HEIGHT - 1).fill("0"),
      };

      // Output notes: Alice gets 3, Bob gets 2
      const alice_output_note = {
        owner:
          "10812186542955647827474372651967207045861174805371180171801345448553285386806",
        secret:
          "19536471094918068928039225564664574556680178861106125446000998678966251111926",
        asset_id: asset_id.toString(),
        asset_amount: "3",
      };

      const bob_output_note = {
        owner:
          "6868973719921785236727144517868768664734231208097695530688003960085654392226",
        secret:
          "3957740128091467064337395812164919758932045173069261808814882570720300029469",
        asset_id: asset_id.toString(),
        asset_amount: "2",
      };

      const empty_output_note = {
        owner: "0",
        secret: "0",
        asset_id: "0",
        asset_amount: "0",
      };

      const nullifiers = [
        "3889730504789135603011318287331683111639714777739573239289638917879152395137",
        "0",
        "0",
      ];

      const output_hashes = [
        "8576856452718270547402366094981334736141859948414539161051536617849336979212",
        "4033300113401483633011546954450009404136112133461230452107665732116532508739",
        "0",
      ];

      const transact = new Transact();
      await transact.transactNoir.init();

      const { witness } = await transact.transactNoir.execute({
        root: root.toString(),
        input_notes: [input_note, empty_input_note, empty_input_note],
        output_notes: [alice_output_note, bob_output_note, empty_output_note],
        nullifiers,
        output_hashes,
      });

      const proof = await transact.transactBackend.generateProof(witness, {
        keccak: true,
      });

      console.log("Transfer Proof:", proof);
    } catch (err) {
      console.error("Transfer error: ", err);
    } finally {
      setIsTransferLoading(false);
    }
  };

  const handleWithdrawProof = async () => {
    setIsWithdrawLoading(true);
    try {
      console.log("Starting withdraw proof generation...");

      const HEIGHT = 12;

      // Test data from withdraw circuit main.nr
      const root =
        9770762522284292133040204594656801249089743659015207279808423545223243067226n;
      const asset_id = 1096978651789611665652906124278561787240579697095n;

      // Bob's input note (withdrawing 2 tokens)
      const bob_input_note = {
        asset_id: asset_id.toString(),
        asset_amount: "2",
        owner:
          "6868973719921785236727144517868768664734231208097695530688003960085654392226",
        owner_secret:
          "6955001134965379637962992480442037189090898019061077075663294923529403402038",
        secret:
          "3957740128091467064337395812164919758932045173069261808814882570720300029469",
        leaf_index: "2",
        path: [
          "13640659629327953230197633652529006805891215582818597888084863207147219313784",
          "18380261439356865501884569257940638985761619337694138929913102368174989083576",
          "16054022188397161938956278061878851932956033792728066452148841350372709856325",
          "5088416905632566847489144423785449560596474956704206833561295200206123281740",
          "7133742548945823648162717112853949322814446130740022056636610844051076979955",
          "15996976533936258369996214630141201173712053425083354410411158951568838211277",
          "12856765864455281126306545538308148448222111081433610923407492298111988109924",
          "4407863489559565071205165471845081321675763465852502126771740970311657294198",
          "20448284296610764092326252358036828964180135505542140040145855516028834425624",
          "7022843789375185322738689530892530453984779704784378294646894048972162829679",
          "10906054357754859492130109809751867122631984061959461434096281674698176679467",
        ],
        path_indices: ["1", "0", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
      };

      const empty_input_note = {
        asset_id: "0",
        asset_amount: "0",
        owner: "0",
        owner_secret: "0",
        secret: "0",
        leaf_index: "0",
        path: Array(HEIGHT - 1).fill("0"),
        path_indices: Array(HEIGHT - 1).fill("0"),
      };

      const exit_addresses = [asset_id.toString(), "0", "0"];
      const exit_hash = poseidon2Hash([BigInt(asset_id)]);
      const exit_address_hashes = [exit_hash.toString(), "0", "0"];

      const nullifiers = [
        "4114950840897945428984428368446053738282984086981274614627600851726952485197",
        "0",
        "0",
      ];

      const exit_assets = [asset_id.toString(), "0", "0"];
      const exit_amounts = ["2", "0", "0"];

      const withdraw = new Withdraw();
      await withdraw.withdrawNoir.init();

      const { witness } = await withdraw.withdrawNoir.execute({
        root: root.toString(),
        input_notes: [bob_input_note, empty_input_note, empty_input_note],
        nullifiers,
        exit_assets,
        exit_amounts,
        exit_addresses,
        exit_address_hashes,
      });

      const proof = await withdraw.withdrawBackend.generateProof(witness, {
        keccak: true,
      });

      console.log("Withdraw Proof:", proof);
    } catch (err) {
      console.error("Withdraw error: ", err);
    } finally {
      setIsWithdrawLoading(false);
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
    <div className="flex flex-col gap-6 p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Testing Page</h1>

      {/* Proof Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Proof Testing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={handleDepositProof} disabled={isDepositLoading}>
            {isDepositLoading
              ? "Generating Deposit Proof..."
              : "Generate Deposit Proof"}
          </Button>
          <Button
            onClick={handleTransferProof}
            variant="secondary"
            disabled={isTransferLoading}
          >
            {isTransferLoading
              ? "Generating Transfer Proof..."
              : "Generate Transfer Proof"}
          </Button>
          <Button
            onClick={handleWithdrawProof}
            variant="outline"
            disabled={isWithdrawLoading}
          >
            {isWithdrawLoading
              ? "Generating Withdraw Proof..."
              : "Generate Withdraw Proof"}
          </Button>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Open the browser console to see proof generation results
            </p>
          </div>
        </CardContent>
      </Card>

      {/* IndexedDB Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>IndexedDB Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Button onClick={refreshDBStats} variant="secondary">
              Refresh Stats
            </Button>
          </div>

          {/* Stats display */}
          {isDBLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            dbStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Total Notes</p>
                  <p className="text-2xl font-bold">{dbStats.notes}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unused Notes</p>
                  <p className="text-2xl font-bold">{dbStats.unusedNotes}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tree Leaves</p>
                  <p className="text-2xl font-bold">{dbStats.treeLeaves}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payloads</p>
                  <p className="text-2xl font-bold">{dbStats.payloads}</p>
                </div>
              </div>
            )
          )}

          {/* Data display */}
          <div className="space-y-4">
            {/* Notes */}
            {allNotes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {allNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-muted/50 rounded text-xs font-mono"
                    >
                      <p>
                        <span className="font-bold">ID:</span> {note.id}
                      </p>
                      <p>
                        <span className="font-bold">Asset:</span> {note.assetId}{" "}
                        ({note.assetAmount})
                      </p>
                      <p>
                        <span className="font-bold">Entity:</span>{" "}
                        {note.entity_id}
                      </p>
                      <p>
                        <span className="font-bold">Used:</span>{" "}
                        {note.isUsed ? "Yes" : "No"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tree Leaves */}
            {allTreeLeaves.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tree Leaves</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {allTreeLeaves.map((leaf) => (
                    <div
                      key={leaf.id}
                      className="p-3 bg-muted/50 rounded text-xs font-mono"
                    >
                      <p>
                        <span className="font-bold">ID:</span> {leaf.id}
                      </p>
                      <p>
                        <span className="font-bold">Index:</span>{" "}
                        {leaf.leafIndex}
                      </p>
                      <p>
                        <span className="font-bold">Value:</span>{" "}
                        {leaf.leafValue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payloads */}
            {allPayloads.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Payloads</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {allPayloads.map((payload) => (
                    <div
                      key={payload.id}
                      className="p-3 bg-muted/50 rounded text-xs font-mono"
                    >
                      <p>
                        <span className="font-bold">ID:</span> {payload.id}
                      </p>
                      <p className="truncate">
                        <span className="font-bold">Note:</span>{" "}
                        {payload.encryptedNote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indexer Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Indexer Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Indexer Notes Table */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">
              Note Payloads ({indexerNotes?.length || 0})
            </h3>
            {isNotesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notesError ? (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading notes: {notesError.message}</span>
              </div>
            ) : indexerNotes && indexerNotes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Encrypted Note</th>
                      <th className="p-2 font-semibold">Status</th>
                      <th className="p-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexerNotes.map((note) => (
                      <IndexerPayloadRow
                        key={note.id}
                        note={note}
                        checkInDB={checkPayloadInDB}
                        getEnvelopeKey={getEnvelopeKey}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No note payloads found
              </p>
            )}
          </div>

          {/* Indexer Leafs Table */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">
              Tree Leaves ({indexerLeafs?.length || 0})
            </h3>
            {isLeafsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leafsError ? (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Error loading leafs: {leafsError.message}</span>
              </div>
            ) : indexerLeafs && indexerLeafs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-2 font-semibold">ID</th>
                      <th className="p-2 font-semibold">Leaf Index</th>
                      <th className="p-2 font-semibold">Leaf Value</th>
                      <th className="p-2 font-semibold">Status</th>
                      <th className="p-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indexerLeafs.map((leaf) => (
                      <IndexerLeafRow
                        key={leaf.id}
                        leaf={leaf}
                        checkInDB={checkLeafInDB}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No tree leaves found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestingPage;
