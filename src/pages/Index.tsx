import { useEffect, useRef } from 'react';
import LetterGlitch from '../components/LetterGlitch';
import { ScrollCards } from "@/components/ScrollCards";
import { SmoothScroll } from "../components/SmoothScroll";
import { TutorialTooltip, TutorialStep } from "@/components/TutorialTooltip";
import gsap from "gsap";

const homeTutorialSteps: TutorialStep[] = [
  {
    target: ".hero-title",
    title: "Welcome to Cipher Visualizer",
    description: "Your interactive platform for exploring classical and modern cryptographic algorithms with step-by-step visualizations.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='explore-button']",
    title: "Explore Ciphers",
    description: "Click this button to scroll down and view all available ciphers, from ancient Caesar to modern AES encryption.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='cipher-grid']",
    title: "Cipher Gallery",
    description: "Browse through 11 different encryption algorithms. Each card shows the cipher's name, description, and difficulty level.",
    position: "top",
    offset: { x: 0, y: -20 },
  },
  {
    target: "[data-tutorial='cipher-card-0']",
    title: "Interactive Cipher Cards",
    description: "Click any cipher card to start learning! You'll see step-by-step visualizations of how each algorithm works.",
    position: "right",
    offset: { x: 20, y: 0 },
  },
];

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glitchRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Background glitch animation - fade in
      tl.fromTo(
        glitchRef.current,
        {
          opacity: 0
        },
        {
          opacity: 1,
          duration: 1,
          ease: "power2.inOut"
        }
      );

      // Cards section - zoom in and fade in
      tl.fromTo(
        cardsRef.current,
        {
          scale: 0.95,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out"
        },
        "-=0.6" // Start before glitch animation finishes
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
      <SmoothScroll>  
      <div ref={containerRef} className="min-h-screen relative">
        {/* Tutorial */}
        <TutorialTooltip
          steps={homeTutorialSteps}
          storageKey="home-page"
          autoStart={true}
          onStepChange={(step) => {
            // When advancing to step 2 (Cipher Gallery), trigger scroll
            if (step === 2) {
              const exploreButton = document.querySelector("[data-tutorial='explore-button']") as HTMLButtonElement;
              if (exploreButton) {
                setTimeout(() => {
                  exploreButton.click();
                }, 300);
              }
            }
          }}
        />

        {/* Background Letter Glitch - Full Screen */}
        <div ref={glitchRef} className="fixed inset-0 z-0">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
          />
        </div>

        {/* Main Interactive Cards Experience - Full Screen */}
        <div ref={cardsRef} className="relative z-10">
          <ScrollCards />
        </div>
      </div>
      </SmoothScroll>
  );
};

export default Index;
