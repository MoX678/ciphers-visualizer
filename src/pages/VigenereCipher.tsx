import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Info, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function vigenereEncrypt(text: string, key: string): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  
  if (!cleanKey) return cleanText;
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const keyIndex = ALPHABET.indexOf(cleanKey[i % cleanKey.length]);
      return ALPHABET[(textIndex + keyIndex) % 26];
    })
    .join("");
}

function vigenereDecrypt(text: string, key: string): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  
  if (!cleanKey) return cleanText;
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const keyIndex = ALPHABET.indexOf(cleanKey[i % cleanKey.length]);
      return ALPHABET[(textIndex - keyIndex + 26) % 26];
    })
    .join("");
}

export default function VigenereCipher() {
  const [inputText, setInputText] = useState("ATTACKATDAWN");
  const [key, setKey] = useState("LEMON");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  const processText = mode === "encrypt" ? vigenereEncrypt : vigenereDecrypt;

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

  // Navigate to a specific step
  const goToStep = (step: number) => {
    if (step < 0 || step >= cleanInput.length) return;
    setIsAnimating(false);
    setActiveIndex(step);
    
    // Calculate output up to this step (inclusive)
    let output = "";
    for (let i = 0; i <= step; i++) {
      const textChar = cleanInput[i];
      const keyChar = cleanKey[i % cleanKey.length];
      const textIndex = ALPHABET.indexOf(textChar);
      const keyIndex = ALPHABET.indexOf(keyChar);
      
      const encrypted = mode === "encrypt"
        ? ALPHABET[(textIndex + keyIndex) % 26]
        : ALPHABET[(textIndex - keyIndex + 26) % 26];
      
      output += encrypted;
    }
    
    setOutputText(output);
    setHasAnimated(true);
  };

  const goToPrevStep = () => {
    if (activeIndex > 0) {
      goToStep(activeIndex - 1);
    }
  };

  const goToNextStep = () => {
    if (activeIndex < cleanInput.length - 1) {
      goToStep(activeIndex + 1);
    }
  };

  useEffect(() => {
    if (!isAnimating || activeIndex < 0) return;

    if (activeIndex >= cleanInput.length) {
      setIsAnimating(false);
      // Keep the last step visible
      if (cleanInput.length > 0) {
        setActiveIndex(cleanInput.length - 1);
      }
      return;
    }

    const timer = setTimeout(() => {
      const textChar = cleanInput[activeIndex];
      const keyChar = cleanKey[activeIndex % cleanKey.length];
      const textIndex = ALPHABET.indexOf(textChar);
      const keyIndex = ALPHABET.indexOf(keyChar);
      
      const encrypted = mode === "encrypt"
        ? ALPHABET[(textIndex + keyIndex) % 26]
        : ALPHABET[(textIndex - keyIndex + 26) % 26];
      
      setOutputText((prev) => prev + encrypted);
      setActiveIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [isAnimating, activeIndex, cleanInput, cleanKey, mode]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
  }, [inputText, key, mode]);

  const getKeyChar = (index: number) => {
    if (!cleanKey) return "";
    return cleanKey[index % cleanKey.length];
  };

  const getCurrentCalculation = () => {
    if (activeIndex < 0 || activeIndex >= cleanInput.length) return null;
    if (!isAnimating && !hasAnimated) return null;
    
    const textChar = cleanInput[activeIndex];
    const keyChar = getKeyChar(activeIndex);
    const textIndex = ALPHABET.indexOf(textChar);
    const keyIndex = ALPHABET.indexOf(keyChar);
    
    if (mode === "encrypt") {
      const result = (textIndex + keyIndex) % 26;
      return {
        formula: `(${textIndex} + ${keyIndex}) mod 26 = ${result}`,
        result: ALPHABET[result],
        operation: "+"
      };
    } else {
      const result = (textIndex - keyIndex + 26) % 26;
      return {
        formula: `(${textIndex} - ${keyIndex} + 26) mod 26 = ${result}`,
        result: ALPHABET[result],
        operation: "-"
      };
    }
  };

  const calculation = getCurrentCalculation();

  return (
    <CipherLayout
      title="Vigenère Cipher"
      description="Polyalphabetic cipher using a keyword for shifting"
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
                    <DialogTitle>How Vigenère Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Visual Flow Diagram */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3 text-center">Encryption Process</h4>
                      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 font-mono">A (0)</div>
                          <span className="text-[10px] text-muted-foreground">Plaintext</span>
                        </div>
                        <span className="text-muted-foreground">+</span>
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-secondary/20 text-secondary font-mono">L (11)</div>
                          <span className="text-[10px] text-muted-foreground">Key</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 font-mono">mod 26</div>
                          <span className="text-[10px] text-muted-foreground">Wrap</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-primary/20 text-primary font-mono font-bold">L (11)</div>
                          <span className="text-[10px] text-muted-foreground">Output</span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-primary mb-2">Encryption</h4>
                        <p className="text-muted-foreground text-xs mb-2">
                          Each plaintext letter is shifted by its corresponding key letter value.
                        </p>
                        <p className="font-mono text-xs text-foreground">(P + K) mod 26 = C</p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-secondary mb-2">Decryption</h4>
                        <p className="text-muted-foreground text-xs mb-2">
                          Reverse: subtract the key letter value from ciphertext.
                        </p>
                        <p className="font-mono text-xs text-foreground">(C - K + 26) mod 26 = P</p>
                      </div>
                    </div>

                    {/* Key repeating note */}
                    <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                      <h4 className="text-sm font-medium text-secondary mb-1">🔑 Key Repeating</h4>
                      <p className="text-sm text-muted-foreground">
                        The keyword repeats to match the message length. "LEMON" becomes "LEMONLEMONLE..." 
                        for longer messages.
                      </p>
                    </div>

                    {/* History note */}
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                      <h4 className="text-sm font-medium text-primary mb-1">📜 Historical Note</h4>
                      <p className="text-sm text-muted-foreground">
                        Named after Blaise de Vigenère (16th century). Called "le chiffre indéchiffrable" 
                        (the undecipherable cipher) for 300 years until broken in the 1800s.
                      </p>
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Keyword
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10))}
                className="w-full bg-input border border-secondary rounded-lg px-4 py-3 font-mono text-lg text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter keyword..."
              />
            </div>

            <div className="flex gap-2">
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

            {/* Output - shows always with placeholder */}
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
                  ? outputText || processText(inputText, key)
                  : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                }
              </div>
            </div>

            {/* Formula - Compact */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground font-mono text-center">
                {mode === "encrypt" 
                  ? "(Plaintext + Key) mod 26 = Ciphertext"
                  : "(Ciphertext - Key + 26) mod 26 = Plaintext"}
              </div>
            </div>
          </div>

          {/* Right - Visualization + Steps */}
          <div className="glass-card p-5 space-y-4">
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

            {/* Progress bar */}
            {hasAnimated && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>Letter {Math.min(activeIndex + 1, cleanInput.length)} / {cleanInput.length}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((Math.min(activeIndex + 1, cleanInput.length)) / cleanInput.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tape Visualization */}
            <div className="space-y-2 py-2">
              {/* Input Tape */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20 text-right text-xs text-blue-400 font-semibold uppercase tracking-wide">
                  {mode === "encrypt" ? "Plain" : "Cipher"}
                </div>
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((letter, i) => {
                    const isActive = i === activeIndex;
                    return (
                      <button 
                        key={`input-${i}`} 
                        onClick={() => !isAnimating && goToStep(i)}
                        disabled={isAnimating}
                        className={cn(
                          "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-blue-500/30 to-blue-500/10 border border-blue-500/40",
                          "hover:from-blue-500/40 hover:to-blue-500/20 cursor-pointer disabled:cursor-default",
                          isActive && isAnimating && "ring-2 ring-blue-400 scale-105 shadow-lg shadow-blue-500/20"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-xl",
                          isActive && isAnimating ? "text-blue-300" : "text-blue-400"
                        )}>{letter}</span>
                        <span className="text-[9px] text-blue-400/60 font-mono">{ALPHABET.indexOf(letter)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operation Line */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20" />
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((_, i) => (
                    <div key={`op-${i}`} className="w-11 flex items-center justify-center">
                      <span className={cn(
                        "text-xl font-bold transition-all duration-300",
                        i === activeIndex && isAnimating 
                          ? "text-green-400 scale-150" 
                          : hasAnimated && i <= activeIndex
                            ? "text-green-400/50"
                            : "text-muted-foreground/30"
                      )}>{mode === "encrypt" ? "+" : "−"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Tape */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20 text-right text-xs text-green-400 font-semibold uppercase tracking-wide">
                  Key
                </div>
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((_, i) => {
                    const keyChar = getKeyChar(i);
                    const isActive = i === activeIndex;
                    return (
                      <div 
                        key={`key-${i}`}
                        className={cn(
                          "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-green-500/30 to-green-500/10 border border-green-500/40",
                          isActive && isAnimating && "ring-2 ring-green-400 scale-105 shadow-lg shadow-green-500/20"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-xl",
                          isActive && isAnimating ? "text-green-300" : "text-green-400"
                        )}>{keyChar}</span>
                        <span className="text-[9px] text-green-400/60 font-mono">{ALPHABET.indexOf(keyChar)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equals Line */}
              <div className="flex items-center justify-center gap-3">
                <div className="w-20" />
                <div className="flex gap-0.5">
                  {cleanInput.split("").map((_, i) => (
                    <div key={`eq-${i}`} className="w-11 flex items-center justify-center">
                      <div className={cn(
                        "w-6 h-0.5 transition-all duration-300",
                        hasAnimated 
                          ? (isAnimating ? (i < activeIndex ? "bg-primary" : "bg-muted-foreground/20") : (i <= activeIndex ? "bg-primary" : "bg-muted-foreground/20"))
                          : "bg-muted-foreground/20"
                      )} />
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
                  {cleanInput.split("").map((_, i) => {
                    const fullResult = processText(inputText, key);
                    const outputLetter = hasAnimated 
                      ? (isAnimating ? outputText[i] : fullResult[i])
                      : undefined;
                    const showOutput = hasAnimated && (isAnimating ? i < activeIndex : i <= activeIndex);
                    return (
                      <button 
                        key={`output-${i}`}
                        onClick={() => !isAnimating && outputLetter && goToStep(i)}
                        disabled={isAnimating || !outputLetter}
                        className={cn(
                          "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          showOutput && outputLetter
                            ? "bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/40 cursor-pointer hover:from-primary/40 hover:to-primary/20"
                            : "bg-muted/30 border border-border/50",
                          i === activeIndex - 1 && isAnimating && "ring-2 ring-primary scale-105 shadow-lg shadow-primary/20"
                        )}
                      >
                        {showOutput && outputLetter ? (
                          <>
                            <span className="font-mono font-bold text-xl text-primary">{outputLetter}</span>
                            <span className="text-[9px] text-primary/60 font-mono">{ALPHABET.indexOf(outputLetter)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/40 text-lg">?</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step navigation buttons */}
            {hasAnimated && !isAnimating && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
                <Button
                  onClick={goToPrevStep}
                  disabled={activeIndex <= 0}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-3 h-3 mr-0.5" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Step {activeIndex + 1} of {cleanInput.length}
                </span>
                <Button
                  onClick={goToNextStep}
                  disabled={activeIndex >= cleanInput.length - 1}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            )}

            {/* Current Step Equation */}
            {calculation && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-green-500/10 to-primary/10 border border-border/50">
                    <span className="text-xs text-muted-foreground">Step {activeIndex + 1}:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {cleanInput[activeIndex]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({ALPHABET.indexOf(cleanInput[activeIndex])})
                      </span>
                      <span className="text-green-400 font-bold">{calculation.operation}</span>
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                        {getKeyChar(activeIndex)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({ALPHABET.indexOf(getKeyChar(activeIndex))})
                      </span>
                      <span className="text-primary">=</span>
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                        {calculation.result}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        ({ALPHABET.indexOf(calculation.result)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Full Vigenère Table (Tabula Recta) */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vigenère Table (Tabula Recta)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Find intersection of {mode === "encrypt" ? "plaintext column" : "ciphertext"} and key row
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500"></div>
                <span className="text-muted-foreground">{mode === "encrypt" ? "Plain" : "Cipher"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500"></div>
                <span className="text-muted-foreground">Key</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded bg-primary border border-primary"></div>
                <span className="text-muted-foreground">Result</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
            <div className="min-w-max p-3 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
              {/* Header Row - Plaintext letters */}
              <div className="flex gap-0.5">
                <div className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground font-semibold">
                  +
                </div>
                {ALPHABET.split("").map((letter, i) => {
                  const isActive = hasAnimated && letter === cleanInput[activeIndex];
                  return (
                    <div 
                      key={`header-${letter}`} 
                      className={cn(
                        "w-8 h-8 flex items-center justify-center font-mono text-xs rounded transition-all duration-200",
                        isActive 
                          ? "bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 scale-110 z-10" 
                          : "text-blue-400 bg-blue-500/10"
                      )}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>

              {/* Table Body - Each row is a key letter shift */}
              {ALPHABET.split("").map((rowLetter, rowIndex) => {
                const isKeyRow = hasAnimated && rowLetter === getKeyChar(activeIndex);
                return (
                  <div key={`row-${rowLetter}`} className="flex gap-0.5 mt-0.5">
                    {/* Row Header - Key letter */}
                    <div 
                      className={cn(
                        "w-8 h-8 flex items-center justify-center font-mono text-xs rounded transition-all duration-200",
                        isKeyRow 
                          ? "bg-green-500 text-white font-bold shadow-lg shadow-green-500/30 scale-110 z-10" 
                          : "text-green-400 bg-green-500/10"
                      )}
                    >
                      {rowLetter}
                    </div>
                    
                    {/* Row Cells */}
                    {ALPHABET.split("").map((_, colIndex) => {
                      const shifted = ALPHABET[(colIndex + rowIndex) % 26];
                      const plainChar = hasAnimated ? cleanInput[activeIndex] : null;
                      const keyChar = hasAnimated ? getKeyChar(activeIndex) : null;
                      
                      const isIntersection = plainChar && keyChar && 
                        rowLetter === keyChar && ALPHABET[colIndex] === plainChar;
                      const isInActiveRow = isKeyRow;
                      const isInActiveCol = hasAnimated && ALPHABET[colIndex] === plainChar;
                      
                      return (
                        <div 
                          key={`cell-${rowIndex}-${colIndex}`} 
                          className={cn(
                            "w-8 h-8 flex items-center justify-center font-mono text-xs rounded transition-all duration-200",
                            isIntersection 
                              ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary shadow-lg shadow-primary/40 scale-110 z-20" 
                              : isInActiveRow && isInActiveCol
                                ? "bg-primary/30 text-primary"
                                : isInActiveRow
                                  ? "bg-green-500/20 text-green-300"
                                  : isInActiveCol
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "text-foreground/40 hover:bg-muted/50 hover:text-foreground/70"
                          )}
                        >
                          {shifted}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
