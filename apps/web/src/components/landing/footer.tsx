import { Globe } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="container mx-auto px-6 py-8 border-t">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-semibold">Dhanam</span>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            © 2026 Dhanam. Autonomous Family Office for Everyone.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for Mexico and the Americas. Available on web and mobile.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
}
