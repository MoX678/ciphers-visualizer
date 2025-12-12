import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Shuffle, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateRandomKey(): string {
  const letters = ALPHABET.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join("");
}

function monoEncrypt(text: string, key: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      const index = ALPHABET.indexOf(char);
      if (index !== -1) {
        return key[index];
      }
      return char;
    })
    .join("");
}

function monoDecrypt(text: string, key: string): string {
  return text
    .toUpperCase()
    .split("")
    .map((char) => {
      const index = key.indexOf(char);
      if (index !== -1) {
        return ALPHABET[index];
      }
      return char;
    })
    .join("");
}

export default function MonoalphabeticCipher() {
  const [inputText, setInputText] = useState("HELLO");
  const [key, setKey] = useState("QWERTYUIOPASDFGHJKLZXCVBNM");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const processText = mode === "encrypt" ? monoEncrypt : monoDecrypt;

  const isValidKey = key.length === 26 && new Set(key.toUpperCase()).size === 26;

  const startAnimation = () => {
    if (!isValidKey) return;
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

  const shuffleKey = () => {
    setKey(generateRandomKey());
  };

  useEffect(() => {
    if (!isAnimating || activeIndex < 0) return;

    if (activeIndex >= cleanInput.length) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      const char = cleanInput[activeIndex];
      let processed: string;
      
      if (mode === "encrypt") {
        const index = ALPHABET.indexOf(char);
        processed = key[index];
      } else {
        const index = key.indexOf(char);
        processed = ALPHABET[index];
      }
      
      setOutputText((prev) => prev + processed);
      setActiveIndex((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, activeIndex]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
  }, [inputText, key, mode]);

  return (
    <CipherLayout
      title="Monoalphabetic Cipher"
      description="Simple substitution cipher with a fixed letter mapping"
    >
      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Visualization */}
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
                    <DialogTitle>How Monoalphabetic Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2">
                          {mode === "encrypt" ? "📝 Encryption" : "🔓 Decryption"}
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li>Find letter's position in {mode === "encrypt" ? "standard alphabet" : "cipher key"}</li>
                          <li>Look up letter at that position in {mode === "encrypt" ? "cipher key" : "standard alphabet"}</li>
                          <li>Use that letter as the result</li>
                        </ol>
                        <p className="mt-2 text-foreground font-mono text-[10px]">
                          Example: A → {key[0]}, B → {key[1]}, C → {key[2]}
                        </p>
                      </div>
                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                        <h4 className="font-medium text-yellow-500 mb-2">⚠️ Security Note</h4>
                        <p className="text-muted-foreground">
                          While there are 26! (≈ 4×10²⁶) possible keys, monoalphabetic ciphers are easily broken 
                          using <span className="text-foreground">frequency analysis</span> (E, T, A are most common in English).
                        </p>
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
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 20))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Substitution Key
                </label>
                <Button onClick={shuffleKey} variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <Shuffle className="w-3 h-3" />
                  Random
                </Button>
              </div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 26))}
                className={cn(
                  "w-full bg-input border rounded-lg px-4 py-3 font-mono text-sm text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary",
                  isValidKey ? "border-border" : "border-red-500"
                )}
                placeholder="Enter 26 unique letters..."
                maxLength={26}
              />
              {!isValidKey && key.length > 0 && (
                <p className="text-xs text-red-500 mt-1">Need all 26 letters exactly once</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
                disabled={!isValidKey}
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Output - shows in controls */}
            {isValidKey && (
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
                        const result = processText(inputText, key);
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
                    ? (isAnimating ? outputText : processText(inputText, key))
                    : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                  }
                </div>
              </div>
            )}
          </div>

          {/* Right - Combined Visualization with Substitution Table */}
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {mode === "encrypt" ? "Encryption" : "Decryption"} Visualization
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="text-muted-foreground">Input</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Key</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">Output</span>
                </div>
              </div>
            </div>

            {/* Input → Output Transformation - Tape Style */}
            <div className="space-y-2 py-2">
              {/* Input Tape */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20 text-right text-xs text-blue-400 font-semibold uppercase tracking-wide">
                  {mode === "encrypt" ? "Plain" : "Cipher"}
                </div>
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((letter, i) => {
                    const idx = mode === "encrypt" ? ALPHABET.indexOf(letter) : key.indexOf(letter);
                    return (
                      <div
                        key={`input-${i}`}
                        className={cn(
                          "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-blue-500/30 to-blue-500/10 border border-blue-500/40",
                          i === activeIndex && isAnimating && "ring-2 ring-blue-400 scale-105 shadow-lg shadow-blue-500/20"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-xl",
                          i === activeIndex && isAnimating ? "text-blue-300" : "text-blue-400"
                        )}>{letter}</span>
                        <span className="text-[9px] text-blue-400/60 font-mono">{idx}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Substitution Line */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20" />
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((_, i) => (
                    <div key={`sub-${i}`} className="w-11 flex items-center justify-center">
                      <div className={cn(
                        "flex flex-col items-center transition-all duration-300",
                        i === activeIndex && isAnimating 
                          ? "text-primary scale-110" 
                          : hasAnimated && i < activeIndex
                            ? "text-primary/50"
                            : "text-muted-foreground/20"
                      )}>
                        <div className={cn(
                          "w-0.5 h-2 rounded-full",
                          i === activeIndex && isAnimating 
                            ? "bg-primary" 
                            : hasAnimated && i < activeIndex
                              ? "bg-primary/50"
                              : "bg-muted-foreground/20"
                        )}></div>
                        <ChevronRight className={cn(
                          "w-4 h-4 rotate-90 -mt-0.5",
                          i === activeIndex && isAnimating && "animate-bounce"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Tape */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20 text-right text-xs text-primary font-semibold uppercase tracking-wide">
                  {mode === "encrypt" ? "Cipher" : "Plain"}
                </div>
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((inputLetter, i) => {
                    const fullResult = isValidKey ? processText(inputText, key) : "";
                    const outputLetter = hasAnimated 
                      ? (isAnimating ? outputText[i] : fullResult[i])
                      : undefined;
                    const showOutput = hasAnimated && (isAnimating ? i < activeIndex : true);
                    const idx = outputLetter ? (mode === "encrypt" ? key.indexOf(outputLetter) : ALPHABET.indexOf(outputLetter)) : null;
                    return (
                      <div
                        key={`output-${i}`}
                        className={cn(
                          "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          showOutput && outputLetter
                            ? "bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/40"
                            : "bg-muted/30 border border-border/50",
                          i === activeIndex - 1 && isAnimating && "ring-2 ring-primary scale-105 shadow-lg shadow-primary/20"
                        )}
                      >
                        {showOutput && outputLetter ? (
                          <>
                            <span className="font-mono font-bold text-xl text-primary">{outputLetter}</span>
                            <span className="text-[9px] text-primary/60 font-mono">{idx}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/40 text-lg">?</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Step Equation */}
            {isAnimating && activeIndex >= 0 && activeIndex < cleanInput.length && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-green-500/10 to-primary/10 border border-border/50">
                    <span className="text-xs text-muted-foreground">Step {activeIndex + 1}:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {cleanInput[activeIndex]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        (idx {mode === "encrypt" ? ALPHABET.indexOf(cleanInput[activeIndex]) : key.indexOf(cleanInput[activeIndex])})
                      </span>
                      <span className="text-primary">→</span>
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                        {mode === "encrypt" 
                          ? key[ALPHABET.indexOf(cleanInput[activeIndex])]
                          : ALPHABET[key.indexOf(cleanInput[activeIndex])]
                        }
                      </span>
                      <span className="text-muted-foreground text-xs">
                        (idx {mode === "encrypt" 
                          ? key.indexOf(key[ALPHABET.indexOf(cleanInput[activeIndex])])
                          : key.indexOf(cleanInput[activeIndex])
                        })
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Substitution Table - Full Width Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Substitution Table</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Plain</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Cipher</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            <div className="min-w-max space-y-1 p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
              {/* Plain alphabet row */}
              <div className="flex items-center gap-1">
                <div className="w-14 text-[10px] text-blue-400 font-semibold uppercase tracking-wide text-right pr-2">
                  Plain
                </div>
                {ALPHABET.split("").map((letter, i) => {
                  const isInputLetter = cleanInput.includes(letter);
                  const isCurrentInput = isAnimating && activeIndex >= 0 && 
                    ((mode === "encrypt" && letter === cleanInput[activeIndex]) ||
                     (mode === "decrypt" && ALPHABET[key.indexOf(cleanInput[activeIndex])] === letter));
                  const wasProcessed = hasAnimated && !isAnimating && cleanInput.includes(letter);
                  return (
                    <div
                      key={`plain-${i}`}
                      className={cn(
                        "w-8 h-9 flex flex-col items-center justify-center font-mono rounded-lg transition-all duration-300 relative",
                        isCurrentInput 
                          ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white ring-2 ring-blue-400 scale-110 shadow-lg shadow-blue-500/30 z-10" 
                          : isInputLetter
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-muted/40 text-muted-foreground border border-border/30",
                        wasProcessed && "ring-1 ring-blue-500/50"
                      )}
                    >
                      <span className="text-sm font-bold">{letter}</span>
                      <span className="text-[8px] opacity-60">{i}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Connection lines / arrows */}
              <div className="flex items-center gap-1">
                <div className="w-14"></div>
                {ALPHABET.split("").map((_, i) => {
                  const plainLetter = ALPHABET[i];
                  const isCurrentMapping = isAnimating && activeIndex >= 0 && 
                    ((mode === "encrypt" && plainLetter === cleanInput[activeIndex]) ||
                     (mode === "decrypt" && key[i] === cleanInput[activeIndex]));
                  return (
                    <div key={`conn-${i}`} className="w-8 h-5 flex items-center justify-center">
                      <div className={cn(
                        "flex flex-col items-center transition-all duration-300",
                        isCurrentMapping ? "text-primary scale-110" : "text-muted-foreground/30"
                      )}>
                        <div className={cn(
                          "w-0.5 h-2 rounded-full transition-colors",
                          isCurrentMapping ? "bg-primary" : "bg-muted-foreground/20"
                        )}></div>
                        <ChevronRight className={cn(
                          "w-3 h-3 rotate-90 -mt-0.5 transition-colors",
                          isCurrentMapping ? "text-primary" : "text-muted-foreground/30"
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Cipher alphabet row */}
              <div className="flex items-center gap-1">
                <div className="w-14 text-[10px] text-green-400 font-semibold uppercase tracking-wide text-right pr-2">
                  Cipher
                </div>
                {key.split("").map((letter, i) => {
                  const isOutputLetter = mode === "encrypt" 
                    ? cleanInput.split("").some(c => key[ALPHABET.indexOf(c)] === letter)
                    : cleanInput.includes(letter);
                  const isCurrentOutput = isAnimating && activeIndex >= 0 && 
                    ((mode === "encrypt" && letter === key[ALPHABET.indexOf(cleanInput[activeIndex])]) ||
                     (mode === "decrypt" && letter === cleanInput[activeIndex]));
                  const wasProcessed = hasAnimated && !isAnimating && (
                    mode === "encrypt" 
                      ? cleanInput.split("").some(c => key[ALPHABET.indexOf(c)] === letter)
                      : cleanInput.includes(letter)
                  );
                  return (
                    <div
                      key={`cipher-${i}`}
                      className={cn(
                        "w-8 h-9 flex flex-col items-center justify-center font-mono rounded-lg transition-all duration-300 relative",
                        isCurrentOutput 
                          ? "bg-gradient-to-b from-green-500 to-green-600 text-white ring-2 ring-green-400 scale-110 shadow-lg shadow-green-500/30 z-10" 
                          : isOutputLetter
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-muted/40 text-muted-foreground border border-border/30",
                        wasProcessed && "ring-1 ring-green-500/50"
                      )}
                    >
                      <span className="text-sm font-bold">{letter || "?"}</span>
                      <span className="text-[8px] opacity-60">{i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
