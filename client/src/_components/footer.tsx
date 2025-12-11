import { ModeToggle } from "@/_components/ui/mode-toggle";
import { FooterStatusIndicator } from "@/_components/status/footer-status-indicator";

export default function Footer() {
  return (
    <footer className="border-t py-6 px-6 md:px-8">
      <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <p className="font-medium">commbank.eth</p>
          <FooterStatusIndicator />
        </div>
        <p>open source, privacy enhancing financial technologies</p>
        <div className="flex gap-4 items-center">
          <a
            href="https://github.com/hooperben/commbank.eth"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com/commbankdoteth"
            className="hover:text-foreground transition-colors"
          >
            Twitter
          </a>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
