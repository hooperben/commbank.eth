import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemStatus } from "@/_types";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

interface StatusCardProps {
  title: string;
  status: SystemStatus;
  children?: React.ReactNode;
}

export function StatusCard({ title, status, children }: StatusCardProps) {
  const getStatusIcon = () => {
    switch (status.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      success: "default" as const,
      warning: "secondary" as const,
      error: "destructive" as const,
      loading: "outline" as const,
    };

    return (
      <Badge variant={variants[status.type]} className="gap-1">
        {getStatusIcon()}
        {status.type.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.info && (
          <p className="text-sm text-muted-foreground text-left">
            {status.info}
          </p>
        )}

        {children}
      </CardContent>
    </Card>
  );
}
