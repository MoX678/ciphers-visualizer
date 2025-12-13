import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "./ui/button";
import { CipherSidebar } from "./CipherSidebar";
import gsap from "gsap";

interface CipherLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function CipherLayout({ title, description, children }: CipherLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animate on page load
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      // Header animation - slide down and fade in
      tl.fromTo(
        headerRef.current,
        {
          y: -100,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out"
        }
      );

      // Content animation - fade in and slide up
      tl.fromTo(
        contentRef.current,
        {
          y: 50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out"
        },
        "-=0.3" // Start slightly before header animation ends
      );
    }, mainRef);

    return () => ctx.revert();
  }, [location.pathname]); // Re-run animation on route change

  return (
    <div ref={mainRef} className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header ref={headerRef} className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50 relative">
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Home className="w-4 h-4" />
            All Ciphers
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <CipherSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content */}
      <main ref={contentRef} className="px-4 lg:px-8 py-6 relative z-10">
        {children}
      </main>
    </div>
  );
}
