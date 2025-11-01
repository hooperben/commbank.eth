import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md",
        "backdrop-blur-md bg-primary/10 border border-primary/20",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-shimmer",
        "after:absolute after:inset-0",
        "after:bg-gradient-to-br after:from-white/5 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
