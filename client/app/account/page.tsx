"use client";

import { Button } from "@/components/ui/button";
import { QrCodeIcon, SendIcon } from "lucide-react";

export default function Account() {
  const isUp = false;

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 pt-0 max-w-[90%]">
      <h1 className="text-3xl text-primary">Account</h1>

      <div className="flex flex-row w-full justify-between items-center">
        {/* PORTFOLIO TOTAL */}
        <div className="flex flex-row gap-1 items-baseline">
          <h1 className="text-4xl">$100.00</h1>
          <p className={`text-xs ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : "-"}$10
          </p>
          <p className="text-xs text-gray-500">(24h)</p>
        </div>

        {/* DEPOSIT, SEND */}
        <div className="flex flex-row gap-2 ">
          <Button className="flex flex-col h-16 text-sm w-20 text-gray-700">
            <QrCodeIcon />
            Deposit
          </Button>
          <Button className="flex flex-col h-16 text-sm w-20 text-gray-700">
            <SendIcon />
            Send
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl text-primary">Assets</h1>
      </div>
    </div>
  );
}
