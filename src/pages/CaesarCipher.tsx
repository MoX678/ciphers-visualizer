import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { AlphabetWheel } from "@/components/AlphabetWheel";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TutorialTooltip, TutorialStep } from "@/components/TutorialTooltip";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const cipherTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='mode-toggle']",
    title: "Encrypt or Decrypt Mode",
    description: "Switch between encryption and decryption modes. Encryption encodes your message, while decryption reveals the original text.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='input-area']",
    title: "Enter Your Message",
    description: "Type the text you want to encrypt or decrypt. The cipher works with letters only—other characters remain unchanged.",
    position: "right",
    offset: { x: 20, y: 0 },
  },
  {
    target: "[data-tutorial='shift-control']",
    title: "Adjust the Shift Amount",
    description: "The shift determines how many positions each letter moves in the alphabet. Try different values to see how it affects the result!",
    position: "right",
    offset: { x: 20, y: 0 },
  },
  {
    target: "[data-tutorial='animation-controls']",
    title: "Animation Controls",
    description: "Play to see the cipher in action step-by-step, pause to examine each letter, or reset to start over. Watch how each letter transforms!",
    position: "top",
  },
  {
    target: "[data-tutorial='visualization']",
    title: "Visual Wheel",
    description: "This interactive wheel shows how letters shift in the alphabet. The outer ring is the original alphabet, and the inner shows the shifted version.",
    position: "left",
    offset: { x: -20, y: 0 },
  },
];

function caesarEncrypt(text: string, shift: number): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      if (ALPHABET.includes(char)) {
        const index = ALPHABET.indexOf(char);
        return ALPHABET[(index + shift + 26) % 26];
      }
      return char;
    })
    .join("");
}

function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}

