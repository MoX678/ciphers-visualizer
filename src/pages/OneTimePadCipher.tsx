import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Shuffle, Info, AlertTriangle, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateRandomKey(length: number): string {
  let key = "";
  for (let i = 0; i < length; i++) {
    key += ALPHABET[Math.floor(Math.random() * 26)];
  }
  return key;
}

function otpEncrypt(text: string, key: string): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const keyIndex = ALPHABET.indexOf(cleanKey[i] || "A");
      return ALPHABET[(textIndex + keyIndex) % 26];
    })
    .join("");
}

function otpDecrypt(text: string, key: string): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const keyIndex = ALPHABET.indexOf(cleanKey[i] || "A");
      return ALPHABET[(textIndex - keyIndex + 26) % 26];
    })
    .join("");
}

export default function OneTimePadCipher() {
  const [inputText, setInputText] = useState("HELLO");
  const [key, setKey] = useState("XMCKL");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");

  // Track used keys to prevent reuse
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [keyUsageWarning, setKeyUsageWarning] = useState<string>("");

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  const processText = mode === "encrypt" ? otpEncrypt : otpDecrypt;

  const isKeyValid = cleanKey.length >= cleanInput.length;

  const handleGenerateKey = () => {
    setKey(generateRandomKey(cleanInput.length || 10));
  };

  const handleInputChange = (newInput: string) => {
    const clean = newInput.toUpperCase().replace(/[^A-Z]/g, "");
    setInputText(clean);
    // Auto-extend key if needed
    if (clean.length > cleanKey.length) {
      setKey(cleanKey + generateRandomKey(clean.length - cleanKey.length));
    }
  };

  const startAnimation = () => {
    if (!isKeyValid) return;
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

    if (activeIndex >= cleanInput.length) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      const textChar = cleanInput[activeIndex];
      const keyChar = cleanKey[activeIndex];
      const textIndex = ALPHABET.indexOf(textChar);
      const keyIndex = ALPHABET.indexOf(keyChar);
      
      const resultIndex = mode === "encrypt"
        ? (textIndex + keyIndex) % 26
        : (textIndex - keyIndex + 26) % 26;
      
      setOutputText((prev) => prev + ALPHABET[resultIndex]);
      setActiveIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, activeIndex]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
  }, [inputText, key, mode]);

  const getCurrentCalculation = () => {
    if (activeIndex < 0 || activeIndex >= cleanInput.length) return null;
    if (!isAnimating && !hasAnimated) return null;
    
    const textChar = cleanInput[activeIndex];
    const keyChar = cleanKey[activeIndex];
    const textIndex = ALPHABET.indexOf(textChar);
    const keyIndex = ALPHABET.indexOf(keyChar);
    
    const resultIndex = mode === "encrypt"
      ? (textIndex + keyIndex) % 26
      : (textIndex - keyIndex + 26) % 26;
    
    return {
      textChar,
      keyChar,
      textIndex,
      keyIndex,
      resultIndex,
      result: ALPHABET[resultIndex],
      formula: mode === "encrypt"
        ? `(${textIndex} + ${keyIndex}) mod 26 = ${resultIndex}`
        : `(${textIndex} - ${keyIndex} + 26) mod 26 = ${resultIndex}`
    };
  };

  const calculation = getCurrentCalculation();

  return (
    <CipherLayout
      title="One-Time Pad"
      description="Theoretically unbreakable encryption with random key"
    >
      <div className="w-full space-y-4">
        {/* Security Warning Badge */}
 

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left - Controls */}
          <div className="glass-card p-5 space-y-4">
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between">
              <ModeToggle mode={mode} onChange={setMode} />
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    How It Works
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>How One-Time Pad Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Perfect Secrecy */}
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Perfect Secrecy
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        The One-Time Pad is the only cipher mathematically proven to be unbreakable 
                        when used correctly. This was proven by Claude Shannon in 1949.
                      </p>
                    </div>

                    {/* Requirements */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">📋 Requirements for Perfect Security</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">1</span>
                          <div>
                            <p className="text-xs text-foreground">Key is truly random</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">2</span>
                          <div>
                            <p className="text-xs text-foreground">Key ≥ Message length</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">3</span>
                          <div>
                            <p className="text-xs text-foreground">Key used only once</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs shrink-0">4</span>
                          <div>
                            <p className="text-xs text-foreground">Key kept secret</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">🔢 How It Works</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Encryption:</strong> Add each plaintext letter's position to the corresponding key letter's position (mod 26)
                        </p>
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Decryption:</strong> Subtract each key letter's position from the ciphertext letter's position (mod 26)
                        </p>
                        <div className="font-mono text-xs bg-background/50 p-2 rounded mt-2">
                          Encrypt: C[i] = (P[i] + K[i]) mod 26<br />
                          Decrypt: P[i] = (C[i] - K[i]) mod 26
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                      <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Critical Weakness
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        If the key is ever reused, the cipher can be broken. An attacker with two ciphertexts encrypted with the same key can XOR them to reveal both messages.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Input Fields */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext Message" : "Ciphertext Message"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground mt-1">{cleanInput.length} characters</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  One-Time Key (Random)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateKey}
                >
                  <Shuffle className="w-4 h-4 mr-1" /> Generate
                </Button>
              </div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className={`w-full bg-input border rounded-lg px-4 py-3 font-mono text-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  isKeyValid 
                    ? "border-green-500/50 text-green-400 focus:ring-green-500" 
                    : "border-red-500/50 text-red-400 focus:ring-red-500"
                }`}
                placeholder="Enter or generate key..."
                maxLength={30}
              />
              <p className={`text-xs mt-1 ${isKeyValid ? "text-green-400" : "text-red-400"}`}>
                {cleanKey.length} characters {!isKeyValid && `(need ${cleanInput.length - cleanKey.length} more)`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
                disabled={!isKeyValid}
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-blue-400" />
                  <span className="text-muted-foreground">Input</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-green-400" />
                  <span className="text-muted-foreground">Key</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-primary" />
                  <span className="text-muted-foreground">Result</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Visualization */}
          <div className="glass-card p-5 space-y-4">
            {isKeyValid ? (
              <>
                {/* Current Progress and Result */}
                {hasAnimated && !isAnimating && (
                  <div className="rounded-lg p-4 border-2 border-primary/50 bg-primary/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="text-sm font-semibold text-primary">
                          {mode === "encrypt" ? "Final Ciphertext" : "Final Plaintext"}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-6 text-xs px-2",
                          mode === "encrypt"
                            ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                            : "border-primary/50 text-primary hover:bg-primary/10"
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
                    </div>
                    <div className="font-mono text-lg font-bold text-primary break-all">
                      {hasAnimated 
                        ? (isAnimating ? outputText : processText(inputText, key))
                        : "Click Animate to see result"
                      }
                    </div>
                  </div>
                )}

                {/* Current State Output (During Animation) */}
                {!(hasAnimated && !isAnimating) && (
                  <div className={cn(
                    "rounded-lg p-3 border",
                    mode === "decrypt" 
                      ? "bg-muted/30 border-muted" 
                      : "bg-muted/30 border-muted"
                  )}>
                    <div className="text-xs text-muted-foreground mb-1">
                      {mode === "encrypt" ? "Current State" : "Current State"}
                    </div>
                    <div className="font-mono text-sm break-all min-h-[40px] flex items-center text-muted-foreground">
                      {hasAnimated && isAnimating 
                        ? outputText || "Processing..."
                        : "Click Animate to see transformation"}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {isAnimating && (
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span>{activeIndex} / {cleanInput.length} characters</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(activeIndex / cleanInput.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Visualization */}
                <div className="space-y-4">
                  {/* Key */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      One-Time Key
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        random • single use
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cleanKey.slice(0, cleanInput.length).split("").map((letter, i) => (
                        <LetterBox
                          key={`key-${i}`}
                          letter={letter}
                          variant="key"
                          isActive={i === activeIndex}
                          showIndex
                          index={ALPHABET.indexOf(letter)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Input letters */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cleanInput.split("").map((letter, i) => (
                        <LetterBox
                          key={`input-${i}`}
                          letter={letter}
                          variant="input"
                          isActive={i === activeIndex}
                          isHighlighted={i < activeIndex}
                          showIndex
                          index={ALPHABET.indexOf(letter)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Transformation Arrow */}
                  <div className="flex items-center justify-center py-2">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl text-green-400">↓</div>
                      <div className="font-mono text-sm text-center px-4 py-2 rounded bg-green-500/10 border border-green-500/30 text-green-400">
                        C = (P {mode === "encrypt" ? "+" : "-"} K) mod 26
                      </div>
                      <div className="text-3xl text-green-400">↓</div>
                    </div>
                  </div>

                  {/* Output letters */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {hasAnimated ? (
                        (isAnimating ? outputText : processText(inputText, key)).split("").map((letter, i) => (
                          <LetterBox
                            key={`output-${i}`}
                            letter={letter}
                            variant="output"
                            isHighlighted={i === activeIndex - 1}
                            showIndex
                            index={ALPHABET.indexOf(letter)}
                          />
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current calculation */}
                {calculation && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-400 mb-3">
                      Position {activeIndex + 1}: Modular Operation
                    </h4>
                    
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {/* Input Character */}
                      <div className="bg-blue-500/10 rounded p-2 text-center border border-blue-500/30">
                        <div className="text-blue-400 font-mono text-lg">{calculation.textChar}</div>
                        <div className="text-muted-foreground">Index: {calculation.textIndex}</div>
                      </div>

                      {/* Key Character */}
                      <div className="bg-green-500/10 rounded p-2 text-center border border-green-500/30">
                        <div className="text-green-400 font-mono text-lg">{calculation.keyChar}</div>
                        <div className="text-muted-foreground">Index: {calculation.keyIndex}</div>
                      </div>

                      {/* Operation */}
                      <div className="bg-muted/20 rounded p-2 text-center">
                        <div className="font-mono text-sm">
                          {mode === "encrypt" ? "+" : "-"}
                        </div>
                        <div className="text-muted-foreground">mod 26</div>
                      </div>

                      {/* Result */}
                      <div className="bg-primary/10 rounded p-2 text-center border border-primary/30">
                        <div className="text-primary font-mono text-lg">{calculation.result}</div>
                        <div className="text-muted-foreground">Index: {calculation.resultIndex}</div>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-background/50 rounded">
                      <div className="font-mono text-sm text-center">
                        ({calculation.textIndex} {mode === "encrypt" ? "+" : "-"} {calculation.keyIndex}) mod 26 = {calculation.resultIndex}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <p className="text-sm">Enter message and key to see encryption process</p>
                  <p className="text-xs">Perfect security through modular arithmetic</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
