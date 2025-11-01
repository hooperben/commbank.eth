import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface ActionButtonsProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
}

export function ActionButtons({ onSendClick, onReceiveClick }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        onClick={onSendClick}
        size="lg"
        className="h-16 text-lg font-semibold rounded-2xl backdrop-blur-xl bg-background/40 border border-border/50 shadow-lg hover:shadow-xl hover:bg-background/60 hover:border-border/80 hover:scale-105 active:scale-95 transition-all duration-300 ease-out relative overflow-hidden
          before:absolute before:inset-0
          before:bg-gradient-to-br before:from-white/10 before:to-transparent
          before:opacity-0 hover:before:opacity-100
          before:transition-opacity before:duration-300
          after:absolute after:inset-0
          after:bg-gradient-to-tr after:from-transparent after:via-white/5 after:to-white/10
          after:opacity-60"
      >
        <ArrowUpFromLine className="mr-2 h-5 w-5" />
        SEND
      </Button>

      <Button
        onClick={onReceiveClick}
        size="lg"
        variant="outline"
        className="h-16 text-lg font-semibold rounded-2xl backdrop-blur-xl bg-background/40 border border-border/50 shadow-lg hover:shadow-xl hover:bg-background/60 hover:border-border/80 hover:scale-105 active:scale-95 transition-all duration-300 ease-out relative overflow-hidden
          before:absolute before:inset-0
          before:bg-gradient-to-br before:from-white/10 before:to-transparent
          before:opacity-0 hover:before:opacity-100
          before:transition-opacity before:duration-300
          after:absolute after:inset-0
          after:bg-gradient-to-tr after:from-transparent after:via-white/5 after:to-white/10
          after:opacity-60"
      >
        <ArrowDownToLine className="mr-2 h-5 w-5" />
        RECEIVE
      </Button>
    </div>
  );
}
