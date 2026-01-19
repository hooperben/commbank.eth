import { StatusCard } from "@/_components/status/status-card";
import { Button } from "@/_components/ui/button";
import PageContainer from "@/_providers/page-container";
import type { SystemStatus } from "@/_types";
import {
  checkIndexedDBSupport,
  checkIndexerStatus,
  checkPasskeySupport,
  checkRelayerStatus,
  checkRPCStatus,
} from "@/lib/formatting/status-helpers";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

export default function StatusPage() {
  const [rpcStatus, setRpcStatus] = useState<SystemStatus>({
    type: "loading",
    message: "Checking RPC status...",
  });
  const [indexerStatus, setIndexerStatus] = useState<SystemStatus>({
    type: "loading",
    message: "Checking indexer status...",
  });
  const [relayerStatus, setRelayerStatus] = useState<SystemStatus>({
    type: "loading",
    message: "Checking relayer status...",
  });

  const githubBuildUrl = import.meta.env.VITE_GITHUB_ACTION_BUILD_URL;

  const versionStatus: SystemStatus = {
    type: "success",
    message: "",
    info: "This GitHub action built this website and uploaded it to IPFS.",
  };

  const passkeyStatus = checkPasskeySupport();
  const indexedDBStatus = checkIndexedDBSupport();

  useEffect(() => {
    // Check RPC status
    checkRPCStatus().then(setRpcStatus);

    // Check indexer status
    checkIndexerStatus().then(setIndexerStatus);

    // Check relayer status
    checkRelayerStatus().then(setRelayerStatus);
  }, []);

  return (
    <PageContainer
      title="System Status"
      description="Monitor the health of commbank.eth services and check your browser compatibility."
    >
      <div className="max-w-4xl space-y-6 text-left">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">
            Monitor the health of commbank.eth services and check your browser
            compatibility.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatusCard title="Web App Version" status={versionStatus}>
            {githubBuildUrl ? (
              <Button variant="outline" asChild className="w-full gap-2">
                <a
                  href={githubBuildUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Deployment on GitHub
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                The actions URL is missing. This is a bug.
              </p>
            )}
          </StatusCard>
          <StatusCard title="RPC Status" status={rpcStatus} />
          <StatusCard title="Indexer Status" status={indexerStatus} />
          <StatusCard title="Relayer Status" status={relayerStatus} />
          <StatusCard title="Passkey Support" status={passkeyStatus} />
          <StatusCard title="IndexedDB Support" status={indexedDBStatus} />
        </div>
      </div>
    </PageContainer>
  );
}
