import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  checkRPCStatus,
  checkIndexerStatus,
} from "@/lib/formatting/status-helpers";

export function FooterStatusIndicator() {
  const [isOperational, setIsOperational] = useState<boolean | null>(null);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const [rpcStatus, indexerStatus] = await Promise.all([
        checkRPCStatus(),
        checkIndexerStatus(),
      ]);

      // Consider operational if both RPC and indexer are success
      const operational =
        rpcStatus.type === "success" && indexerStatus.type === "success";

      setIsOperational(operational);
    } catch (error) {
      console.error("Failed to check system status:", error);
      setIsOperational(false);
    }
  };

  if (isOperational === null) {
    // Loading state - don't show anything
    return null;
  }

  return (
    <Link
      to="/status"
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {isOperational ? (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>Systems Operational</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span>Degraded Performance</span>
        </>
      )}
    </Link>
  );
}
