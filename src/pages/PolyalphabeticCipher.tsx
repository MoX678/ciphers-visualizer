import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
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

            {/* Shift Rules */}
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
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {rules.map((rule, index) => {
                  const color = getRuleColor(index);
                  return (
                    <div 
                      key={index}
                      className={cn("flex items-center gap-2 p-2 rounded-lg", color.bg, "border", color.border)}
                    >
                      <div className={cn("font-bold text-xs w-12", color.text)}>
                        R{rule.position}:
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShift(index, rule.shift - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <input
                          type="number"
                          value={rule.shift}
                          onChange={(e) => updateShift(index, parseInt(e.target.value) || 0)}
                          className={cn(
                            "w-10 h-7 bg-background/50 border rounded text-center font-mono text-sm",
                            color.border, color.text
                          )}
                          min={0}
                          max={25}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateShift(index, rule.shift + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <span className="text-muted-foreground text-xs">
                          shift {mode === "encrypt" ? "right" : "left"}
                        </span>
                      </div>
                      {rules.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
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
            
            {/* Input letters - clickable */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"} - Click to navigate
              </p>
              <div className="flex flex-wrap gap-1">
                {cleanInput.split("").map((letter, i) => {
                  const ruleIndex = i % rules.length;
                  const color = getRuleColor(ruleIndex);
                  const isActive = i === activeIndex;
                  const isProcessed = i <= activeIndex && activeIndex >= 0;
                  
                  return (
                    <button 
                      key={`input-${i}`} 
                      onClick={() => !isAnimating && goToStep(i)}
                      disabled={isAnimating}
                      className={cn(
                        "flex flex-col items-center cursor-pointer transition-all hover:bg-muted/30 rounded p-1",
                        "disabled:cursor-not-allowed",
                        isActive && "bg-primary/20 ring-1 ring-primary",
                        isProcessed && !isActive && "bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center font-mono text-lg border-2 transition-all",
                        isActive && "bg-blue-500/30 border-blue-500 text-blue-400 scale-105",
                        isProcessed && !isActive && "bg-muted/50 border-muted-foreground/50 text-muted-foreground",
                        !isProcessed && "border-border text-foreground"
                      )}>
                        {letter}
                      </div>
                      <div className={cn("text-[9px] mt-0.5", color.text)}>
                        R{ruleIndex + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output letters - clickable */}
            {hasAnimated && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {outputText.split("").map((letter, i) => {
                    const ruleIndex = i % rules.length;
                    const color = getRuleColor(ruleIndex);
                    const isCurrentStep = i === activeIndex;
                    
                    return (
                      <button 
                        key={`output-${i}`}
                        onClick={() => goToStep(i)}
                        className={cn(
                          "flex flex-col items-center cursor-pointer transition-all hover:bg-muted/30 rounded p-1",
                          isCurrentStep && "bg-green-500/20 ring-1 ring-green-500"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center font-mono text-lg border-2 transition-all",
                          "bg-green-500/20 border-green-500/50 text-green-400",
                          isCurrentStep && "border-green-500 scale-105"
                        )}>
                          {letter}
                        </div>
                        <div className={cn("text-[9px] mt-0.5", color.text)}>
                          R{ruleIndex + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* Current Step Calculation - Integrated */}
            {calculation && (
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="text-sm font-semibold text-primary">
                  Step {activeIndex + 1}: Letter "{calculation.textChar}" → "{calculation.result}" (Rule {calculation.rulePosition})
                </h4>
                
                {/* Scaled up 4-column grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Input Letter */}
                  <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/30">
                    <div className="text-sm text-muted-foreground mb-2">
                      {mode === "encrypt" ? "Plain" : "Cipher"}
                    </div>
                    <div className="w-14 h-14 mx-auto rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-2xl font-bold text-blue-400">
                      {calculation.textChar}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      index: <span className="text-blue-400 font-mono text-base">{calculation.textIndex}</span>
                    </div>
                  </div>

                  {/* Shift Amount */}
                  <div className={cn("rounded-lg p-4 text-center border", getRuleColor(calculation.ruleIndex).bg, getRuleColor(calculation.ruleIndex).border)}>
                    <div className="text-sm text-muted-foreground mb-2">
                      R{calculation.rulePosition} Shift
                    </div>
                    <div className={cn(
                      "w-14 h-14 mx-auto rounded-lg bg-background/50 border-2 flex items-center justify-center text-2xl font-bold",
                      getRuleColor(calculation.ruleIndex).border, getRuleColor(calculation.ruleIndex).text
                    )}>
                      {mode === "encrypt" ? "+" : "-"}{calculation.shift}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {mode === "encrypt" ? "right" : "left"}
                    </div>
                  </div>

                  {/* Operation */}
                  <div className="bg-muted/20 rounded-lg p-4 text-center flex flex-col justify-center">
                    <div className="font-mono text-sm text-foreground">
                      ({calculation.textIndex} {mode === "encrypt" ? "+" : "-"} {calculation.shift}) mod 26
                    </div>
                    <div className="text-2xl text-primary my-1">=</div>
                    <div className="font-mono text-2xl text-primary">{calculation.resultIndex}</div>
                  </div>

                  {/* Result Letter */}
                  <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
                    <div className="text-sm text-muted-foreground mb-2">
                      {mode === "encrypt" ? "Cipher" : "Plain"}
                    </div>
                    <div className="w-14 h-14 mx-auto rounded-lg bg-green-500/20 border-2 border-green-500 flex items-center justify-center text-2xl font-bold text-green-400">
                      {calculation.result}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      index: <span className="text-green-400 font-mono text-base">{calculation.resultIndex}</span>
                    </div>
                  </div>
                </div>

                {/* Visual shift on alphabet */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="flex justify-center">
                    <div className="flex gap-0.5 overflow-x-auto pb-2">
                      {ALPHABET.split("").map((letter, i) => {
                        const isSource = i === calculation.textIndex;
                        const isTarget = i === calculation.resultIndex;
                        return (
                          <div
                            key={letter}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center text-xs font-mono rounded transition-all",
                              isSource
                                ? "bg-blue-500 text-white scale-110 ring-2 ring-blue-300"
                                : isTarget
                                ? "bg-green-500 text-white scale-110 ring-2 ring-green-300"
                                : "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-center mt-2 text-sm gap-4">
                    <span className="text-blue-400">● {calculation.textChar}</span>
                    <span className="text-green-400">● {calculation.result}</span>
                    <span className={getRuleColor(calculation.ruleIndex).text}>
                      ({calculation.shift} {mode === "encrypt" ? "right" : "left"})
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
