import { useEffect, useState } from "react";
import PageContainer from "@/components/page-container";
import { StatusCard } from "@/components/status/status-card";
import { Button } from "@/components/ui/button";
import type { SystemStatus } from "@/_types";
import {
  checkRPCStatus,
  checkIndexerStatus,
  checkPasskeySupport,
  checkIndexedDBSupport,
} from "@/lib/status-helpers";
import { ExternalLink } from "lucide-react";

export default function StatusPage() {
  const [rpcStatus, setRpcStatus] = useState<SystemStatus>({
    type: "loading",
    message: "Checking RPC status...",
  });
  const [indexerStatus, setIndexerStatus] = useState<SystemStatus>({
    type: "loading",
    message: "Checking indexer status...",
  });

  const githubBuildUrl = import.meta.env.VITE_GITHUB_ACTION_BUILD_URL;

  console.log(githubBuildUrl);

  const versionStatus: SystemStatus = {
    type: "success",
    message: "",
    info: "This GitHub action built the web app.",
  };

  const passkeyStatus = checkPasskeySupport();
  const indexedDBStatus = checkIndexedDBSupport();

  useEffect(() => {
    // Check RPC status
    checkRPCStatus().then(setRpcStatus);

    // Check indexer status
    checkIndexerStatus().then(setIndexerStatus);
  }, []);

  return (
    <PageContainer
      title="System Status"
      description="Check the status of commbank.eth services and browser compatibility"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground">
            Monitor the health of commbank.eth services and check browser
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
          <StatusCard title="Passkey Support" status={passkeyStatus} />
          <StatusCard title="IndexedDB Support" status={indexedDBStatus} />
        </div>
      </div>
    </PageContainer>
  );
}
