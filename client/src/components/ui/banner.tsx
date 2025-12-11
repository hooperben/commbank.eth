import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        warning:
          "border-yellow-500/50 text-yellow-900 dark:border-yellow-500 [&>svg]:text-yellow-600 dark:text-yellow-200 bg-yellow-400/90 dark:bg-yellow-950/90",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        info: "border-blue-500/50 text-blue-900 dark:border-blue-500 [&>svg]:text-blue-600 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ className, variant, dismissible, onDismiss, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      {children}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ),
);
Banner.displayName = "Banner";

const BannerTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
BannerTitle.displayName = "BannerTitle";

const BannerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
BannerDescription.displayName = "BannerDescription";

export { Banner, BannerTitle, BannerDescription };
