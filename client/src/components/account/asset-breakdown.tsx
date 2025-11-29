import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";
import { BalanceRow } from "../token/balance";

export function AssetBreakdown() {
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-center p-3 font-semibold">Public</th>
                  <th className="text-center p-3 font-semibold">Private</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.symbol}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 font-semibold text-left">
                      {asset.symbol}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BalanceRow
                          key={`${asset.address}${asset.chainId}`}
                          asset={asset}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        0{/* TODO */}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      <BalanceRow
                        key={`${asset.address}${asset.chainId}`}
                        asset={asset}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
