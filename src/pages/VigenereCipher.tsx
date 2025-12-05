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
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Steps
            </h3>

            {/* Progress bar */}
            {hasAnimated && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>Letter {Math.min(activeIndex + 1, cleanInput.length)} / {cleanInput.length}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((Math.min(activeIndex + 1, cleanInput.length)) / cleanInput.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Input letters - clickable */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"} - Click to navigate
              </p>
              <div className="flex flex-wrap gap-1">
                {cleanInput.split("").map((letter, i) => {
                  const isActive = i === activeIndex;
                  const isProcessed = i <= activeIndex && activeIndex >= 0;
                  
                  return (
                    <button 
                      key={`input-${i}`} 
                      onClick={() => !isAnimating && goToStep(i)}
                      disabled={isAnimating}
                      className={cn(
                        "flex flex-col items-center cursor-pointer transition-all hover:bg-muted/30 rounded p-0.5",
                        "disabled:cursor-not-allowed",
                        isActive && "bg-primary/20 ring-1 ring-primary",
                        isProcessed && !isActive && "bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center font-mono text-base border transition-all",
                        isActive && "bg-blue-500/30 border-blue-500 text-blue-400 scale-105",
                        isProcessed && !isActive && "bg-muted/50 border-muted-foreground/50 text-muted-foreground",
                        !isProcessed && "border-border text-foreground"
                      )}>
                        {letter}
                      </div>
                      <div className="text-[9px] text-secondary">
                        {getKeyChar(i)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output letters - clickable */}
            {hasAnimated && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {outputText.split("").map((letter, i) => {
                    const isCurrentStep = i === activeIndex;
                    
                    return (
                      <button 
                        key={`output-${i}`}
                        onClick={() => goToStep(i)}
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center font-mono text-base border transition-all cursor-pointer",
                          "hover:bg-muted/30 text-green-400 border-green-500/50",
                          isCurrentStep && "bg-green-500/20 ring-1 ring-green-500 scale-105"
                        )}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step navigation buttons */}
            {hasAnimated && !isAnimating && (
              <div className="flex items-center justify-center gap-2">
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
                  {activeIndex + 1}/{cleanInput.length}
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

            {/* Current Step Detail - Integrated */}
            {calculation && (
              <div className="pt-3 border-t border-border space-y-3">
                <h4 className="text-sm font-semibold text-primary">
                  Step {activeIndex + 1}: Letter "{cleanInput[activeIndex]}" → "{calculation.result}" (Key: {getKeyChar(activeIndex)})
                </h4>
                
                {/* Compact 4-column grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Input Letter */}
                  <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/30">
                    <div className="text-xs text-muted-foreground mb-1">
                      {mode === "encrypt" ? "Plain" : "Cipher"}
                    </div>
                    <div className="w-12 h-12 mx-auto rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-2xl font-bold text-blue-400">
                      {cleanInput[activeIndex]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      idx: <span className="text-blue-400 font-mono">{ALPHABET.indexOf(cleanInput[activeIndex])}</span>
                    </div>
                  </div>

                  {/* Key Letter */}
                  <div className="bg-secondary/10 rounded-lg p-3 text-center border border-secondary/30">
                    <div className="text-xs text-muted-foreground mb-1">Key</div>
                    <div className="w-12 h-12 mx-auto rounded-lg bg-secondary/20 border-2 border-secondary flex items-center justify-center text-2xl font-bold text-secondary">
                      {getKeyChar(activeIndex)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      idx: <span className="text-secondary font-mono">{ALPHABET.indexOf(getKeyChar(activeIndex))}</span>
                    </div>
                  </div>

                  {/* Operation */}
                  <div className="bg-muted/20 rounded-lg p-3 text-center flex flex-col justify-center">
                    <div className="font-mono text-xs text-foreground">
                      ({ALPHABET.indexOf(cleanInput[activeIndex])} {calculation.operation} {ALPHABET.indexOf(getKeyChar(activeIndex))})
                    </div>
                    <div className="text-xl text-primary my-1">=</div>
                    <div className="font-mono text-xl text-primary">
                      {ALPHABET.indexOf(calculation.result)}
                    </div>
                  </div>

                  {/* Result Letter */}
                  <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
                    <div className="text-xs text-muted-foreground mb-1">
                      {mode === "encrypt" ? "Cipher" : "Plain"}
                    </div>
                    <div className="w-12 h-12 mx-auto rounded-lg bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-2xl font-bold text-green-400">
                      {calculation.result}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      idx: <span className="text-green-400 font-mono">{ALPHABET.indexOf(calculation.result)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Full Width Tabula Recta hint */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Vigenère Table (Tabula Recta)</h3>
          <div className="overflow-x-auto">
            <div className="flex gap-1 text-xs font-mono">
              <div className="w-6 h-6 flex items-center justify-center text-muted-foreground">+</div>
              {ALPHABET.split("").map((letter) => (
                <div 
                  key={letter} 
                  className={`w-6 h-6 flex items-center justify-center ${
                    letter === cleanInput[activeIndex] ? "bg-primary/30 text-primary rounded" : "text-muted-foreground"
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            {ALPHABET.split("").slice(0, 5).map((rowLetter, rowIndex) => (
              <div key={rowLetter} className="flex gap-1 text-xs font-mono">
                <div className={`w-6 h-6 flex items-center justify-center ${
                  rowLetter === getKeyChar(activeIndex) ? "bg-secondary/30 text-secondary rounded" : "text-muted-foreground"
                }`}>
                  {rowLetter}
                </div>
                {ALPHABET.split("").map((_, colIndex) => {
                  const shifted = ALPHABET[(colIndex + rowIndex) % 26];
                  const isHighlighted = rowLetter === getKeyChar(activeIndex) && ALPHABET[colIndex] === cleanInput[activeIndex];
                  return (
                    <div 
                      key={colIndex} 
                      className={`w-6 h-6 flex items-center justify-center ${
                        isHighlighted ? "bg-primary text-primary-foreground rounded font-bold" : "text-foreground/50"
                      }`}
                    >
                      {shifted}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="text-xs text-muted-foreground mt-2">... (showing first 5 rows)</div>
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
