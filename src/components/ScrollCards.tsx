import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
import { cn } from "@/lib/utils";
import { 
  KeyRound, 
  Shield, 
  Lock, 
  ChevronDown,
  Shuffle,
  Grid3X3,
  Key,
  Rows3,
  Layers,
  FileKey,
  SquareAsterisk
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CipherCard } from "@/components/CipherCard";

gsap.registerPlugin(ScrollTrigger);

const allCiphers = [
  // Classical Ciphers
  {
    title: "Caesar Cipher",
    description: "Classic substitution cipher that shifts each letter by a fixed number of positions.",
    icon: <KeyRound className="w-6 h-6" />,
    href: "/caesar",
    difficulty: "Easy" as const,
    category: "Classical"
  },
  {
    title: "Vigenère Cipher",
    description: "Polyalphabetic cipher using a keyword to determine shifting patterns.",
    icon: <Key className="w-6 h-6" />,
    href: "/vigenere",
    difficulty: "Medium" as const,
    category: "Classical"
  },
  {
    title: "Monoalphabetic Cipher",
    description: "Simple substitution where each letter maps to exactly one other letter.",
    icon: <Shuffle className="w-6 h-6" />,
    href: "/monoalphabetic",
    difficulty: "Easy" as const,
    category: "Classical"
  },
  {
    title: "Playfair Cipher",
    description: "Digraph substitution cipher using a 5×5 key matrix.",
    icon: <SquareAsterisk className="w-6 h-6" />,
    href: "/playfair",
    difficulty: "Medium" as const,
    category: "Classical"
  },
  {
    title: "Hill Cipher",
    description: "Matrix-based encryption using linear algebra for letter transformation.",
    icon: <Grid3X3 className="w-6 h-6" />,
    href: "/hill",
    difficulty: "Advanced" as const,
    category: "Classical"
  },
  {
    title: "Row Transposition",
    description: "Rearranges plaintext characters based on a keyword permutation pattern.",
    icon: <Rows3 className="w-6 h-6" />,
    href: "/transposition",
    difficulty: "Medium" as const,
    category: "Classical"
  },
  {
    title: "Rail Fence Cipher",
    description: "Transposition cipher that writes text in a zigzag pattern across multiple rails.",
    icon: <Layers className="w-6 h-6" />,
    href: "/railfence",
    difficulty: "Medium" as const,
    category: "Classical"
  },
  // Modern Ciphers
  {
    title: "AES Encryption",
    description: "Advanced Encryption Standard - modern symmetric encryption algorithm.",
    icon: <Shield className="w-6 h-6" />,
    href: "/aes",
    difficulty: "Advanced" as const,
    category: "Modern"
  },
  {
    title: "DES Encryption",
    description: "Data Encryption Standard - symmetric block cipher with 56-bit key.",
    icon: <Lock className="w-6 h-6" />,
    href: "/des",
    difficulty: "Advanced" as const,
    category: "Modern"
  },
  {
    title: "One-Time Pad",
    description: "Theoretically unbreakable cipher using random keys of equal message length.",
    icon: <FileKey className="w-6 h-6" />,
    href: "/otp",
    difficulty: "Advanced" as const,
    category: "Modern"
  },
  {
    title: "Polyalphabetic Ciphers",
    description: "Uses multiple substitution alphabets to encrypt the message.",
    icon: <Layers className="w-6 h-6" />,
    href: "/polyalphabetic",
    difficulty: "Medium" as const,
    category: "Classical"
  },
];


export function ScrollCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);




 useEffect(() => {
    const timer = setTimeout(() => {
      // Set initial state for the cipher section - responsive scaling
      if (sectionRef.current) {
        const isMobile = window.innerWidth < 768;
        gsap.set(sectionRef.current, {
          scale: isMobile ? 0.7 : 0.5,
          opacity: 0.3,
          y: 50,
        });
      }

      const ctx = gsap.context(() => {
        // Responsive scale up animation for the cipher section
        const isMobile = window.innerWidth < 768;
        const scaleAnimation = gsap.to(sectionRef.current, {
          scale: 1,
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          duration: isMobile ? 1 : 1.5,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: isMobile ? 'top 90%' : 'top 80%',
            end: isMobile ? 'top 30%' : 'top 20%',
            scrub: isMobile ? 0.3 : 0.5,
          },
        });

        // Enhanced stagger cards animation with responsive delays
        const cards = cardsRef.current?.querySelectorAll('.cipher-card');
        if (cards) {
          gsap.fromTo(
            cards,
            {
              y: isMobile ? 40 : 60,
              opacity: 0,
              scale: isMobile ? 0.95 : 0.9,
              rotationX: 15
            },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              rotationX: 0,
              duration: isMobile ? 0.6 : 0.8,
              stagger: {
                amount: isMobile ? 0.6 : 1.0,
                from: "start",
                ease: "power2.out"
              },
              ease: 'back.out(1.2)',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: isMobile ? 'top 70%' : 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
        
        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
      });

      // Handle window resize for responsive animations
      const handleResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        ctx.revert();
        window.removeEventListener('resize', handleResize);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const scrollToCiphers = () => {
    const section = sectionRef.current;
    if (section) {
      const offsetTop = section.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative w-full">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative">
        <div className="text-center p-4 max-w-4xl mx-auto">


          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-fade-in [animation-delay:200ms]">
                 Ciphers            
          <span className=" neon-text ml-2">
             Visualizer
            </span>
          </h1>



          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in [animation-delay:600ms]">
            <Button
              size="lg"
              onClick={scrollToCiphers}
              className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.5)] transition-all duration-300 transform hover:scale-105"
            >
              Explore Ciphers
            </Button>
          </div>
              <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
          <span className="font-mono text-sm">scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </div>

    
        </div>
      </section>

      {/* Cipher Grid Section - Full Screen */}
      <section 
        ref={sectionRef}
        className="min-h-screen w-full bg-gradient-to-br from-background via-background/98 to-background/95 backdrop-blur-2xl border-t border-white/20 flex items-center justify-center relative overflow-hidden"
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center max-w-none relative z-10 py-8 sm:py-12 lg:py-16">
          {/* Enhanced Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 mt-4 sm:mt-6 lg:mt-8">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground/90 max-w-2xl lg:max-w-4xl mx-auto leading-relaxed px-4">
              Explore the complete collection of{' '}
              <span className="text-primary font-semibold">cryptographic algorithms</span>{' '}
              from ancient to modern
            </p>
            
            {/* Decorative Elements */}
            <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
              <div className="w-8 sm:w-12 h-px bg-gradient-to-r from-transparent to-primary/50" />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div className="w-8 sm:w-16 h-px bg-gradient-to-r from-primary/50 to-transparent" />
            </div>
            

          </div>
          
          {/* Responsive Cipher Grid */}
          <div className="flex-1 flex flex-col justify-center max-w-none" ref={cardsRef}>
            <div className="w-full px-2 sm:px-4 lg:px-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mx-auto max-w-[1600px]">
                {allCiphers.map((cipher, index) => (
                  <div 
                    key={`overview-${cipher.title}`}
                    className="cipher-card group"
                    style={{
                      perspective: '1000px',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <CipherCard
                      {...cipher}
                      delay={0}
                      className="h-full transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/20"
                    />
                  </div>
                ))}
              </div>
              
              {/* Grid Footer */}
              <div className="text-center mt-8 sm:mt-12 lg:mt-16">
                <p className="text-xs sm:text-sm text-muted-foreground/70">
                  Click any cipher to start your cryptographic journey
                </p>
                <div className="w-16 sm:w-20 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
