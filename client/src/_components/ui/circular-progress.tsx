import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number;
  isComplete?: boolean;
  currentStep?: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  progress,
  isComplete = false,
  currentStep = "",
  size = 180,
  strokeWidth = 8,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500 ease-in-out",
            isComplete ? "text-green-500" : "text-primary",
          )}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 animate-in zoom-in duration-300">
            <Check className="h-8 w-8 text-green-500" strokeWidth={3} />
          </div>
        ) : (
          <div className="px-6 text-center">
            <p className="text-pretty text-sm font-medium leading-tight">
              {currentStep || "Processing..."}
            </p>
          </div>
        )}
      </div>

      {/* Animated pulse ring for active state */}
      {!isComplete && progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full bg-primary/20 animate-ping"
            style={{
              width: size * 0.85,
              height: size * 0.85,
              animationDuration: "2s",
            }}
          />
        </div>
      )}
    </div>
  );
}
