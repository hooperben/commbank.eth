import type { DerivedAddresses } from "@/_types";

interface AddressPreviewProps {
  addresses: DerivedAddresses;
}

export function AddressPreview({ addresses }: AddressPreviewProps) {
  return (
    <div className="space-y-3 rounded-md border border-input p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          EVM Address:
        </p>
        <p className="text-xs font-mono break-all leading-relaxed">
          {addresses.address}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Private Owner Address:
        </p>
        <p className="text-xs font-mono break-all leading-relaxed">
          {addresses.privateAddress}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Envelope:
        </p>
        <p className="text-xs font-mono break-all leading-relaxed">
          {addresses.envelope}
        </p>
      </div>
    </div>
  );
}
