import { useState, useEffect, useMemo } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // No J (I=J in Playfair)

function generateMatrix(keyword: string): string[][] {
  const key = keyword.toUpperCase().replace(/J/g, "I").replace(/[^A-Z]/g, "");
  const used = new Set<string>();
  const letters: string[] = [];
  
  // Add keyword letters first
  for (const char of key) {
    if (!used.has(char)) {
      used.add(char);
      letters.push(char);
    }
  }
  
  // Add remaining alphabet
  for (const char of ALPHABET) {
    if (!used.has(char)) {
      used.add(char);
      letters.push(char);
    }
  }
  
  // Create 5x5 matrix
  const matrix: string[][] = [];
  for (let i = 0; i < 5; i++) {
    matrix.push(letters.slice(i * 5, (i + 1) * 5));
  }
  return matrix;
}

function findPosition(matrix: string[][], char: string): [number, number] {
  const c = char === "J" ? "I" : char;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (matrix[row][col] === c) {
        return [row, col];
      }
    }
  }
  return [0, 0];
}

function preparePlaintext(text: string): string[] {
  const clean = text.toUpperCase().replace(/J/g, "I").replace(/[^A-Z]/g, "");
  const pairs: string[] = [];
  let i = 0;
  
  while (i < clean.length) {
    const first = clean[i];
    const second = clean[i + 1];
    
    if (!second) {
      // Odd length, add X
      pairs.push(first + "X");
      i++;
    } else if (first === second) {
      // Same letters, insert X
      pairs.push(first + "X");
      i++;
    } else {
      pairs.push(first + second);
      i += 2;
    }
  }
  
  return pairs;
}

function prepareCiphertext(text: string): string[] {
  const clean = text.toUpperCase().replace(/J/g, "I").replace(/[^A-Z]/g, "");
  const pairs: string[] = [];
  
  for (let i = 0; i < clean.length; i += 2) {
    if (i + 1 < clean.length) {
      pairs.push(clean[i] + clean[i + 1]);
    }
  }
  
  return pairs;
}

interface RuleType {
  type: "row" | "column" | "rectangle";
  description: string;
}

function encryptPair(matrix: string[][], pair: string): { result: string; rule: RuleType; positions: number[][] } {
  const [r1, c1] = findPosition(matrix, pair[0]);
  const [r2, c2] = findPosition(matrix, pair[1]);
  
  let result: string;
  let rule: RuleType;
  
  if (r1 === r2) {
    // Same row: shift right
    result = matrix[r1][(c1 + 1) % 5] + matrix[r2][(c2 + 1) % 5];
    rule = { type: "row", description: "Same row → shift right" };
  } else if (c1 === c2) {
    // Same column: shift down
    result = matrix[(r1 + 1) % 5][c1] + matrix[(r2 + 1) % 5][c2];
    rule = { type: "column", description: "Same column → shift down" };
  } else {
    // Rectangle: swap columns
    result = matrix[r1][c2] + matrix[r2][c1];
    rule = { type: "rectangle", description: "Rectangle → swap columns" };
  }
  
  return { result, rule, positions: [[r1, c1], [r2, c2]] };
}

function decryptPair(matrix: string[][], pair: string): { result: string; rule: RuleType; positions: number[][] } {
  const [r1, c1] = findPosition(matrix, pair[0]);
  const [r2, c2] = findPosition(matrix, pair[1]);
  
  let result: string;
  let rule: RuleType;
  
  if (r1 === r2) {
    // Same row: shift left
    result = matrix[r1][(c1 + 4) % 5] + matrix[r2][(c2 + 4) % 5];
    rule = { type: "row", description: "Same row → shift left" };
  } else if (c1 === c2) {
    // Same column: shift up
    result = matrix[(r1 + 4) % 5][c1] + matrix[(r2 + 4) % 5][c2];
    rule = { type: "column", description: "Same column → shift up" };
  } else {
    // Rectangle: swap columns
    result = matrix[r1][c2] + matrix[r2][c1];
    rule = { type: "rectangle", description: "Rectangle → swap columns" };
  }
  
  return { result, rule, positions: [[r1, c1], [r2, c2]] };
}

function playfairEncrypt(text: string, keyword: string): string {
  const matrix = generateMatrix(keyword);
  const pairs = preparePlaintext(text);
  return pairs.map(pair => encryptPair(matrix, pair).result).join("");
}

