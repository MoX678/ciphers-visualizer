import { useState, useEffect, useMemo } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Info } from "lucide-react";
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
  return pairs.map(pair => decryptPair(matrix, pair).result).join("");
}

export default function PlayfairCipher() {
  const [inputText, setInputText] = useState("HELLO WORLD");
  const [keyword, setKeyword] = useState("MONARCHY");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentRule, setCurrentRule] = useState<RuleType | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<number[][]>([]);
  const [resultCells, setResultCells] = useState<number[][]>([]);

  const matrix = useMemo(() => generateMatrix(keyword), [keyword]);
  const pairs = useMemo(() => 
    mode === "encrypt" 
      ? preparePlaintext(inputText) 
      : prepareCiphertext(inputText),
    [inputText, mode]
  );

  const processFunction = mode === "encrypt" ? encryptPair : decryptPair;

  const startAnimation = () => {
    setIsAnimating(true);
    setActiveStep(0);
    setOutputText("");
    setCurrentRule(null);
    setHighlightedCells([]);
    setResultCells([]);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setActiveStep(-1);
    setOutputText(mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword));
    setCurrentRule(null);
    setHighlightedCells([]);
    setResultCells([]);
  };

  useEffect(() => {
    if (!isAnimating || activeStep < 0) return;

    if (activeStep >= pairs.length) {
      setIsAnimating(false);
      setHighlightedCells([]);
      setResultCells([]);
      setCurrentRule(null);
      return;
    }

    const pair = pairs[activeStep];
    const { result, rule, positions } = processFunction(matrix, pair);
    
    // Calculate result positions
    const [r1, c1] = positions[0];
    const [r2, c2] = positions[1];
    let resPositions: number[][];
    
    if (rule.type === "row") {
      const shift = mode === "encrypt" ? 1 : 4;
      resPositions = [[r1, (c1 + shift) % 5], [r2, (c2 + shift) % 5]];
    } else if (rule.type === "column") {
      const shift = mode === "encrypt" ? 1 : 4;
      resPositions = [[(r1 + shift) % 5, c1], [(r2 + shift) % 5, c2]];
    } else {
      resPositions = [[r1, c2], [r2, c1]];
    }

    setHighlightedCells(positions);
    setResultCells(resPositions);
    setCurrentRule(rule);

    const timer = setTimeout(() => {
      setOutputText((prev) => prev + result);
      setActiveStep((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAnimating, activeStep, pairs, matrix, processFunction, mode]);

  useEffect(() => {
    setOutputText(mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword));
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Controls */}
        <div className="glass-card p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext Message" : "Ciphertext Message"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: J is treated as I in Playfair cipher
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                Used to generate the 5×5 matrix
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
              variant="neon"
              className="flex-1"
            >
              {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isAnimating ? "Pause" : "Animate"}
            </Button>
            <Button onClick={resetAnimation} variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        {isAnimating && (
          <div className="glass-card p-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Processing digraphs (letter pairs)</span>
              <span>Pair {Math.min(activeStep + 1, pairs.length)} / {pairs.length}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(activeStep / pairs.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Digraph Pairs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {mode === "encrypt" ? "Plaintext" : "Ciphertext"} Digraphs (Letter Pairs)
          </h3>
          <div className="flex flex-wrap gap-2">
            {pairs.map((pair, i) => (
              <div
                key={i}
                className={cn(
                  "px-3 py-2 rounded-lg border font-mono text-lg transition-all duration-300",
                  i === activeStep && "bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)] scale-110",
                  i < activeStep && "bg-muted/50 border-muted-foreground/30 text-muted-foreground",
                  i > activeStep && "border-border text-foreground"
                )}
              >
                {pair}
              </div>
            ))}
          </div>
          {mode === "encrypt" && (
            <p className="text-xs text-muted-foreground mt-3">
              * X inserted between repeated letters or at end if odd length
            </p>
          )}
        </div>

        {/* 5x5 Matrix */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Playfair Key Matrix (5×5)
          </h3>
          <p className="text-sm text-muted-foreground">
            Generated from keyword: <span className="text-secondary font-mono">{keyword || "(empty)"}</span>
          </p>
          
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
                          "w-12 h-12 flex items-center justify-center font-mono text-xl border transition-all duration-300",
                          isHighlighted && !isResult && "bg-blue-500/30 border-blue-500 text-blue-400 shadow-[0_0_15px_hsl(217,91%,60%,0.5)]",
                          isResult && !isHighlighted && "bg-green-500/30 border-green-500 text-green-400 shadow-[0_0_15px_hsl(142,76%,36%,0.5)]",
                          isHighlighted && isResult && "bg-purple-500/30 border-purple-500 text-purple-400 shadow-[0_0_15px_hsl(270,91%,65%,0.5)]",
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

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500"></div>
              <span className="text-muted-foreground">Input letters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500"></div>
              <span className="text-muted-foreground">Output letters</span>
            </div>
          </div>
        </div>

        {/* Current Step Explanation */}
        {isAnimating && activeStep >= 0 && activeStep < pairs.length && currentRule && (
          <div className={cn("glass-card p-6 border", getRuleColor(currentRule.type))}>
            <h3 className="text-lg font-semibold mb-4">
              Step {activeStep + 1}: Processing "{pairs[activeStep]}"
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">Input Pair</div>
                <div className="font-mono text-3xl text-blue-400">
                  {pairs[activeStep]}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Positions: ({highlightedCells[0]?.[0]},{highlightedCells[0]?.[1]}) & ({highlightedCells[1]?.[0]},{highlightedCells[1]?.[1]})
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 text-center flex flex-col justify-center">
                <div className={cn("text-sm font-medium px-3 py-1 rounded-full inline-block mx-auto", getRuleColor(currentRule.type))}>
                  {currentRule.type.toUpperCase()} RULE
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {currentRule.description}
                </div>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 text-center">
                <div className="text-xs text-muted-foreground mb-2">Output Pair</div>
                <div className="font-mono text-3xl text-green-400">
                  {processFunction(matrix, pairs[activeStep]).result}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Positions: ({resultCells[0]?.[0]},{resultCells[0]?.[1]}) & ({resultCells[1]?.[0]},{resultCells[1]?.[1]})
                </div>
              </div>
            </div>

            {/* Visual rule explanation */}
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              {currentRule.type === "row" && (
                <p className="text-sm text-muted-foreground">
                  Both letters are in the <span className="text-blue-400">same row</span>. 
                  {mode === "encrypt" 
                    ? " Each letter is replaced by the letter to its right (wrapping around)."
                    : " Each letter is replaced by the letter to its left (wrapping around)."}
                </p>
              )}
              {currentRule.type === "column" && (
                <p className="text-sm text-muted-foreground">
                  Both letters are in the <span className="text-green-400">same column</span>. 
                  {mode === "encrypt"
                    ? " Each letter is replaced by the letter below it (wrapping around)."
                    : " Each letter is replaced by the letter above it (wrapping around)."}
                </p>
              )}
              {currentRule.type === "rectangle" && (
                <p className="text-sm text-muted-foreground">
                  Letters form a <span className="text-purple-400">rectangle</span>. 
                  Each letter is replaced by the letter in its row but in the other letter's column.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Output */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            {mode === "encrypt" ? "Ciphertext" : "Plaintext"} Output
          </h3>
          <div className="font-mono text-2xl tracking-widest text-primary break-all">
            {isAnimating ? outputText : (mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword))}
          </div>
          
          {/* Show pair mapping */}
          {!isAnimating && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Pair transformations:</p>
              <div className="flex flex-wrap gap-2">
                {pairs.map((pair, i) => {
                  const { result, rule } = processFunction(matrix, pair);
                  return (
                    <div key={i} className="flex items-center gap-1 bg-muted/30 rounded px-2 py-1">
                      <span className="font-mono text-foreground">{pair}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className={cn("font-mono", getRuleColor(rule.type).split(" ")[0])}>
                        {result}
                      </span>
                      <span className={cn("text-xs px-1 rounded", getRuleColor(rule.type))}>
                        {rule.type[0].toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Result Summary */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Summary</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
              </div>
              <div className="font-mono text-lg text-foreground break-all">
                {inputText.toUpperCase().replace(/[^A-Z]/g, "")}
              </div>
            </div>
            <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
              <div className="text-sm text-muted-foreground mb-2">Keyword</div>
              <div className="font-mono text-lg text-secondary">
                {keyword}
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
              <div className="text-sm text-muted-foreground mb-2">
                {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
              </div>
              <div className="font-mono text-lg text-primary break-all">
                {mode === "encrypt" ? playfairEncrypt(inputText, keyword) : playfairDecrypt(inputText, keyword)}
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">How It Works</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTutorial(!showTutorial)}
            >
              <Info className="w-4 h-4 mr-1" />
              {showTutorial ? "Hide" : "Show"}
            </Button>
          </div>

          {showTutorial && (
            <div className="space-y-4 text-sm">
              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">📝 Key Matrix Generation</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Write the keyword (removing duplicate letters)</li>
                  <li>Fill remaining cells with unused alphabet letters</li>
                  <li>I and J are combined into one cell (I=J)</li>
                </ol>
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">✂️ Preparing the Message</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Split message into pairs of letters (digraphs)</li>
                  <li>If a pair has same letters, insert X between them</li>
                  <li>If odd number of letters, append X at end</li>
                </ol>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className={cn("rounded-lg p-4 border", getRuleColor("row"))}>
                  <h4 className="font-medium mb-2">Row Rule</h4>
                  <p className="text-xs text-muted-foreground">
                    Same row: shift {mode === "encrypt" ? "right" : "left"} (wrap around)
                  </p>
                </div>
                <div className={cn("rounded-lg p-4 border", getRuleColor("column"))}>
                  <h4 className="font-medium mb-2">Column Rule</h4>
                  <p className="text-xs text-muted-foreground">
                    Same column: shift {mode === "encrypt" ? "down" : "up"} (wrap around)
                  </p>
                </div>
                <div className={cn("rounded-lg p-4 border", getRuleColor("rectangle"))}>
                  <h4 className="font-medium mb-2">Rectangle Rule</h4>
                  <p className="text-xs text-muted-foreground">
                    Different row & column: swap column positions
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                <h4 className="font-medium text-yellow-400 mb-2">⚠️ Important Notes</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Letters I and J are treated as the same letter</li>
                  <li>X is used as padding (may appear in decrypted text)</li>
                  <li>Invented by Charles Wheatstone in 1854</li>
                  <li>Named after Lord Playfair who promoted its use</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </CipherLayout>
  );
}
