import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
import { AlphabetWheel } from "@/components/AlphabetWheel";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, ArrowRight, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

            <div>
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Shift: <span className="text-primary font-mono text-lg">{shift}</span>
              </label>
              <Slider
                value={[shift]}
                onValueChange={([value]) => setShift(value)}
                min={1}
                max={25}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
                <span>1</span>
                <span>25</span>
              </div>
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
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Process
            </h3>
            
            {/* Input Row */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Input</p>
              <div className="flex flex-wrap gap-1.5">
                {inputText.split("").map((letter, i) => (
                  <LetterBox
                    key={`input-${i}`}
                    letter={letter}
                    variant="input"
                    isActive={i === activeIndex}
                    isHighlighted={i < activeIndex}
                  />
                ))}
              </div>
            </div>

            {/* Transformation Arrow */}
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 text-xs">
                <ArrowRight className={`w-5 h-5 ${mode === "encrypt" ? "text-primary" : "text-secondary"}`} />
                <span className={`font-mono ${mode === "encrypt" ? "text-primary" : "text-secondary"}`}>
                  {mode === "encrypt" ? "+" : "-"}{shift}
                </span>
                <ArrowRight className={`w-5 h-5 ${mode === "encrypt" ? "text-primary" : "text-secondary"}`} />
              </div>
            </div>

            {/* Output Row */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Output</p>
              <div className="flex flex-wrap gap-1.5">
                {hasAnimated ? (
                  (isAnimating ? outputText : processText(inputText, shift)).split("").map((letter, i) => (
                    <LetterBox
                      key={`output-${i}`}
                      letter={letter}
                      variant="output"
                      isHighlighted={i === activeIndex - 1}
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                )}
              </div>
            </div>

            {/* Current transformation detail */}
            {hasAnimated && activeIndex >= 0 && activeIndex < inputText.length && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span className="font-mono text-lg text-muted-foreground">{currentInputLetter}</span>
                  <span className="text-primary">→</span>
                  <span className={`font-mono px-2 py-1 rounded ${mode === "encrypt" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"}`}>
                    {mode === "encrypt" ? "+" : "-"}{shift}
                  </span>
                  <span className="text-primary">→</span>
                  <span className="font-mono text-lg text-primary">{currentOutputLetter}</span>
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