function playfairDecrypt(text: string, keyword: string): string {
  const matrix = generateMatrix(keyword);
  const pairs = prepareCiphertext(text);
  let result = pairs.map(pair => decryptPair(matrix, pair).result).join("");
  // Remove X padding: trailing X and X between double letters (e.g., LXL -> LL)
  result = result.replace(/X$/g, ""); // Remove trailing X
  result = result.replace(/([A-Z])X\1/g, "$1$1"); // Remove X between same letters
  return result;
}

export default function PlayfairCipher() {
  const [inputText, setInputText] = useState("HELLO WORLD");
  const [keyword, setKeyword] = useState("MONARCHY");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [currentRule, setCurrentRule] = useState<RuleType | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<number[][]>([]);
  const [resultCells, setResultCells] = useState<number[][]>([]);
  const [completedSteps, setCompletedSteps] = useState<{
    inputPair: string;
    outputPair: string;
    rule: RuleType;
    positions: number[][];
    resultPositions: number[][];
  }[]>([]);

  const matrix = useMemo(() => generateMatrix(keyword), [keyword]);
  const pairs = useMemo(() => 
    mode === "encrypt" 
      ? preparePlaintext(inputText) 
      : prepareCiphertext(inputText),
    [inputText, mode]
  );
  const totalSteps = pairs.length;

  const processFunction = mode === "encrypt" ? encryptPair : decryptPair;

  const startAnimation = () => {
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(0);
    setOutputText("");
    setCurrentRule(null);
    setHighlightedCells([]);
    setResultCells([]);
    setCompletedSteps([]);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
    setOutputText("");
    setCurrentRule(null);
    setHighlightedCells([]);
    setResultCells([]);
    setCompletedSteps([]);
  };

  // Calculate result positions for a step
  const getResultPositions = (positions: number[][], rule: RuleType): number[][] => {
    const [r1, c1] = positions[0];
    const [r2, c2] = positions[1];
    
    if (rule.type === "row") {
      const shift = mode === "encrypt" ? 1 : 4;
      return [[r1, (c1 + shift) % 5], [r2, (c2 + shift) % 5]];
    } else if (rule.type === "column") {
      const shift = mode === "encrypt" ? 1 : 4;
      return [[(r1 + shift) % 5, c1], [(r2 + shift) % 5, c2]];
    } else {
      return [[r1, c2], [r2, c1]];
    }
  };

  // Navigate to a specific step
  const goToStep = (step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setIsAnimating(false);
    setActiveStep(step);
    
    // Calculate all steps up to this point
    const newCompletedSteps: typeof completedSteps = [];
    let output = "";
    
    for (let i = 0; i <= step; i++) {
      const pair = pairs[i];
      const { result, rule, positions } = processFunction(matrix, pair);
      const resultPositions = getResultPositions(positions, rule);
      
      newCompletedSteps.push({
        inputPair: pair,
        outputPair: result,
        rule,
        positions,
        resultPositions
      });
      output += result;
    }
    
    setCompletedSteps(newCompletedSteps);
    setOutputText(output);
    
    // Set current step's data
    const currentData = newCompletedSteps[step];
    setCurrentRule(currentData.rule);
    setHighlightedCells(currentData.positions);
    setResultCells(currentData.resultPositions);
  };

  const goToPrevStep = () => {
    if (activeStep > 0) {
      goToStep(activeStep - 1);
    }
  };

  const goToNextStep = () => {
    if (activeStep < totalSteps - 1) {
      goToStep(activeStep + 1);
    }
  };

  useEffect(() => {
    if (!isAnimating || activeStep < 0) return;

    if (activeStep >= pairs.length) {
      setIsAnimating(false);
      // Keep the last step visible
      if (completedSteps.length > 0) {
        const lastStep = completedSteps[completedSteps.length - 1];
        setHighlightedCells(lastStep.positions);
        setResultCells(lastStep.resultPositions);
        setCurrentRule(lastStep.rule);
        setActiveStep(pairs.length - 1);
      }
      return;
    }

    const pair = pairs[activeStep];
    const { result, rule, positions } = processFunction(matrix, pair);
    const resPositions = getResultPositions(positions, rule);

    setHighlightedCells(positions);
    setResultCells(resPositions);
    setCurrentRule(rule);

    const stepData = {
      inputPair: pair,
      outputPair: result,
      rule,
      positions,
      resultPositions: resPositions
    };

    const timer = setTimeout(() => {
      setOutputText((prev) => prev + result);
      setCompletedSteps((prev) => [...prev, stepData]);
      setActiveStep((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, activeStep, pairs, matrix, processFunction, mode]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
    setOutputText("");
    setCurrentRule(null);
    setHighlightedCells([]);
    setResultCells([]);
    setCompletedSteps([]);
  }, [inputText, keyword, mode]);

  const isCellHighlighted = (row: number, col: number) => {
    return highlightedCells.some(([r, c]) => r === row && c === col);
  };

  const isCellResult = (row: number, col: number) => {
    return resultCells.some(([r, c]) => r === row && c === col);
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case "row": return "text-blue-400 bg-blue-500/20 border-blue-500";
      case "column": return "text-green-400 bg-green-500/20 border-green-500";
      case "rectangle": return "text-purple-400 bg-purple-500/20 border-purple-500";
      default: return "";
    }
  };

  return (
    <CipherLayout
      title="Playfair Cipher"
      description="Digraph substitution cipher using a 5×5 key matrix"
    >
      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Matrix */}
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
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>How Playfair Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className={cn("rounded-lg p-3 border", getRuleColor("row"))}>
                        <h4 className="font-medium mb-1">Row Rule</h4>
                        <p className="text-muted-foreground text-xs">
                          Same row: shift {mode === "encrypt" ? "right" : "left"} (wrap around)
                        </p>
                      </div>
                      <div className={cn("rounded-lg p-3 border", getRuleColor("column"))}>
                        <h4 className="font-medium mb-1">Column Rule</h4>
                        <p className="text-muted-foreground text-xs">
                          Same column: shift {mode === "encrypt" ? "down" : "up"} (wrap around)
                        </p>
                      </div>
                      <div className={cn("rounded-lg p-3 border", getRuleColor("rectangle"))}>
                        <h4 className="font-medium mb-1">Rectangle Rule</h4>
                        <p className="text-muted-foreground text-xs">
                          Different row & column: swap columns
                        </p>
                      </div>
                    </div>

                    {/* Process */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-2">Process</h4>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Build 5×5 matrix from keyword (remove duplicate letters)</li>
                        <li>Split plaintext into digraphs (letter pairs)</li>
                        <li>If a pair has same letters, insert X between them</li>
                        <li>Apply the appropriate rule to each pair</li>
                      </ol>
                    </div>

                    {/* Notes */}
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 text-xs">
                      <span className="text-yellow-400 font-medium">⚠️ Note:</span>
                      <span className="text-muted-foreground ml-1">
                        J is treated as I. X padding persists in decryption (e.g., "BALLOON" → encrypt → decrypt → "BALXLOON")
                      </span>
                    </div>

                    {/* History */}
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                      <h4 className="text-sm font-medium text-primary mb-1">📜 Historical Note</h4>
                      <p className="text-sm text-muted-foreground">
                        Invented by Charles Wheatstone in 1854, but named after Lord Playfair who promoted its use.
                        Used by the British in WWI.
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
                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">J is treated as I</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className="w-full bg-input border border-secondary rounded-lg px-4 py-3 font-mono text-lg text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Enter keyword..."
                maxLength={25}
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

            {/* Output - shows live during animation */}
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
                      const result = mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword);
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
                  ? (isAnimating ? outputText : (mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword)))
                  : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                }
              </div>
            </div>

            {/* Digraph pairs clickable - now in right panel */}
          </div>

          {/* Right - 5x5 Matrix + Process */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Key Matrix <span className="text-muted-foreground font-normal">({keyword || "default"})</span>
              </h3>
              {/* Legend - inline */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500"></div>
                  <span className="text-muted-foreground">In</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500"></div>
                  <span className="text-muted-foreground">Out</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="inline-block">
                {matrix.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => {
                      const isHighlighted = isCellHighlighted(rowIndex, colIndex);
                      const isResult = isCellResult(rowIndex, colIndex);
                      return (
                        <div
                          key={colIndex}
                          className={cn(
                            "w-9 h-9 flex items-center justify-center font-mono text-base border transition-all",
                            isHighlighted && !isResult && "bg-blue-500/30 border-blue-500 text-blue-400",
                            isResult && !isHighlighted && "bg-green-500/30 border-green-500 text-green-400",
                            isHighlighted && isResult && "bg-purple-500/30 border-purple-500 text-purple-400",
                            !isHighlighted && !isResult && "border-border text-foreground"
                          )}
                        >
                          {cell}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar - compact */}
            {hasAnimated && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>Pair {Math.min(activeStep + 1, totalSteps)} / {totalSteps}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((Math.min(activeStep + 1, totalSteps)) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Input and Output pairs side by side */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {/* Input Digraphs */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Input Pairs</p>
                <div className="flex flex-wrap gap-1">
                  {pairs.map((pair, i) => {
                    const isActive = i === activeStep;
                    const isProcessed = i <= activeStep && activeStep >= 0;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => !isAnimating && goToStep(i)}
                        disabled={isAnimating}
                        className={cn(
                          "px-2 py-1 rounded border font-mono text-xs transition-all cursor-pointer",
                          "hover:bg-muted/30 disabled:cursor-not-allowed",
                          isActive && "bg-primary/20 border-primary text-primary ring-1 ring-primary",
                          isProcessed && !isActive && "bg-muted/50 border-muted-foreground/30 text-muted-foreground",
                          !isProcessed && "border-border text-foreground"
                        )}
                      >
                        {pair}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Output Pairs */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Output Pairs</p>
                <div className="flex flex-wrap gap-1">
                  {hasAnimated && outputText.length > 0 ? (
                    Array.from({ length: Math.ceil(outputText.length / 2) }).map((_, i) => {
                      const idx = i * 2;
                      const pair = outputText.slice(idx, idx + 2);
                      if (!pair) return null;
                      
                      const isCurrentStep = i === activeStep;
                      
                      return (
                        <button 
                          key={i}
                          onClick={() => goToStep(i)}
                          className={cn(
                            "px-2 py-1 rounded border font-mono text-xs transition-all cursor-pointer",
                            "hover:bg-muted/30 text-green-400 border-green-500/50",
                            isCurrentStep && "bg-green-500/20 ring-1 ring-green-500"
                          )}
                        >
                          {pair}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Step navigation buttons - compact */}
            {hasAnimated && !isAnimating && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={goToPrevStep}
                  disabled={activeStep <= 0}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  <ChevronLeft className="w-3 h-3 mr-0.5" />
                  Prev
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {activeStep + 1}/{totalSteps}
                </span>
                <Button
                  onClick={goToNextStep}
                  disabled={activeStep >= totalSteps - 1}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            )}

            {/* Current Step Detail - Compact horizontal */}
            {currentRule && hasAnimated && activeStep >= 0 && activeStep < pairs.length && (
              <div className={cn("pt-3 border-t border-border")}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-primary">
                    Step {activeStep + 1}: "{pairs[activeStep]}" → "{processFunction(matrix, pairs[activeStep]).result}"
                  </h4>
                  <div className={cn("px-2 py-0.5 rounded text-xs", getRuleColor(currentRule.type))}>
                    {currentRule.type.toUpperCase()}
                  </div>
                </div>
                
                {/* Compact horizontal transformation */}
                <div className="flex items-center justify-center gap-4 bg-muted/20 rounded-lg p-3">
                  {/* Input */}
                  <div className="text-center">
                    <div className="font-mono text-2xl text-blue-400">{pairs[activeStep]}</div>
                    <div className="text-xs text-muted-foreground">
                      ({highlightedCells[0]?.[0]},{highlightedCells[0]?.[1]}) ({highlightedCells[1]?.[0]},{highlightedCells[1]?.[1]})
                    </div>
                  </div>
                  
                  {/* Arrow with rule */}
                  <div className="flex flex-col items-center">
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    <span className={cn("text-xs", getRuleColor(currentRule.type).split(" ")[0])}>
                      {currentRule.description}
                    </span>
                  </div>
                  
                  {/* Output */}
                  <div className="text-center">
                    <div className="font-mono text-2xl text-green-400">
                      {processFunction(matrix, pairs[activeStep]).result}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ({resultCells[0]?.[0]},{resultCells[0]?.[1]}) ({resultCells[1]?.[0]},{resultCells[1]?.[1]})
                    </div>
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
