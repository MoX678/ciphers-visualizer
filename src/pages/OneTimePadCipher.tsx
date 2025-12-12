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

  // Track used keys to prevent reuse - store with mode
  const [usedKeys, setUsedKeys] = useState<Map<string, Set<"encrypt" | "decrypt">>>(new Map());
  const [keyUsageWarning, setKeyUsageWarning] = useState<string>("");
  const [keyDestroyed, setKeyDestroyed] = useState(false);

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  const processText = mode === "encrypt" ? otpEncrypt : otpDecrypt;

  const isKeyValid = cleanKey.length >= cleanInput.length;
  
  // Check if key has been used for THIS mode
  const keyModes = usedKeys.get(cleanKey);
  const isKeyReused = keyModes?.has(mode) && cleanKey.length > 0;
  const wasKeyUsedForOtherMode = keyModes && !keyModes.has(mode) && cleanKey.length > 0;

  const handleGenerateKey = () => {
    const newKey = generateRandomKey(cleanInput.length || 10);
    setKey(newKey);
    setKeyUsageWarning("");
    setKeyDestroyed(false);
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
    
    // Check if key has been used for this mode
    const keyModes = usedKeys.get(cleanKey);
    if (keyModes?.has(mode)) {
      setKeyUsageWarning(`This key was already used for ${mode}ion. OTP keys must only be used once per operation.`);
      return;
    }
    
    setKeyUsageWarning("");
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

  // Mark key as used when animation completes
  useEffect(() => {
    if (!isAnimating || activeIndex < 0) return;

    if (activeIndex >= cleanInput.length) {
      setIsAnimating(false);
      // Mark this key as used for this mode
      setUsedKeys(prev => {
        const newMap = new Map(prev);
        const existingModes = newMap.get(cleanKey) || new Set();
        existingModes.add(mode);
        newMap.set(cleanKey, existingModes);
        return newMap;
      });
      setKeyDestroyed(true);
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

  // Reset animation state when inputs change (not when usedKeys changes)
  useEffect(() => {
    setHasAnimated(false);
    setActiveIndex(-1);
    setOutputText("");
    setKeyDestroyed(false);
  }, [inputText, key, mode]);

  // Check key reuse warning separately
  useEffect(() => {
    const keyModes = usedKeys.get(cleanKey);
    if (keyModes?.has(mode) && cleanKey.length > 0) {
      setKeyUsageWarning(`This key was already used for ${mode}ion. Generate a new key.`);
    } else {
      setKeyUsageWarning("");
    }
  }, [cleanKey, usedKeys, mode]);

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
                className={cn(
                  "w-full bg-input border rounded-lg px-4 py-3 font-mono text-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                  isKeyReused 
                    ? "border-red-500 text-red-400 focus:ring-red-500 line-through opacity-60"
                    : keyDestroyed
                      ? "border-yellow-500/50 text-yellow-400/80 focus:ring-yellow-500"
                      : isKeyValid 
                        ? "border-green-500/50 text-green-400 focus:ring-green-500" 
                        : "border-red-500/50 text-red-400 focus:ring-red-500"
                )}
                placeholder="Enter or generate key..."
                maxLength={30}
              />
              
              {/* Key Status Messages */}
              {keyUsageWarning ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{keyUsageWarning}</p>
                </div>
              ) : keyDestroyed ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="text-yellow-400 font-semibold">Key used for {mode}ion.</span>
                    <span className="text-muted-foreground ml-1">
                      {wasKeyUsedForOtherMode 
                        ? "This key is now fully exhausted. Generate a new key." 
                        : `Can still be used once for ${mode === "encrypt" ? "decrypt" : "encrypt"}ion.`}
                    </span>
                  </div>
                </div>
              ) : wasKeyUsedForOtherMode ? (
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <p className="text-xs text-blue-400">
                    Key was used for {mode === "encrypt" ? "decrypt" : "encrypt"}ion. You can use it once for {mode}ion.
                  </p>
                </div>
              ) : (
                <p className={`text-xs mt-1 ${isKeyValid ? "text-green-400" : "text-red-400"}`}>
                  {cleanKey.length} characters {!isKeyValid && `(need ${cleanInput.length - cleanKey.length} more)`}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
                disabled={!isKeyValid || isKeyReused}
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isKeyReused ? "Key Already Used" : isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Final Ciphertext/Plaintext Output */}
            <div className={cn(
              "rounded-lg p-3 border",
              mode === "decrypt" 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-primary/10 border-primary/30"
            )}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {mode === "encrypt" ? "Final Ciphertext" : "Final Plaintext"}
                </div>
                {/* Show decrypt/encrypt button only when animation is complete */}
                {isKeyValid && hasAnimated && !isAnimating && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-6 text-xs px-2",
                      mode === "encrypt"
                        ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                        : "border-primary/50 text-primary hover:bg-primary/10"
                    )}
                    onClick={() => {
                      const result = processText(inputText, key);
                      setInputText(result);
                      setMode(mode === "encrypt" ? "decrypt" : "encrypt");
                      resetAnimation();
                    }}
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {mode === "encrypt" ? "Decrypt" : "Encrypt"}
                  </Button>
                )}
              </div>
              <div className={cn(
                "font-mono text-lg font-bold break-all min-h-[28px]",
                mode === "decrypt" ? "text-green-400" : "text-primary"
              )}>
                {!isKeyValid 
                  ? "—"
                  : hasAnimated 
                    ? (isAnimating ? outputText || "..." : processText(inputText, key))
                    : "Click Animate to see result"
                }
              </div>
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
            {isKeyValid && cleanInput.length > 0 ? (
              <>
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

                {/* OTP Tape Visualization - Enhanced */}
                <div className="space-y-2 py-4">
                  {/* Message Tape */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-20 text-right text-xs text-blue-400 font-semibold uppercase tracking-wide">
                      {mode === "encrypt" ? "Plain" : "Cipher"}
                    </div>
                    <div className="flex gap-0.5">
                      {cleanInput.split("").map((letter, i) => (
                        <div 
                          key={`msg-${i}`}
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
                          <span className="text-[9px] text-blue-400/60 font-mono">{ALPHABET.indexOf(letter)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* XOR Operation Line */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-20" />
                    <div className="flex gap-0.5">
                      {cleanInput.split("").map((_, i) => (
                        <div key={`op-${i}`} className="w-11 flex items-center justify-center">
                          <span className={cn(
                            "text-xl font-bold transition-all duration-300",
                            i === activeIndex && isAnimating 
                              ? "text-green-400 scale-150" 
                              : "text-muted-foreground/30"
                          )}>⊕</span>
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
                      {cleanKey.slice(0, cleanInput.length).split("").map((letter, i) => (
                        <div 
                          key={`key-${i}`}
                          className={cn(
                            "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                            "bg-gradient-to-b from-green-500/30 to-green-500/10 border border-green-500/40",
                            i === activeIndex && isAnimating && "ring-2 ring-green-400 scale-105 shadow-lg shadow-green-500/20"
                          )}
                        >
                          <span className={cn(
                            "font-mono font-bold text-xl",
                            i === activeIndex && isAnimating ? "text-green-300" : "text-green-400"
                          )}>{letter}</span>
                          <span className="text-[9px] text-green-400/60 font-mono">{ALPHABET.indexOf(letter)}</span>
                        </div>
                      ))}
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
                              ? (isAnimating ? (i < activeIndex ? "bg-primary" : "bg-muted-foreground/20") : "bg-primary")
                              : "bg-muted-foreground/20"
                          )} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Result Tape */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-20 text-right text-xs text-primary font-semibold uppercase tracking-wide">
                      {mode === "encrypt" ? "Cipher" : "Plain"}
                    </div>
                    <div className="flex gap-0.5">
                      {cleanInput.split("").map((_, i) => {
                        const fullResult = processText(inputText, key);
                        const resultChar = hasAnimated 
                          ? (isAnimating ? outputText[i] : fullResult[i])
                          : undefined;
                        // Only show result if animation has started and either:
                        // - Animation is running and we've passed this index
                        // - Animation is complete
                        const showResult = hasAnimated && (isAnimating ? i < activeIndex : true);
                        return (
                          <div 
                            key={`res-${i}`}
                            className={cn(
                              "w-11 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                              showResult && resultChar
                                ? "bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/40" 
                                : "bg-muted/30 border border-border/50",
                              i === activeIndex - 1 && isAnimating && "ring-2 ring-primary scale-105 shadow-lg shadow-primary/20"
                            )}
                          >
                            {showResult && resultChar ? (
                              <>
                                <span className="font-mono font-bold text-xl text-primary">{resultChar}</span>
                                <span className="text-[9px] text-primary/60 font-mono">{ALPHABET.indexOf(resultChar)}</span>
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

                {/* Current Calculation Card - Only during animation */}
                {calculation && isAnimating && (
                  <div className="bg-gradient-to-br from-muted/20 to-transparent border border-border/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                        {activeIndex + 1}
                      </span>
                      Modular Arithmetic
                    </h4>
                    
                    {/* Visual Calculation */}
                    <div className="flex items-center justify-center gap-2 py-3">
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                          <span className="font-mono font-bold text-2xl text-blue-400">{calculation.textChar}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">{calculation.textIndex}</span>
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                        <span className="text-xl text-muted-foreground">{mode === "encrypt" ? "+" : "−"}</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                          <span className="font-mono font-bold text-2xl text-green-400">{calculation.keyChar}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">{calculation.keyIndex}</span>
                      </div>
                      
                      <div className="text-muted-foreground text-sm px-2">mod 26</div>
                      
                      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                        <span className="text-xl text-muted-foreground">=</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="w-14 h-14 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                          <span className="font-mono font-bold text-2xl text-primary">{calculation.result}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">{calculation.resultIndex}</span>
                      </div>
                    </div>

                    {/* Formula */}
                    <div className="text-center mt-2 p-2 bg-background/30 rounded-lg">
                      <code className="font-mono text-sm text-muted-foreground">
                        ({calculation.textIndex} {mode === "encrypt" ? "+" : "−"} {calculation.keyIndex}) mod 26 = <span className="text-primary font-bold">{calculation.resultIndex}</span>
                      </code>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty state - no input or invalid key */
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center text-muted-foreground/50">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Enter a message to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
