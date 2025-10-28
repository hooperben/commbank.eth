const Footer = () => (
  <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-muted-foreground">
          <span>commbank.eth</span>
          <span className="hidden md:inline">•</span>
          <span>open source, privacy enhancing financial technologies</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://github.com/hooperben/commbank.eth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://x.com/commbankdoteth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </div>
  </footer>
);
export default Footer;
