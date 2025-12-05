import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
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

  const getCurrentMapping = () => {
    if (activeIndex < 0 || activeIndex >= cleanInput.length) return null;
    // Show mapping during animation or after animation completes (for persistence)
    if (!isAnimating && !hasAnimated) return null;
    
    const inputChar = cleanInput[activeIndex];
    
    if (mode === "encrypt") {
      const plainIndex = ALPHABET.indexOf(inputChar);
      return {
        from: inputChar,
        fromIndex: plainIndex,
        to: key[plainIndex],
        toIndex: key.indexOf(key[plainIndex])
      };
    } else {
      const cipherIndex = key.indexOf(inputChar);
      return {
        from: inputChar,
        fromIndex: key.indexOf(inputChar),
        to: ALPHABET[cipherIndex],
        toIndex: cipherIndex
      };
    }
  };

  const currentMapping = getCurrentMapping();

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

            {/* Current mapping indicator */}
            {currentMapping && isAnimating && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-4 font-mono text-lg">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">
                      {mode === "encrypt" ? "Plain" : "Cipher"}
                    </span>
                    <span className="text-foreground bg-muted px-3 py-1.5 rounded">
                      {currentMapping.from}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      idx: {currentMapping.fromIndex}
                    </span>
                  </div>
                  <span className="text-primary text-2xl">→</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">
                      {mode === "encrypt" ? "Cipher" : "Plain"}
                    </span>
                    <span className="text-primary bg-primary/20 px-3 py-1.5 rounded">
                      {currentMapping.to}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      idx: {currentMapping.toIndex}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right - Step-by-Step Visualization */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Steps
            </h3>
            
            {/* Input letters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cleanInput.split("").map((letter, i) => (
                  <LetterBox
                    key={`input-${i}`}
                    letter={letter}
                    variant="input"
                    isActive={i === activeIndex}
                    isHighlighted={i < activeIndex}
                    showIndex
                    index={mode === "encrypt" ? ALPHABET.indexOf(letter) : key.indexOf(letter)}
                  />
                ))}
              </div>
            </div>

            {/* Transformation indicator */}
            <div className="flex items-center justify-center py-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary">↓</span>
                <span>Substitution Table</span>
                <span className="text-primary">↓</span>
              </div>
            </div>

            {/* Output letters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {hasAnimated ? (
                  (isAnimating ? outputText : (isValidKey ? processText(inputText, key) : "")).split("").map((letter, i) => (
                    <LetterBox
                      key={`output-${i}`}
                      letter={letter}
                      variant="output"
                      isHighlighted={i === activeIndex - 1}
                      showIndex
                      index={mode === "encrypt" ? key.indexOf(letter) : ALPHABET.indexOf(letter)}
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Substitution Table - Full Width */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Substitution Table</h3>
          
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Plain alphabet */}
              <div className="flex gap-0.5 mb-0.5">
                <div className="w-12 text-xs text-muted-foreground flex items-center">Plain:</div>
                {ALPHABET.split("").map((letter, i) => {
                  const isActive = currentMapping && 
                    ((mode === "encrypt" && letter === currentMapping.from) ||
                     (mode === "decrypt" && letter === currentMapping.to));
                  return (
                    <div
                      key={`plain-${i}`}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center font-mono text-xs rounded transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                          : "bg-muted text-foreground"
                      )}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
              
              {/* Arrow indicators */}
              <div className="flex gap-0.5 mb-0.5">
                <div className="w-12"></div>
                {ALPHABET.split("").map((_, i) => (
                  <div key={`arrow-${i}`} className="w-7 h-3 flex items-center justify-center text-muted-foreground text-[10px]">
                    ↓
                  </div>
                ))}
              </div>
              
              {/* Cipher alphabet */}
              <div className="flex gap-0.5">
                <div className="w-12 text-xs text-muted-foreground flex items-center">Cipher:</div>
                {key.split("").map((letter, i) => {
                  const isActive = currentMapping && 
                    ((mode === "encrypt" && letter === currentMapping.to) ||
                     (mode === "decrypt" && letter === currentMapping.from));
                  return (
                    <div
                      key={`cipher-${i}`}
                      className={cn(
                        "w-7 h-7 flex items-center justify-center font-mono text-xs rounded transition-all",
                        isActive 
                          ? "bg-secondary text-secondary-foreground ring-2 ring-secondary" 
                          : "bg-secondary/20 text-secondary"
                      )}
                    >
                      {letter || "?"}
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
