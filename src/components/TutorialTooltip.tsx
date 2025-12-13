import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface TutorialStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  offset?: { x: number; y: number };
  waitForClick?: boolean; // Wait for user to click the highlighted element
  triggerNext?: boolean; // Automatically go to next step after click
}

interface TutorialTooltipProps {
  steps: TutorialStep[];
  storageKey: string; // Unique key for localStorage
  onComplete?: () => void;
  autoStart?: boolean;
  onStepChange?: (step: number) => void;
}

export function TutorialTooltip({
  steps,
  storageKey,
  onComplete,
  autoStart = true,
  onStepChange,
}: TutorialTooltipProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [hasCompleted, setHasCompleted] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tutorial was already completed
    const completed = localStorage.getItem(`tutorial-${storageKey}`);
    if (completed === "true") {
      setHasCompleted(true);
      return;
    }

    if (autoStart && !hasCompleted) {
      // Small delay before starting tutorial
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey, autoStart, hasCompleted]);

  const completeTutorial = () => {
    const currentTarget = document.querySelector(steps[currentStep]?.target);
    if (currentTarget) {
      currentTarget.classList.remove("tutorial-highlight");
    }

    // Confetti celebration!
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: ReturnType<typeof setInterval> = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Launch confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    localStorage.setItem(`tutorial-${storageKey}`, "true");
    setIsActive(false);
    setHasCompleted(true);
    onComplete?.();
  };

  // Handle click listener for wait-for-click steps
  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    if (!step.waitForClick) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    setWaitingForClick(true);

    const handleClick = () => {
      setWaitingForClick(false);
      if (step.triggerNext) {
        // Automatically advance to next step after click
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            const currentTarget = document.querySelector(steps[currentStep].target);
            if (currentTarget) {
              currentTarget.classList.remove("tutorial-highlight");
            }
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            onStepChange?.(nextStep);
          } else {
            completeTutorial();
          }
        }, 500);
      }
    };

    targetElement.addEventListener('click', handleClick);

    return () => {
      targetElement.removeEventListener('click', handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      const targetElement = document.querySelector(step.target);

      if (targetElement && tooltipRef.current) {
        const targetRect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const position = step.position || "bottom";
        const offset = step.offset || { x: 0, y: 0 };

        let top = 0;
        let left = 0;

        switch (position) {
          case "top":
            top = targetRect.top - tooltipRect.height - 16 + offset.y;
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + offset.x;
            break;
          case "bottom":
            top = targetRect.bottom + 16 + offset.y;
            left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2 + offset.x;
            break;
          case "left":
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + offset.y;
            left = targetRect.left - tooltipRect.width - 16 + offset.x;
            break;
          case "right":
            top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + offset.y;
            left = targetRect.right + 16 + offset.x;
            break;
        }

        // Keep tooltip within viewport
        const margin = 16;
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

        setTooltipPosition({ top, left });

        // Add spotlight effect to target element
        targetElement.classList.add("tutorial-highlight");
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      
      // Remove highlight from previous target
      const step = steps[currentStep];
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.classList.remove("tutorial-highlight");
      }
    };
  }, [isActive, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Remove highlight from current step
      const currentTarget = document.querySelector(steps[currentStep].target);
      if (currentTarget) {
        currentTarget.classList.remove("tutorial-highlight");
      }
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Remove highlight from current step
      const currentTarget = document.querySelector(steps[currentStep].target);
      if (currentTarget) {
        currentTarget.classList.remove("tutorial-highlight");
      }
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
      setWaitingForClick(false);
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  if (!isActive || hasCompleted) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100] pointer-events-none animate-in fade-in duration-300" />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[101] w-full max-w-sm pointer-events-auto",
          "animate-in fade-in slide-in-from-bottom-4 duration-300"
        )}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl shadow-primary/20 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1 bg-background/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Header - Table Row Style */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center pb-4 border-b border-border/30">
              {/* Step Number */}
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-lg font-bold text-emerald-400">
                  {currentStep + 1}
                </span>
              </div>
              
              {/* Title */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <div className="text-xs text-muted-foreground font-mono mt-1">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleSkip}
                className="p-2 rounded-lg hover:bg-background/80 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            <div className="bg-background/50 rounded-lg p-4 border border-border/20">
              <p className="text-sm text-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Waiting Indicator */}
            {waitingForClick && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <p className="text-xs text-primary font-medium">
                  Click the highlighted element to continue
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === currentStep
                        ? "bg-primary w-6"
                        : index < currentStep
                        ? "bg-primary/50"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>

              {!waitingForClick && (
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="gap-2"
                >
                  {currentStep === steps.length - 1 ? "Finish" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pointer Arrow */}
        <div
          className={cn(
            "absolute w-4 h-4 bg-background/95 border-primary/30 rotate-45",
            step.position === "top" && "bottom-[-8px] left-1/2 -translate-x-1/2 border-b border-r",
            step.position === "bottom" && "top-[-8px] left-1/2 -translate-x-1/2 border-t border-l",
            step.position === "left" && "right-[-8px] top-1/2 -translate-y-1/2 border-t border-r",
            step.position === "right" && "left-[-8px] top-1/2 -translate-y-1/2 border-b border-l",
            !step.position && "top-[-8px] left-1/2 -translate-x-1/2 border-t border-l"
          )}
        />
      </div>

      {/* Global Styles for Highlight */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 100;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6) !important;
          border-radius: 0.5rem;
          animation: tutorial-pulse 2s ease-in-out infinite;
        }

        @keyframes tutorial-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px hsl(var(--primary) / 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px hsl(var(--primary) / 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
        }
      `}</style>
    </>
  );
}
