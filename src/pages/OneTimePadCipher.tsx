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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Security Badge */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50 text-green-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Perfect Secrecy (when used correctly)</span>
          </div>
        </div>

        {/* Input and Key */}
        <div className="glass-card p-6 space-y-4">
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
                      The One-Time Pad is the <strong className="text-foreground">only cipher mathematically proven to be unbreakable</strong> 
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

          <div className="grid md:grid-cols-2 gap-4">
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
          </div>

          {/* Key validity warning */}
          {!isKeyValid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">
                Key must be at least as long as the message! 
                Current: {cleanKey.length} / {cleanInput.length} characters
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
              variant="neon"
              className="flex-1"
              disabled={!isKeyValid}
            >
              {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isAnimating ? "Pause" : "Animate"}
            </Button>
            <Button onClick={resetAnimation} variant="outline" disabled={!isKeyValid}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Output - shows in controls */}
          {isKeyValid && (
            <div className={cn(
              "rounded-lg p-3",
              mode === "decrypt" ? "bg-green-500/10 border border-green-500/30" : "bg-primary/10 border border-primary/30"
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

        {/* Progress */}
        {isAnimating && (
          <div className="glass-card p-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{activeIndex} / {cleanInput.length} characters</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(activeIndex / cleanInput.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Visualization */}
        {isKeyValid && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              Step-by-Step {mode === "encrypt" ? "Encryption" : "Decryption"}
            </h3>
            
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
        )}

        {/* Current calculation */}
        {calculation && (
          <div className="glass-card p-6 border-green-500/50">
            <h3 className="text-lg font-semibold text-green-400 mb-4">
              Position {activeIndex + 1}: XOR-like Operation
            </h3>
            
            <div className="grid md:grid-cols-4 gap-4">
              {/* Plaintext Letter */}
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
                </div>
                <div className="w-14 h-14 mx-auto rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-2xl font-bold text-blue-400">
                  {calculation.textChar}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Index: <span className="text-blue-400 font-mono">{calculation.textIndex}</span>
                </div>
              </div>

              {/* Key Letter */}
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">Key Character</div>
                <div className="w-14 h-14 mx-auto rounded-lg bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-2xl font-bold text-green-400">
                  {calculation.keyChar}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Index: <span className="text-green-400 font-mono">{calculation.keyIndex}</span>
                </div>
              </div>

              {/* Operation */}
              <div className="bg-muted/20 rounded-lg p-4 text-center flex flex-col justify-center">
                <div className="text-xs text-muted-foreground mb-2">Operation</div>
                <div className="font-mono text-sm text-foreground">
                  ({calculation.textIndex} {mode === "encrypt" ? "+" : "-"} {calculation.keyIndex}) mod 26
                </div>
                <div className="text-2xl text-green-400 mt-2">=</div>
                <div className="font-mono text-xl text-green-400">{calculation.resultIndex}</div>
              </div>

              {/* Result Letter */}
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                </div>
                <div className="w-14 h-14 mx-auto rounded-lg bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary">
                  {calculation.result}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Index: <span className="text-primary font-mono">{calculation.resultIndex}</span>
                </div>
              </div>
            </div>

            {/* Binary XOR visualization */}
            <div className="mt-6 p-4 bg-muted/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-3 text-center">Modular Addition (similar to XOR for binary)</p>
              <div className="flex items-center justify-center gap-4 font-mono">
                <div className="text-center">
                  <div className="text-blue-400 text-lg">{calculation.textChar}</div>
                  <div className="text-xs text-muted-foreground">{calculation.textIndex}</div>
                </div>
                <div className="text-2xl text-green-400">{mode === "encrypt" ? "⊕" : "⊖"}</div>
                <div className="text-center">
                  <div className="text-green-400 text-lg">{calculation.keyChar}</div>
                  <div className="text-xs text-muted-foreground">{calculation.keyIndex}</div>
                </div>
                <div className="text-2xl text-muted-foreground">=</div>
                <div className="text-center">
                  <div className="text-primary text-lg">{calculation.result}</div>
                  <div className="text-xs text-muted-foreground">{calculation.resultIndex}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Summary */}
        {isKeyValid && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Result</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
                </div>
                <div className="font-mono text-xl text-foreground tracking-widest">
                  {cleanInput}
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-sm text-muted-foreground mb-2">Key (Secret)</div>
                <div className="font-mono text-xl text-green-400 tracking-widest">
                  {cleanKey.slice(0, cleanInput.length)}
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                <div className="text-sm text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                </div>
                <div className="font-mono text-xl text-primary tracking-widest">
                  {processText(inputText, key)}
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
    </CipherLayout>
  );
}
