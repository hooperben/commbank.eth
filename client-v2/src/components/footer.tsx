import { ModeToggle } from "@/components/mode-toggle";

export default function Footer() {
  return (
    <footer className="border-t py-6 px-6 md:px-8">
      <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
        <p className="font-medium">commbank.eth</p>
        <p>open source, privacy enhancing financial technologies</p>
        <div className="flex gap-4 items-center">
          <a
            href="https://github.com"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com"
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
