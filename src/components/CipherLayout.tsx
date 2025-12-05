import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "./ui/button";

interface CipherLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function CipherLayout({ title, description, children }: CipherLayoutProps) {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              All Ciphers
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
