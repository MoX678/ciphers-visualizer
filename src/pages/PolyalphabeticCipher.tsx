import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Plus, Minus, ChevronRight, ChevronLeft, Info } from "lucide-react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface ShiftRule {
  position: number;
  shift: number;
}

function polyalphabeticEncrypt(text: string, rules: ShiftRule[]): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  if (rules.length === 0) return cleanText;
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const ruleIndex = i % rules.length;
      const shift = rules[ruleIndex].shift;
      return ALPHABET[(textIndex + shift + 26) % 26];
    })
    .join("");
}

function polyalphabeticDecrypt(text: string, rules: ShiftRule[]): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  if (rules.length === 0) return cleanText;
  
  return cleanText
    .split("")
    .map((char, i) => {
      const textIndex = ALPHABET.indexOf(char);
      const ruleIndex = i % rules.length;
      const shift = rules[ruleIndex].shift;
      return ALPHABET[(textIndex - shift + 26) % 26];
    })
    .join("");
}

export default function PolyalphabeticCipher() {
  const [inputText, setInputText] = useState("SECURITY");
  const [rules, setRules] = useState<ShiftRule[]>([
    { position: 1, shift: 3 },
    { position: 2, shift: 5 },
    { position: 3, shift: 7 },
  ]);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const processText = mode === "encrypt" ? polyalphabeticEncrypt : polyalphabeticDecrypt;

  const addRule = () => {
    if (rules.length < 10) {
      setRules([...rules, { position: rules.length + 1, shift: 1 }]);
    }
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      const newRules = rules.filter((_, i) => i !== index);
      setRules(newRules.map((r, i) => ({ ...r, position: i + 1 })));
    }
  };

  const updateShift = (index: number, shift: number) => {
    const newRules = [...rules];
    newRules[index].shift = ((shift % 26) + 26) % 26;
    setRules(newRules);
  };

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
      const ruleIndex = i % rules.length;
      const shift = rules[ruleIndex].shift;
      const textIndex = ALPHABET.indexOf(textChar);
      
      const resultIndex = mode === "encrypt"
        ? (textIndex + shift + 26) % 26
        : (textIndex - shift + 26) % 26;
      
      output += ALPHABET[resultIndex];
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
      const ruleIndex = activeIndex % rules.length;
      const shift = rules[ruleIndex].shift;
      const textIndex = ALPHABET.indexOf(textChar);
      
      const resultIndex = mode === "encrypt"
        ? (textIndex + shift + 26) % 26
        : (textIndex - shift + 26) % 26;
      
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
  }, [inputText, rules, mode]);

  const getCurrentCalculation = () => {
    if (activeIndex < 0 || activeIndex >= cleanInput.length) return null;
    if (!isAnimating && !hasAnimated) return null;
    
    const textChar = cleanInput[activeIndex];
    const ruleIndex = activeIndex % rules.length;
    const shift = rules[ruleIndex].shift;
    const textIndex = ALPHABET.indexOf(textChar);
    
    const resultIndex = mode === "encrypt"
      ? (textIndex + shift + 26) % 26
      : (textIndex - shift + 26) % 26;
    
    return {
      textChar,
      textIndex,
      ruleIndex,
      rulePosition: rules[ruleIndex].position,
      shift,
      resultIndex,
      result: ALPHABET[resultIndex],
      formula: mode === "encrypt"
        ? `(${textIndex} + ${shift}) mod 26 = ${resultIndex}`
        : `(${textIndex} - ${shift} + 26) mod 26 = ${resultIndex}`
    };
  };

  const calculation = getCurrentCalculation();

  // Get color for each rule
  const getRuleColor = (index: number) => {
    const colors = [
      { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
      { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-400" },
      { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-400" },
      { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-400" },
      { bg: "bg-pink-500/20", border: "border-pink-500", text: "text-pink-400" },
      { bg: "bg-cyan-500/20", border: "border-cyan-500", text: "text-cyan-400" },
      { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-400" },
      { bg: "bg-red-500/20", border: "border-red-500", text: "text-red-400" },
      { bg: "bg-indigo-500/20", border: "border-indigo-500", text: "text-indigo-400" },
      { bg: "bg-teal-500/20", border: "border-teal-500", text: "text-teal-400" },
    ];
    return colors[index % colors.length];
  };

  return (
    <CipherLayout
      title="Polyalphabetic Cipher"
      description="Position-based shifting with multiple shift rules"
    >
      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Left - Controls */}
          <div className="space-y-4">
            {/* Input */}
            <div className="glass-card p-5">
              {/* Header with Mode Toggle and Info */}
              <div className="flex items-center justify-between mb-4">
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
                      <DialogTitle>How Polyalphabetic Cipher Works</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Key Concept */}
                        <div className="bg-muted/20 rounded-lg p-3">
                          <h4 className="font-medium text-foreground mb-2">💡 Key Concept</h4>
                          <p className="text-muted-foreground">
                            Unlike monoalphabetic ciphers, polyalphabetic ciphers use <strong className="text-foreground">different shifts for different positions</strong>. 
                            Same letter encrypts differently based on position.
                          </p>
                        </div>

                        {/* Current Rules */}
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                          <h4 className="font-medium text-primary mb-2">📝 Your Rules</h4>
                          <div className="space-y-1">
                            {rules.slice(0, 4).map((rule, i) => {
                              const color = getRuleColor(i);
                              return (
                                <div key={i} className={cn("text-[11px]", color.text)}>
                                  R{rule.position}: +{rule.shift} (letters {i + 1}, {i + 1 + rules.length}...)
                                </div>
                              );
                            })}
                            {rules.length > 4 && <div className="text-muted-foreground text-[11px]">...and {rules.length - 4} more</div>}
                          </div>
                        </div>

                        {/* Visual Flow */}
                        <div className="bg-muted/20 rounded-lg p-3">
                          <h4 className="font-medium text-foreground mb-2">🔄 Flow</h4>
                          <div className="flex items-center gap-1 flex-wrap text-[10px]">
                            <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-mono">Letter N</div>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <div className="px-2 py-1 rounded bg-secondary/20 text-secondary font-mono">Rule (N mod {rules.length})</div>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <div className="px-2 py-1 rounded bg-primary/20 text-primary font-mono">Result</div>
                          </div>
                        </div>

                        {/* Security Note */}
                        <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                          <h4 className="font-medium text-yellow-500 mb-2">⚠️ Security</h4>
                          <p className="text-muted-foreground">
                            More secure than Caesar - frequency analysis is harder. Security increases with more rules and varied shifts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 30))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
              />
            </div>

            {/* Shift Rules - Tape Design */}
            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Shift Rules (Key)</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  disabled={rules.length >= 10}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              
              {/* Rules Tape Visualization - Monochrome, highlights on active */}
              <div className="flex items-center gap-0 flex-wrap">
                {rules.map((rule, index, arr) => {
                  const color = getRuleColor(index);
                  const isActive = calculation && calculation.ruleIndex === index;
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center border-y transition-all",
                        index === 0 && "border-l rounded-l-md",
                        index === arr.length - 1 && "border-r rounded-r-md",
                        index !== 0 && index !== arr.length - 1 && "border-l-0 border-r-0",
                        isActive ? cn(color.border, "bg-gradient-to-b", color.bg.replace("bg-", "from-"), "to-transparent") : "border-border bg-muted/20"
                      )}
                    >
                      <div className={cn(
                        "px-2 py-1 text-[10px] font-bold border-r",
                        isActive ? cn(color.text, color.border) : "text-muted-foreground border-border"
                      )}>
                        R{rule.position}
                      </div>
                      <div className={cn(
                        "w-8 h-7 flex items-center justify-center font-mono text-sm font-bold",
                        isActive ? color.text : "text-foreground"
                      )}>
                        +{rule.shift}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Detailed Rule Editor - Always Colored */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                {rules.map((rule, index) => {
                  const color = getRuleColor(index);
                  const isActive = calculation && calculation.ruleIndex === index;
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all",
                        color.bg, color.border,
                        isActive && "ring-1 ring-offset-1 ring-offset-background",
                        isActive && color.border.replace("border-", "ring-")
                      )}
                    >
                      <div className={cn("font-bold text-xs w-8", color.text)}>
                        R{rule.position}:
                      </div>
                      <div className="flex-1 flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShift(index, rule.shift - 1)}
                          className="h-5 w-5 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <input
                          type="number"
                          value={rule.shift}
                          onChange={(e) => updateShift(index, parseInt(e.target.value) || 0)}
                          className={cn(
                            "w-8 h-6 bg-background/50 border rounded text-center font-mono text-xs",
                            color.border, color.text
                          )}
                          min={0}
                          max={25}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShift(index, rule.shift + 1)}
                          className="h-5 w-5 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <span className="text-muted-foreground text-[10px]">
                          shift {mode === "encrypt" ? "→" : "←"}
                        </span>
                      </div>
                      {rules.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="text-muted-foreground hover:text-destructive h-5 w-5 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-[10px] text-muted-foreground">
                Rules repeat: Letter {rules.length + 1} uses R1, Letter {rules.length + 2} uses R2...
              </p>
            </div>

            {/* Animation Controls */}
            <div className="glass-card p-4">
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
                "mt-3 rounded-lg p-3",
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
                        const result = processText(inputText, rules);
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
                    ? (isAnimating ? outputText : processText(inputText, rules))
                    : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                  }
                </div>
              </div>
              
              {/* Progress */}
              {isAnimating && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{activeIndex} / {cleanInput.length}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(activeIndex / cleanInput.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right - Step-by-Step Visualization */}
          <div className="glass-card p-5 space-y-4">
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
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((Math.min(activeIndex + 1, cleanInput.length)) / cleanInput.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Tape Visualization - Vigenère Style */}
            <div className="space-y-2 py-2">
              {/* Input Tape */}
              <div className="flex items-center gap-3">
                <div className="w-14 text-right text-xs text-blue-400 font-semibold uppercase tracking-wide shrink-0">
                  {mode === "encrypt" ? "Plain" : "Cipher"}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {cleanInput.split("").map((letter, i) => {
                    const ruleIndex = i % rules.length;
                    const isActive = i === activeIndex;
                    const isProcessed = i <= activeIndex && hasAnimated;
                    
                    return (
                      <button 
                        key={`input-${i}`} 
                        onClick={() => !isAnimating && goToStep(i)}
                        disabled={isAnimating}
                        className={cn(
                          "w-10 h-12 flex flex-col items-center justify-center rounded-lg transition-all duration-300",
                          "bg-gradient-to-b from-blue-500/30 to-blue-500/10 border border-blue-500/40",
                          "hover:from-blue-500/40 hover:to-blue-500/20 cursor-pointer disabled:cursor-default",
                          isActive && isAnimating && "ring-2 ring-blue-400 scale-105 shadow-lg shadow-blue-500/20",
                          isProcessed && !isActive && "opacity-60"
                        )}
                      >
                        <span className={cn(
                          "font-mono font-bold text-lg",
                          isActive && isAnimating ? "text-blue-300" : "text-blue-400"
                        )}>{letter}</span>
                        <span className={cn("text-[8px] font-semibold", getRuleColor(ruleIndex).text)}>
                          R{ruleIndex + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operation Line */}
              <div className="flex items-center gap-3">
                <div className="w-14" />
                <div className="flex gap-0.5 flex-wrap">
                  {cleanInput.split("").map((_, i) => {
                    const ruleIndex = i % rules.length;
                    const shift = rules[ruleIndex].shift;
                    const isActive = i === activeIndex && isAnimating;
                    const isProcessed = i < activeIndex && hasAnimated;
                    
                    return (
                      <div key={`op-${i}`} className="w-10 flex items-center justify-center">
                        <span className={cn(
                          "text-xs font-bold transition-all duration-300",
                          isActive
                            ? cn("scale-125", getRuleColor(ruleIndex).text)
                            : isProcessed
                              ? "text-muted-foreground/50"
                              : "text-muted-foreground/30"
                        )}>{mode === "encrypt" ? "+" : "−"}{shift}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Equals Line */}
              <div className="flex items-center gap-3">
                <div className="w-14" />
                <div className="flex gap-0.5 flex-wrap">
                  {cleanInput.split("").map((_, i) => (
                    <div key={`eq-${i}`} className="w-10 flex items-center justify-center">
                      <div className={cn(
                        "w-5 h-0.5 transition-all duration-300",
                        hasAnimated && i <= activeIndex ? "bg-primary" : "bg-muted-foreground/20"
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Tape */}
              <div className="flex items-center gap-3">
                <div className="w-14 text-right text-xs text-primary font-semibold uppercase tracking-wide shrink-0">
                  {mode === "encrypt" ? "Cipher" : "Plain"}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {cleanInput.split("").map((_, i) => {
                    const ruleIndex = i % rules.length;
                    const isActive = i === activeIndex;
                    const showOutput = hasAnimated && (isAnimating ? i < activeIndex : i <= activeIndex);
                    const outputChar = showOutput ? outputText[i] || "" : "";
                    
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
                        )}>{outputChar}</span>
                        {showOutput && (
                          <span className={cn("text-[8px] font-semibold", getRuleColor(ruleIndex).text)}>
                            R{ruleIndex + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step navigation buttons */}
            {hasAnimated && !isAnimating && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-border">
                <Button
                  onClick={goToPrevStep}
                  disabled={activeIndex <= 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground px-3">
                  Step {activeIndex + 1} of {cleanInput.length}
                </span>
                <Button
                  onClick={goToNextStep}
                  disabled={activeIndex >= cleanInput.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Current Step Detail - Enhanced */}
            {calculation && (
              <div className="pt-3 border-t border-border/50 space-y-4">
                {/* Step Header */}
                <div className="text-center">
                  <span className={cn(
                    "text-sm font-medium",
                    getRuleColor(calculation.ruleIndex).text
                  )}>
                    Processing Letter {activeIndex + 1}: Using Rule {calculation.rulePosition}
                  </span>
                </div>

                {/* 4-Column Detail Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Input Letter */}
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1.5">
                      {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
                    </div>
                    <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-b from-blue-500/30 to-blue-500/10 border border-blue-500/50 flex items-center justify-center text-xl font-bold text-blue-400">
                      {calculation.textChar}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">
                      Index: <span className="text-blue-400 font-mono">{calculation.textIndex}</span>
                    </div>
                  </div>

                  {/* Shift Amount */}
                  <div className={cn(
                    "rounded-lg p-3 text-center border",
                    getRuleColor(calculation.ruleIndex).bg,
                    getRuleColor(calculation.ruleIndex).border
                  )}>
                    <div className="text-[10px] text-muted-foreground mb-1.5">
                      Rule {calculation.rulePosition} Shift
                    </div>
                    <div className={cn(
                      "w-10 h-10 mx-auto rounded-lg bg-background/50 border flex items-center justify-center text-xl font-bold",
                      getRuleColor(calculation.ruleIndex).border,
                      getRuleColor(calculation.ruleIndex).text
                    )}>
                      {mode === "encrypt" ? "+" : "−"}{calculation.shift}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">
                      {mode === "encrypt" ? "Right" : "Left"} shift
                    </div>
                  </div>

                  {/* Operation */}
                  <div className="bg-muted/20 rounded-lg p-3 text-center flex flex-col justify-center">
                    <div className="text-[10px] text-muted-foreground mb-1">Operation</div>
                    <div className="font-mono text-xs text-foreground">
                      ({calculation.textIndex} {mode === "encrypt" ? "+" : "−"} {calculation.shift}) mod 26
                    </div>
                    <div className="text-lg text-primary my-0.5">=</div>
                    <div className="font-mono text-base text-primary font-bold">{calculation.resultIndex}</div>
                  </div>

                  {/* Result Letter */}
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-muted-foreground mb-1.5">
                      {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                    </div>
                    <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/50 flex items-center justify-center text-xl font-bold text-primary">
                      {calculation.result}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1.5">
                      Index: <span className="text-primary font-mono">{calculation.resultIndex}</span>
                    </div>
                  </div>
                </div>

                {/* Step Equation Summary */}
                <div className="flex items-center justify-center">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50",
                    "bg-gradient-to-r from-blue-500/10 via-transparent to-primary/10"
                  )}>
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                        {calculation.textChar}
                      </span>
                      <span className="text-muted-foreground text-[10px]">({calculation.textIndex})</span>
                      <span className={cn("font-bold", getRuleColor(calculation.ruleIndex).text)}>
                        {mode === "encrypt" ? "+" : "−"}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded font-bold", getRuleColor(calculation.ruleIndex).bg, getRuleColor(calculation.ruleIndex).text)}>
                        {calculation.shift}
                      </span>
                      <span className="text-primary">=</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                        {calculation.result}
                      </span>
                      <span className="text-muted-foreground text-[10px]">({calculation.resultIndex})</span>
                    </div>
                  </div>
                </div>

                {/* Alphabet Shift Visualization */}
                <div className="p-3 bg-muted/10 rounded-lg">
                  <div className="text-[10px] text-muted-foreground mb-2 text-center">Alphabet Shift Visualization</div>
                  <div className="flex justify-center overflow-x-auto pb-1">
                    <div className="flex gap-0">
                      {ALPHABET.split("").map((letter, i, arr) => {
                        const isSource = i === calculation.textIndex;
                        const isTarget = i === calculation.resultIndex;
                        return (
                          <div
                            key={letter}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center text-[10px] font-mono border-y transition-all",
                              i === 0 && "border-l rounded-l",
                              i === arr.length - 1 && "border-r rounded-r",
                              i !== 0 && i !== arr.length - 1 && "border-l-0 border-r-0",
                              isSource && "bg-blue-500 text-white scale-110 z-10 border-blue-500 rounded shadow-lg shadow-blue-500/30",
                              isTarget && "bg-primary text-primary-foreground scale-110 z-10 border-primary rounded shadow-lg shadow-primary/30",
                              !isSource && !isTarget && "bg-muted/30 text-muted-foreground/70 border-border/50"
                            )}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-center mt-2 gap-4 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-blue-400">Source: {calculation.textChar}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                      <span className="text-primary">Result: {calculation.result}</span>
                    </span>
                    <span className={cn("flex items-center gap-1", getRuleColor(calculation.ruleIndex).text)}>
                      (shifted {calculation.shift} {mode === "encrypt" ? "right" : "left"})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
