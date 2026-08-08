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

export const Footer = (_props: FooterProps = {}) => (
  <footer>
    <div className="container mx-auto px-4 max-w-7xl py-8 text-center text-sm text-muted-foreground">
      <a
        href="https://x.com/vibecodedit"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mb-2 hover:text-primary transition-colors"
      >
        Follow us on X
      </a>
      <Copyright />
    </div>
  </footer>
);
