import { Button } from "@/components/ui/button";
import { poseidon2Hash } from "@zkpassport/poseidon2";

import { Deposit } from "shared/classes/Deposit";
import { Transact } from "shared/classes/Transact";
import { Withdraw } from "shared/classes/Withdraw";

const TestingPage = () => {
  const handleDepositProof = async () => {
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
    }
  };

  const handleTransferProof = async () => {
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
    }
  };

  const handleWithdrawProof = async () => {
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
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-2xl font-bold mb-4">Proof Testing</h1>

      <div className="flex flex-col gap-2">
        <Button onClick={handleDepositProof}>Generate Deposit Proof</Button>
        <Button onClick={handleTransferProof} variant="secondary">
          Generate Transfer Proof
        </Button>
        <Button onClick={handleWithdrawProof} variant="outline">
          Generate Withdraw Proof
        </Button>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Open the browser console to see proof generation results
        </p>
      </div>
    </div>
  );
};

export default TestingPage;
