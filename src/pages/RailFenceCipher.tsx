import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Rail Fence cipher logic
function railFenceEncrypt(text: string, rails: number): string {
  if (rails <= 1) return text;
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const fence: string[][] = Array.from({ length: rails }, () => []);
  
  let rail = 0;
  let direction = 1; // 1 for down, -1 for up
  
  for (let i = 0; i < cleanText.length; i++) {
    fence[rail].push(cleanText[i]);
    
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    
    rail += direction;
  }
  
  return fence.map(row => row.join("")).join("");
}

function railFenceDecrypt(text: string, rails: number): string {
  if (rails <= 1) return text;
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  
  // First, determine where each character should go based on rail pattern
  const positions: number[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;
  
  // Map out positions for each rail in zigzag order
  for (let i = 0; i < cleanText.length; i++) {
    positions[rail].push(i);
    
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    
    rail += direction;
  }
  
  // Fill characters into rails from ciphertext
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let charIndex = 0;
  
  // Fill each rail with its characters from the ciphertext
  for (let r = 0; r < rails; r++) {
    for (let i = 0; i < positions[r].length; i++) {
      fence[r].push(cleanText[charIndex++]);
    }
  }
  
  // Read back in zigzag order to get plaintext
  const result: string[] = Array(cleanText.length);
  for (let r = 0; r < rails; r++) {
    for (let i = 0; i < positions[r].length; i++) {
      result[positions[r][i]] = fence[r][i];
    }
  }
  
  return result.join("");
}

// For decryption visualization, we need to track which rail gets filled at each step
function getDecryptionSteps(text: string, rails: number): { rail: number; charIndex: number; railPosition: number }[] {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const positions: number[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let direction = 1;
  
  // Map positions for zigzag pattern
  for (let i = 0; i < cleanText.length; i++) {
    positions[rail].push(i);
    
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    
    rail += direction;
  }
  
  // Create steps showing which rail gets filled at each step
  const steps: { rail: number; charIndex: number; railPosition: number }[] = [];
  let charIndex = 0;
  
  for (let r = 0; r < rails; r++) {
    for (let i = 0; i < positions[r].length; i++) {
      steps.push({
        rail: r,
        charIndex: charIndex,
        railPosition: positions[r][i]
      });
      charIndex++;
    }
  }
  
  return steps;
}

function getZigzagPattern(length: number, rails: number): { rail: number; char: string; position: number }[] {
  const pattern: { rail: number; char: string; position: number }[] = [];
  let rail = 0;
  let direction = 1;
  
  for (let i = 0; i < length; i++) {
    pattern.push({ rail, char: "", position: i });
    
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    
    rail += direction;
  }
  
  return pattern;
}

export default function RailFenceCipher() {
  const [inputText, setInputText] = useState("WEAREATTACKINGTONIGHT");
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [currentChar, setCurrentChar] = useState<{
    char: string;
    position: number;
    rail: number;
    step: number;
    railPosition?: number;
  } | null>(null);

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const totalSteps = cleanInput.length;
  
  const pattern = getZigzagPattern(cleanInput.length, rails);
  const decryptSteps = mode === "decrypt" ? getDecryptionSteps(cleanInput, rails) : [];
  const isValidRails = rails >= 2 && rails <= 10 && rails <= cleanInput.length;

  const startAnimation = () => {
    if (!isValidRails) return;
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(0);
    setOutputText("");
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
    setCurrentChar(null);
    setOutputText("");
  };

  // Navigate to a specific step
  const goToStep = (step: number) => {
    if (step < 0 || step >= totalSteps || !isValidRails) return;
    setIsAnimating(false);
    setActiveStep(step);
    
    if (mode === "encrypt") {
      // For encryption: follow zigzag pattern
      const patternEntry = pattern[step];
      setCurrentChar({
        char: cleanInput[step],
        position: step,
        rail: patternEntry.rail,
        step: step
      });
      setOutputText(cleanInput.slice(0, step + 1));
    } else {
      // For decryption: show which position in the zigzag is being read
      const patternEntry = pattern[step];
      const decryptedText = railFenceDecrypt(cleanInput, rails);
      setCurrentChar({
        char: decryptedText[step],
        position: step,
        rail: patternEntry.rail,
        step: step,
        railPosition: step
      });
      setOutputText(decryptedText.slice(0, step + 1));
    }
  };

  const goToPrevStep = () => {
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  const goToNextStep = () => {
    if (activeStep < totalSteps - 1) {
      goToStep(activeStep + 1);
    }
  };

  useEffect(() => {
    if (!isAnimating || activeStep < 0) return;

    if (activeStep >= totalSteps) {
      setIsAnimating(false);
      setOutputText(mode === "encrypt" 
        ? railFenceEncrypt(inputText, rails) 
        : railFenceDecrypt(inputText, rails)
      );
      return;
    }

    const timer = setTimeout(() => {
      if (mode === "encrypt") {
        const patternEntry = pattern[activeStep];
        setCurrentChar({
          char: cleanInput[activeStep],
          position: activeStep,
          rail: patternEntry.rail,
          step: activeStep
        });
        setOutputText(cleanInput.slice(0, activeStep + 1));
      } else {
        // For decryption: show zigzag reading position by position
        const patternEntry = pattern[activeStep];
        const decryptedText = railFenceDecrypt(cleanInput, rails);
        setCurrentChar({
          char: decryptedText[activeStep],
          position: activeStep,
          rail: patternEntry.rail,
          step: activeStep,
          railPosition: activeStep
        });
        setOutputText(decryptedText.slice(0, activeStep + 1));
      }
      
      setActiveStep(prev => prev + 1);
    }, 400); // Made faster: 800ms -> 400ms

    return () => clearTimeout(timer);
  }, [isAnimating, activeStep, pattern, decryptSteps, cleanInput, mode, totalSteps, inputText, rails]);

  // Reset animation state when input changes
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
    setOutputText("");
    setCurrentChar(null);
  }, [inputText, rails, mode]);

  const getFinalResult = () => {
    return mode === "encrypt" 
      ? railFenceEncrypt(inputText, rails)
      : railFenceDecrypt(inputText, rails);
  };

  // Get rail content for visualization
  const getRailContent = (railIndex: number) => {
    if (mode === "encrypt") {
      // For encryption: show characters placed in zigzag pattern
      const railChars: { char: string; position: number; isActive: boolean; isProcessed: boolean }[] = [];
      
      pattern.forEach((entry, index) => {
        if (entry.rail === railIndex && index < cleanInput.length) {
          const isActive = hasAnimated && currentChar && index === activeStep;
          const isProcessed = hasAnimated && index <= activeStep;
          railChars.push({
            char: cleanInput[index],
            position: index,
            isActive: isActive || false,
            isProcessed: isProcessed || false
          });
        }
      });
      
      return railChars;
    } else {
      // For decryption: show characters being filled into rails from ciphertext
      const railChars: { char: string; position: number; isActive: boolean; isProcessed: boolean }[] = [];
      
      decryptSteps.forEach((step, index) => {
        if (step.rail === railIndex && index < cleanInput.length) {
          const isActive = hasAnimated && currentChar && index === activeStep;
          const isProcessed = hasAnimated && index <= activeStep;
          railChars.push({
            char: cleanInput[index],
            position: step.railPosition,
            isActive: isActive || false,
            isProcessed: isProcessed || false
          });
        }
      });
      
      // Sort by rail position for correct display
      railChars.sort((a, b) => a.position - b.position);
      return railChars;
    }
  };

  return (
    <CipherLayout
      title="Rail Fence Cipher"
      description="A transposition cipher that writes text in a zigzag pattern across multiple rails"
    >
      <div className="w-full space-y-4">
        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left - Controls */}
          <div className="glass-card p-5 space-y-4">
            {/* Header with Mode Toggle and Info */}
            <div className="flex items-center justify-between">
              <ModeToggle mode={mode} onChange={setMode} />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    How It Works
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>How Rail Fence Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 text-xs">
                      {mode === "encrypt" ? (
                        <div className="bg-muted/20 rounded-lg p-3">
                          <h4 className="font-medium text-foreground mb-2">📝 Encryption Steps</h4>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Write text in zigzag pattern across <span className="text-secondary">{rails} rails</span></li>
                            <li>Start at top rail, go down, bounce at bottom</li>
                            <li>Read each rail left-to-right</li>
                            <li>Concatenate all rails for ciphertext</li>
                          </ol>
                        </div>
                      ) : (
                        <div className="bg-muted/20 rounded-lg p-3">
                          <h4 className="font-medium text-foreground mb-2">🔓 Decryption Steps</h4>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Calculate zigzag positions for <span className="text-primary">{rails} rails</span></li>
                            <li>Fill rails with ciphertext characters</li>
                            <li>Read positions in original zigzag order</li>
                            <li>Reconstruct original plaintext</li>
                          </ol>
                        </div>
                      )}
                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                        <h4 className="font-medium text-yellow-400 mb-1">💡 Example (3 rails)</h4>
                        <div className="font-mono text-xs text-muted-foreground">
                          <div>W . . . E . . . T . . . I . . . T</div>
                          <div>. E . R . A . T . C . I . G . O . .</div>
                          <div>. . A . . . T . . . K . . . N . . .</div>
                          <div className="pt-1 text-yellow-400">Read: WET + ERATIG + ATK</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">{cleanInput.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Number of Rails
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={rails}
                onChange={(e) => setRails(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                className={cn(
                  "w-full bg-input border rounded-lg px-4 py-3 text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                  isValidRails
                    ? "border-secondary text-secondary focus:ring-secondary"
                    : "border-red-500/50 text-red-400 focus:ring-red-500"
                )}
              />
              <p className={cn("text-xs mt-1", isValidRails ? "text-muted-foreground" : "text-red-400")}>
                {isValidRails
                  ? `Zigzag across ${rails} rails`
                  : `Must be 2-10 rails (text: ${cleanInput.length} chars)`
                }
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
                disabled={!isValidRails}
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon" disabled={!isValidRails}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            {hasAnimated && (
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>Character {Math.min(activeStep + 1, totalSteps)} / {totalSteps}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(Math.min(activeStep + 1, totalSteps) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Key Matrix - only for display */}
            {isValidRails && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Rail Configuration</h4>
                <div className="bg-secondary/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Rails:</span>
                    <span className="font-mono text-secondary text-lg font-bold">{rails}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Pattern:</span>
                    <span className="font-mono text-primary">Zigzag</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Direction changes at rails 1 and {rails}
                  </p>
                </div>
              </div>
            )}

            {/* Output */}
            {isValidRails && (
              <div className={cn(
                "pt-4 border-t border-border rounded-lg p-3",
                mode === "decrypt" ? "bg-green-500/10 border-green-500/30" : "bg-primary/10 border-primary/30"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground">
                    {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                  </div>
                  {hasAnimated && !isAnimating && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-3 text-xs font-medium transition-colors",
                        mode === "encrypt" 
                          ? "border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                          : "border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                      )}
                      onClick={() => {
                        const result = getFinalResult();
                        setInputText(result);
                        setMode(mode === "encrypt" ? "decrypt" : "encrypt");
                        resetAnimation();
                      }}
                    >
                      {mode === "encrypt" ? "→ Decrypt" : "→ Encrypt"}
                    </Button>
                  )}
                </div>
                <div className={cn(
                  "font-mono text-lg break-all min-h-[1.75rem]",
                  mode === "decrypt" ? "text-green-400" : "text-primary"
                )}>
                  {hasAnimated 
                    ? (!isAnimating 
                        ? getFinalResult()
                        : outputText)
                    : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                  }
                </div>
              </div>
            )}
          </div>

          {/* Right - Visualization */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Process
            </h3>

            {isValidRails ? (
              <>
                {/* Step Navigation */}
                {hasAnimated && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevStep}
                        disabled={activeStep <= 0 || isAnimating}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        {activeStep >= totalSteps ? "Complete" : `Step ${activeStep + 1}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextStep}
                        disabled={activeStep >= totalSteps - 1 || isAnimating}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Zigzag Visualization */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-3">
                    {mode === "encrypt" ? "Zigzag Pattern Visualization" : "Zigzag Reading Pattern (Main Process)"}
                  </p>
                  
                  <div className="space-y-2">
                    {Array.from({ length: rails }, (_, railIndex) => {
                      return (
                        <div key={railIndex} className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground w-12">
                            Rail {railIndex + 1}:
                          </span>
                          <div className="flex items-center gap-1 min-h-[32px]">
                            {mode === "encrypt" ? (
                              // Encryption: show full zigzag pattern with dots
                              cleanInput.split("").map((char, charIndex) => {
                                const patternEntry = pattern[charIndex];
                                const isOnThisRail = patternEntry.rail === railIndex;
                                const isActive = hasAnimated && currentChar && charIndex === activeStep;
                                const isProcessed = hasAnimated && charIndex < activeStep;
                                
                                return (
                                  <div key={charIndex} className="relative">
                                    {isOnThisRail ? (
                                      <LetterBox
                                        letter={char}
                                        variant={isActive ? "processing" : isProcessed ? "output" : "input"}
                                        isActive={isActive}
                                        className={cn(
                                          "transition-all duration-200",
                                          isActive && "ring-2 ring-primary"
                                        )}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 flex items-center justify-center text-muted-foreground/30">
                                        •
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Decryption: Show the zigzag READING pattern as main visualization
                              cleanInput.split("").map((char, charIndex) => {
                                const patternEntry = pattern[charIndex];
                                const isOnThisRail = patternEntry.rail === railIndex;
                                
                                if (!isOnThisRail) {
                                  return (
                                    <div key={charIndex} className="w-8 h-8 flex items-center justify-center text-muted-foreground/20">
                                      •
                                    </div>
                                  );
                                }
                                
                                // Show the decrypted character at this position
                                const decryptedText = railFenceDecrypt(cleanInput, rails);
                                const decryptedChar = decryptedText[charIndex];
                                const isActive = hasAnimated && currentChar && charIndex === activeStep;
                                const isProcessed = hasAnimated && charIndex < activeStep;
                                
                                return (
                                  <div key={charIndex} className="relative">
                                    <LetterBox
                                      letter={isProcessed || !hasAnimated ? decryptedChar : ""}
                                      variant={isActive ? "processing" : isProcessed ? "output" : "input"}
                                      isActive={isActive}
                                      className={cn(
                                        "transition-all duration-200",
                                        isActive && "ring-2 ring-primary animate-pulse",
                                        !isProcessed && hasAnimated && "opacity-20 border-dashed"
                                      )}
                                    />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Character Navigation */}
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">
                    {mode === "encrypt" ? "Character Sequence" : "Zigzag Reading Order (Position by Position)"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {cleanInput.split("").map((char, index) => {
                      const isActive = activeStep === index;
                      const isProcessed = hasAnimated && index <= activeStep;
                      
                      let displayChar: string;
                      let railNumber: number;
                      
                      if (mode === "encrypt") {
                        displayChar = char;
                        railNumber = pattern[index]?.rail + 1 || 1;
                      } else {
                        // For decryption: show the final decrypted character at each position
                        const decryptedText = railFenceDecrypt(cleanInput, rails);
                        displayChar = decryptedText[index];
                        railNumber = pattern[index]?.rail + 1 || 1;
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => !isAnimating && goToStep(index)}
                          disabled={isAnimating}
                          className={cn(
                            "relative group transition-all duration-200 cursor-pointer", // Made faster
                            isActive && "ring-2 ring-primary scale-110",
                            !isAnimating && "hover:scale-105"
                          )}
                        >
                          <LetterBox
                            letter={mode === "decrypt" && hasAnimated ? (isProcessed ? displayChar : "") : displayChar}
                            variant={isActive ? "processing" : isProcessed ? "output" : "input"}
                            isActive={isActive}
                          />
                          {/* Position number for zigzag reading - only for encrypt */}
                          {mode === "encrypt" && (
                            <div className={cn(
                              "absolute -top-2 -right-1 w-5 h-4 rounded text-[9px] font-bold flex items-center justify-center transition-colors",
                              isActive && "bg-primary text-primary-foreground",
                              isProcessed && !isActive && "bg-green-500/80 text-white",
                              !isProcessed && "bg-muted text-muted-foreground"
                            )}>
                              {index + 1}
                            </div>
                          )}
                          {/* Rail indicator */}
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center transition-colors",
                            isActive && (mode === "decrypt" ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"),
                            isProcessed && !isActive && "bg-muted text-muted-foreground",
                            !isProcessed && "bg-border text-muted-foreground/50"
                          )}>
                            {railNumber}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {mode === "decrypt" && (
                    <p className="text-xs text-green-400 mt-2">
                      📖 Read positions in zigzag order: 1→2→3→4... showing plaintext character at each position
                    </p>
                  )}
                </div>

                {/* Current Step Details - Removed per user request */}

                {/* Completion message */}
                {hasAnimated && !isAnimating && activeStep >= totalSteps && (
                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <span className="text-sm text-muted-foreground">
                      ✓ {mode === "encrypt" ? "Encryption" : "Decryption"} complete!
                    </span>
                    <div className="text-xs text-muted-foreground mt-2">
                      {mode === "encrypt" ? (
                        <>Read rails left-to-right: {getFinalResult()}</>
                      ) : (
                        <>
                          <div className="mb-1">Rails filled in order. Now read zigzag pattern ↗↘:</div>
                          <div className="font-mono text-green-400">{getFinalResult()}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                Enter valid text and rails (2-10)
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}