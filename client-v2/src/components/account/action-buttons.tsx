import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface ActionButtonsProps {
  onEncryptClick: () => void;
  onReceiveClick: () => void;
}

export function ActionButtons({
  onEncryptClick,
  onReceiveClick,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-row gap-2 space-x-2 w-full justify-center">
      <Button
        onClick={onEncryptClick}
        size="lg"
        className="min-w-[200px] text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200 shadow-none border-0"
      >
        <ArrowUpFromLine className="mr-2 h-4 w-4" />
        Encrypt
      </Button>

      <Button
        onClick={onReceiveClick}
        size="lg"
        variant="outline"
        className="min-w-[200px] text-sm font-medium rounded-lg bg-muted border-0 text-foreground hover:bg-muted/80 transition-colors duration-200"
      >
        <ArrowDownToLine className="mr-2 h-4 w-4" />
        Receive
      </Button>
    </div>
  );
}