export default function CaesarCipher() {
  const [inputText, setInputText] = useState("HELLO");
  const [shift, setShift] = useState(3);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");

  const processText = mode === "encrypt" ? caesarEncrypt : caesarDecrypt;
  const effectiveShift = mode === "encrypt" ? shift : -shift;

  const startAnimation = () => {
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveIndex(0);
    setOutputText("");
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
  };

  useEffect(() => {
    if (!isAnimating || activeIndex < 0) return;

    if (activeIndex >= inputText.length) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      const char = inputText[activeIndex].toUpperCase();
      const processed = ALPHABET.includes(char)
        ? ALPHABET[(ALPHABET.indexOf(char) + effectiveShift + 26) % 26]
        : char;
      setOutputText((prev) => prev + processed);
      setActiveIndex((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [isAnimating, activeIndex, inputText, effectiveShift]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
  }, [inputText, shift, mode]);

  const currentInputLetter = activeIndex >= 0 && activeIndex < inputText.length 
    ? inputText[activeIndex].toUpperCase() 
    : undefined;
  
  const currentOutputLetter = currentInputLetter && ALPHABET.includes(currentInputLetter)
    ? ALPHABET[(ALPHABET.indexOf(currentInputLetter) + effectiveShift + 26) % 26]
    : undefined;

  const displayShift = mode === "encrypt" ? shift : (26 - shift) % 26;

  return (
    <CipherLayout
      title="Caesar Cipher"
      description="Classic substitution cipher that shifts letters by a fixed amount"
    >
      {/* Tutorial */}
      <TutorialTooltip
        steps={cipherTutorialSteps}
        storageKey="caesar-cipher"
        autoStart={true}
      />

      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left - Controls */}
          <div className="glass-card p-5 space-y-4">
            {/* Header with Mode Toggle and Info */}
            <div className="flex items-center justify-between">
              <div data-tutorial="mode-toggle">
                <ModeToggle mode={mode} onChange={setMode} />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    How It Works
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>How Caesar Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Visual Flow Diagram */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3 text-center">Encryption Process</h4>
                      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 font-mono">A</div>
                          <span className="text-[10px] text-muted-foreground">Input</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 font-mono">+3</div>
                          <span className="text-[10px] text-muted-foreground">Shift</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-primary/20 text-primary font-mono font-bold">D</div>
                          <span className="text-[10px] text-muted-foreground">Output</span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-primary mb-2">Encryption</h4>
                        <p className="text-muted-foreground text-xs">
                          Each letter is shifted forward by the key amount. 
                          Letters wrap around: Z + 1 = A
                        </p>
                        <div className="mt-2 font-mono text-xs text-foreground">
                          A → D, B → E, Z → C
                        </div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-secondary mb-2">Decryption</h4>
                        <p className="text-muted-foreground text-xs">
                          Each letter is shifted backward by the key amount.
                          Simply reverse the encryption process.
                        </p>
                        <div className="mt-2 font-mono text-xs text-foreground">
                          D → A, E → B, C → Z
                        </div>
                      </div>
                    </div>

                    {/* History Note */}
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                      <h4 className="text-sm font-medium text-primary mb-1">📜 Historical Note</h4>
                      <p className="text-sm text-muted-foreground">
                        Named after Julius Caesar, who used this cipher with a shift of 3 
                        to protect military messages. One of the earliest known encryption methods.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div data-tutorial="input-area">
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase().slice(0, 20))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
              />
            </div>

            <div data-tutorial="shift-control">
              <label className="block text-sm font-medium text-foreground mb-2">
                Shift Value
              </label>
              
              {/* Modern Shift Control - Compact */}
              <div className="flex items-center gap-2">
                {/* Decrement Button */}
                <button
                  onClick={() => setShift(prev => Math.max(1, prev - 1))}
                  disabled={shift <= 1}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200",
                    "border hover:scale-105 active:scale-95",
                    shift <= 1 
                      ? "border-muted/30 text-muted-foreground/30 cursor-not-allowed"
                      : "border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400"
                  )}
                >
                  −
                </button>
                
                {/* Shift Value Display */}
                <div className="flex-1 flex flex-col items-center py-1.5 px-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <span className="text-xl font-mono font-bold text-amber-400">
                    {shift}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {mode === "encrypt" ? `A→${ALPHABET[shift]}` : `${ALPHABET[shift]}→A`}
                  </span>
                </div>
                
                {/* Increment Button */}
                <button
                  onClick={() => setShift(prev => Math.min(25, prev + 1))}
                  disabled={shift >= 25}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200",
                    "border hover:scale-105 active:scale-95",
                    shift >= 25 
                      ? "border-muted/30 text-muted-foreground/30 cursor-not-allowed"
                      : "border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400"
                  )}
                >
                  +
                </button>
              </div>
            </div>

            <div data-tutorial="animation-controls" className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Output - shows in controls */}
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
                      const result = processText(inputText, shift);
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
                  ? (isAnimating ? outputText : processText(inputText, shift))
                  : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                }
              </div>
            </div>

            {/* Shift Info - Compact */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                {mode === "encrypt" ? (
                  <div className="flex gap-4 font-mono text-foreground">
                    <span>A → {ALPHABET[(0 + shift) % 26]}</span>
                    <span>B → {ALPHABET[(1 + shift) % 26]}</span>
                    <span>Z → {ALPHABET[(25 + shift) % 26]}</span>
                  </div>
                ) : (
                  <div className="flex gap-4 font-mono text-foreground">
                    <span>{ALPHABET[(0 + shift) % 26]} → A</span>
                    <span>{ALPHABET[(1 + shift) % 26]} → B</span>
                    <span>{ALPHABET[(25 + shift) % 26]} → Z</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right - Visualization */}
          <div data-tutorial="visualization" className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Process
            </h3>
            
            {/* Tape Visualization - Vigenère Style */}
            <div className="space-y-2 py-2">
              {/* Input Tape */}
              <div className="flex items-center gap-3">
                <div className="w-16 text-right text-xs text-blue-400 font-semibold uppercase tracking-wide shrink-0">
                  {mode === "encrypt" ? "Plain" : "Cipher"}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {inputText.split("").map((letter, i) => {
                    const isActive = i === activeIndex;
                    const isProcessed = hasAnimated && i < activeIndex;
                    return (
                      <div 
                        key={`input-${i}`} 
                        className={cn(
                          "w-10 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-blue-500/30 to-blue-500/10 border border-blue-500/40",
                          isActive && isAnimating && "ring-2 ring-blue-400 scale-105 shadow-lg shadow-blue-500/20",
                          isProcessed && "opacity-60"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-lg",
                          isActive && isAnimating ? "text-blue-300" : "text-blue-400"
                        )}>{letter.toUpperCase()}</span>
                        <span className="text-[8px] text-blue-400/60 font-mono">
                          {ALPHABET.includes(letter.toUpperCase()) ? ALPHABET.indexOf(letter.toUpperCase()) : "·"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operation Line */}
              <div className="flex items-center gap-3">
                <div className="w-16" />
                <div className="flex gap-0.5 flex-wrap">
                  {inputText.split("").map((_, i) => (
                    <div key={`op-${i}`} className="w-10 flex items-center justify-center">
                      <span className={cn(
                        "text-lg font-bold transition-all duration-300",
                        i === activeIndex && isAnimating 
                          ? "text-amber-400 scale-125" 
                          : hasAnimated && i < activeIndex
                            ? "text-amber-400/50"
                            : "text-muted-foreground/30"
                      )}>{mode === "encrypt" ? "+" : "−"}{shift}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equals Line */}
              <div className="flex items-center gap-3">
                <div className="w-16" />
                <div className="flex gap-0.5 flex-wrap">
                  {inputText.split("").map((_, i) => (
                    <div key={`eq-${i}`} className="w-10 flex items-center justify-center">
                      <div className={cn(
                        "w-5 h-0.5 transition-all duration-300",
                        hasAnimated 
                          ? (isAnimating ? (i < activeIndex ? "bg-primary" : "bg-muted-foreground/20") : (i <= activeIndex ? "bg-primary" : "bg-muted-foreground/20"))
                          : "bg-muted-foreground/20"
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Tape */}
              <div className="flex items-center gap-3">
                <div className="w-16 text-right text-xs text-primary font-semibold uppercase tracking-wide shrink-0">
                  {mode === "encrypt" ? "Cipher" : "Plain"}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {inputText.split("").map((_, i) => {
                    const isActive = i === activeIndex;
                    const outputChar = hasAnimated 
                      ? (isAnimating 
                          ? (i < activeIndex ? processText(inputText, shift)[i] : "") 
                          : processText(inputText, shift)[i])
                      : "";
                    const showOutput = hasAnimated && (isAnimating ? i < activeIndex : true);
                    
                    return (
                      <div 
                        key={`output-${i}`}
                        className={cn(
                          "w-10 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/40",
                          isActive && isAnimating && "ring-2 ring-primary scale-105 shadow-lg shadow-primary/20"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-lg",
                          isActive && isAnimating ? "text-primary/80" : "text-primary"
                        )}>{showOutput ? outputChar : ""}</span>
                        {showOutput && outputChar && ALPHABET.includes(outputChar) && (
                          <span className="text-[8px] text-primary/60 font-mono">
                            {ALPHABET.indexOf(outputChar)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Step Equation - Vigenère Style */}
            {hasAnimated && activeIndex >= 0 && activeIndex < inputText.length && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-amber-500/10 to-primary/10 border border-border/50">
                    <span className="text-xs text-muted-foreground">Step {activeIndex + 1}:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {currentInputLetter}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({currentInputLetter && ALPHABET.includes(currentInputLetter) ? ALPHABET.indexOf(currentInputLetter) : "·"})
                      </span>
                      <span className="text-amber-400 font-bold">{mode === "encrypt" ? "+" : "−"}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                        {shift}
                      </span>
                      <span className="text-primary">=</span>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                        {currentOutputLetter}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({currentOutputLetter && ALPHABET.includes(currentOutputLetter) ? ALPHABET.indexOf(currentOutputLetter) : "·"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Full Width Alphabet Mapping */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Alphabet Mapping</h3>
          <AlphabetWheel 
            shift={displayShift} 
            highlightedInput={currentInputLetter}
            highlightedOutput={currentOutputLetter}
          />
        </div>
      </div>
    </CipherLayout>
  );
}
