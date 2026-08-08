const Copyright = () => (
  <p>
    Copyright © 2026 Works App, Inc. Built with 🫶🏻 by{' '}
    <a
      href="https://x.com/alexmacgregor__"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-primary transition-colors"
    >
      Alex
    </a>.
  </p>
);

interface FooterProps {
  /** Kept for API compatibility — this standalone site only renders the minimal footer. */
  minimal?: boolean;
}

const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Footer = (_props: FooterProps = {}) => (
  <footer>
    <div className="container mx-auto px-4 max-w-7xl py-8 text-center text-sm text-muted-foreground">
      <a
        href="https://x.com/vibecodedit"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow us on X"
        className="inline-flex items-center justify-center mb-2 hover:text-primary transition-colors"
      >
        <XIcon className="h-5 w-5" />
      </a>
      <Copyright />
    </div>
  </footer>
);
