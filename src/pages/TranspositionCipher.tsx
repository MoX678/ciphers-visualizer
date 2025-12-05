import { useState, useEffect, useMemo } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Info, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Parse numeric key like "4312567" into column order
function parseNumericKey(key: string): number[] {
  const digits = key.replace(/[^0-9]/g, "").split("").map(Number);
  // Validate: must contain digits 1 to n without duplicates
  const n = digits.length;
  const sorted = [...digits].sort((a, b) => a - b);
  const isValid = sorted.every((d, i) => d === i + 1);
  return isValid ? digits : [];
}

function transpose(text: string, key: string, decrypt: boolean): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  const columnOrder = parseNumericKey(key);
  const keyLen = columnOrder.length;
  
  if (keyLen === 0 || cleanText.length === 0) return cleanText;

  const numRows = Math.ceil(cleanText.length / keyLen);
  const paddedText = cleanText.padEnd(numRows * keyLen, "X");

  if (!decrypt) {
    // Encrypt: write rows left-to-right, read columns in key order
    const grid: string[][] = [];
    for (let r = 0; r < numRows; r++) {
      grid.push(paddedText.slice(r * keyLen, (r + 1) * keyLen).split(""));
    }
    
    let result = "";
    // Read columns in order 1, 2, 3... (find column position for each)
    for (let readOrder = 1; readOrder <= keyLen; readOrder++) {
      const colIndex = columnOrder.indexOf(readOrder);
      for (let r = 0; r < numRows; r++) {
        result += grid[r][colIndex];
      }
    }
    return result;
  } else {
    // Decrypt: fill columns in key order, read rows
    const grid: string[][] = Array.from({ length: numRows }, () => Array(keyLen).fill(""));
    let pos = 0;
    
    for (let readOrder = 1; readOrder <= keyLen; readOrder++) {
      const colIndex = columnOrder.indexOf(readOrder);
      for (let r = 0; r < numRows; r++) {
        grid[r][colIndex] = paddedText[pos++];
      }
    }
    
    // Remove trailing X padding
    const result = grid.map(row => row.join("")).join("");
    return result.replace(/X+$/, "");
  }
}

export default function TranspositionCipher() {
  const [inputText, setInputText] = useState("ATTACKPOSTPONEDUNTILLTWOAM");
  const [key, setKey] = useState("4312567");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [decryptGrid, setDecryptGrid] = useState<string[][]>([]);

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const columnOrder = useMemo(() => parseNumericKey(key), [key]);
  const keyLen = columnOrder.length;
  const numRows = keyLen > 0 ? Math.ceil(cleanInput.length / keyLen) : 0;
  const paddedText = cleanInput.padEnd(numRows * keyLen, "X");

  const isKeyValid = keyLen > 0;

  // Build the grid
  const grid = useMemo(() => {
    if (keyLen === 0) return [];
    const g: string[][] = [];
    for (let r = 0; r < numRows; r++) {
      g.push(paddedText.slice(r * keyLen, (r + 1) * keyLen).split(""));
    }
    return g;
  }, [paddedText, keyLen, numRows]);

  const startAnimation = () => {
    if (!isKeyValid) return;
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(1);
    setOutputText("");
    // Initialize empty decrypt grid for decryption mode
    if (mode === "decrypt") {
      setDecryptGrid(Array.from({ length: numRows }, () => Array(keyLen).fill("")));
    }
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
    setOutputText("");
    setDecryptGrid([]);
  };

  // Step navigation functions
  const goToStep = (step: number) => {
    if (!isKeyValid || step < 1 || step > keyLen + 1) return;
    setIsAnimating(false);
    setHasAnimated(true);
    setActiveStep(step);

    if (mode === "encrypt") {
      // Calculate output up to this step
      let result = "";
      for (let s = 1; s < step; s++) {
        const colIndex = columnOrder.indexOf(s);
        for (let r = 0; r < numRows; r++) {
          result += grid[r]?.[colIndex] || "";
        }
      }
      setOutputText(result);
    } else {
      // Build decrypt grid up to this step
      const newGrid: string[][] = Array.from({ length: numRows }, () => Array(keyLen).fill(""));
      let pos = 0;
      for (let s = 1; s < step; s++) {
        const colIndex = columnOrder.indexOf(s);
        for (let r = 0; r < numRows; r++) {
          newGrid[r][colIndex] = paddedText[pos++];
        }
      }
      setDecryptGrid(newGrid);
    }
  };

  const goToPrevStep = () => {
    const targetStep = Math.max(1, activeStep - 1);
    goToStep(targetStep);
  };

  const goToNextStep = () => {
    const targetStep = Math.min(keyLen + 1, activeStep + 1);
    goToStep(targetStep);
  };

  useEffect(() => {
    if (!isAnimating || activeStep < 1) return;

    if (activeStep > keyLen) {
      setIsAnimating(false);
      // For decrypt mode, read rows to get output
      if (mode === "decrypt") {
        setOutputText(decryptGrid.map(row => row.join("")).join(""));
      }
      return;
    }

    const timer = setTimeout(() => {
      if (mode === "encrypt") {
        // Encryption: Read columns in order
        const colIndex = columnOrder.indexOf(activeStep);
        let columnData = "";
        for (let r = 0; r < numRows; r++) {
          columnData += grid[r]?.[colIndex] || "";
        }
        setOutputText((prev) => prev + columnData);
      } else {
        // Decryption: Fill columns in order
        const colIndex = columnOrder.indexOf(activeStep);
        const startPos = (activeStep - 1) * numRows;
        setDecryptGrid(prev => {
          const newGrid = prev.map(row => [...row]);
          for (let r = 0; r < numRows; r++) {
            newGrid[r][colIndex] = paddedText[startPos + r] || "";
          }
          return newGrid;
        });
      }
      setActiveStep((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAnimating, activeStep, columnOrder, grid, numRows, keyLen, mode, paddedText, decryptGrid]);

  // Reset animation state when input changes
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
    setOutputText("");
    setDecryptGrid([]);
  }, [inputText, key, mode]);

  // Get column highlight status based on the key number
  const getColumnStatus = (colIndex: number) => {
    if (!hasAnimated) return "idle";
    const keyNumber = columnOrder[colIndex];
    // Animation completed - all columns are done
    if (!isAnimating && activeStep > keyLen) return "done";
    if (keyNumber === activeStep) return "active";
    if (keyNumber < activeStep) return "done";
    return "idle";
  };

  // Get the current grid to display (for decrypt, use the progressively filled grid)
  const displayGrid = useMemo(() => {
    if (mode === "decrypt" && hasAnimated && decryptGrid.length > 0) {
      return decryptGrid;
    }
    return grid;
  }, [mode, hasAnimated, decryptGrid, grid]);

  // Get cell status for visualization
  const getCellStatus = (rowIndex: number, colIndex: number) => {
    if (!hasAnimated) return "idle";
    
    const keyNumber = columnOrder[colIndex];
    
    if (mode === "decrypt") {
      // Animation completed - all cells are filled
      if (!isAnimating && activeStep > keyLen) return "filled";
      if (keyNumber === activeStep) return "filling";
      if (keyNumber < activeStep) return "filled";
      return "empty";
    } else {
      // Encryption mode - reading columns
      // Animation completed - all cells are read
      if (!isAnimating && activeStep > keyLen) return "read";
      if (keyNumber === activeStep) return "reading";
      if (keyNumber < activeStep) return "read";
      return "waiting"; // waiting to be read
    }
  };

  return (
    <CipherLayout
      title="Row Transposition Cipher"
      description="Rearranges plaintext by writing in rows and reading columns by numeric key order"
    >
      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Grid */}
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
                    <DialogTitle>How Row Transposition Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {mode === "encrypt" ? (
                        <>
                          <div className="bg-muted/20 rounded-lg p-3">
                            <h4 className="font-medium text-foreground mb-2">📝 Encryption Steps</h4>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                              <li>Write <span className="text-secondary">numeric key</span> as column headers</li>
                              <li>Write plaintext in rows (pad with X if needed)</li>
                              <li>Read columns in order: 1, 2, 3...</li>
                              <li>Concatenate to get ciphertext</li>
                            </ol>
                          </div>
                          <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                            <h4 className="font-medium text-foreground mb-2">🔑 Example: Key "4312567"</h4>
                            <div className="space-y-0.5 text-muted-foreground font-mono text-[10px]">
                              <p>Key:   <span className="text-secondary">4 3 1 2 5 6 7</span></p>
                              <p>Row 1: a t t a c k p</p>
                              <p>Row 2: o s t p o n e</p>
                              <p className="pt-1 text-foreground">Read: 1→ttno, 2→apta, 3→tsuw...</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-muted/20 rounded-lg p-3 md:col-span-2">
                          <h4 className="font-medium text-foreground mb-2">🔓 Decryption Steps</h4>
                          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Set up grid with key columns</li>
                            <li>Calculate chars per column (rows × 1)</li>
                            <li>Fill column "1", then "2", then "3"...</li>
                            <li>Read rows left-to-right for plaintext</li>
                          </ol>
                        </div>
                      )}
                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 md:col-span-2">
                        <h4 className="font-medium text-yellow-400 mb-1">⚠️ Key Format</h4>
                        <p className="text-muted-foreground">
                          Must contain digits 1-n without repeats: 
                          <span className="text-green-400 font-mono ml-1">4312567</span> ✓ 
                          <span className="text-red-400 font-mono ml-2">4589</span> ✗
                        </p>
                      </div>
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
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">{cleanInput.length} characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numeric Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                className={cn(
                  "w-full bg-input border rounded-lg px-4 py-3 font-mono text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                  isKeyValid 
                    ? "border-secondary text-secondary focus:ring-secondary" 
                    : "border-red-500/50 text-red-400 focus:ring-red-500"
                )}
                placeholder="e.g., 4312567"
              />
              <p className={cn("text-xs mt-1", isKeyValid ? "text-muted-foreground" : "text-red-400")}>
                {isKeyValid 
                  ? `${keyLen} columns • Digits 1-${keyLen}`
                  : "Invalid: must be digits 1-n"
                }
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
              <Button onClick={resetAnimation} variant="outline" size="icon" disabled={!isKeyValid}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress bar */}
            {hasAnimated && (
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{mode === "encrypt" ? "Reading columns" : "Filling columns"}</span>
                  <span>{Math.min(activeStep > keyLen ? keyLen : activeStep - 1, keyLen)} / {keyLen}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-300", mode === "decrypt" ? "bg-green-500" : "bg-primary")}
                    style={{ width: `${(Math.min(activeStep > keyLen ? keyLen : activeStep - 1, keyLen) / keyLen) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Output - shows live during animation */}
            {isKeyValid && (
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
                        const result = transpose(inputText, key, mode === "decrypt");
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
                    ? (isAnimating 
                        ? (mode === "decrypt" ? decryptGrid.map(row => row.join("")).join("") : outputText)
                        : transpose(inputText, key, mode === "decrypt"))
                    : <span className="text-muted-foreground text-sm italic">Click Animate to see result</span>
                  }
                </div>
              </div>
            )}

            {/* Plaintext rows for encryption */}
            {mode === "encrypt" && isKeyValid && (
              <div className="pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-2">
                  Plaintext Rows ({numRows} × {keyLen})
                </div>
                <div className="space-y-1.5">
                  {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-8">R{rowIndex + 1}:</span>
                      <div className="flex gap-0.5">
                        {row.map((char, colIndex) => {
                          const keyNum = columnOrder[colIndex];
                          const status = getColumnStatus(colIndex);
                          return (
                            <span
                              key={colIndex}
                              onClick={() => !isAnimating && goToStep(keyNum)}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center rounded font-mono text-sm border transition-all",
                                !isAnimating && "cursor-pointer hover:bg-muted/50",
                                status === "active" && "bg-primary/20 border-primary text-primary animate-pulse",
                                status === "done" && "bg-primary/10 border-primary/50 text-foreground",
                                status === "idle" && "bg-muted/20 border-border text-muted-foreground/50"
                              )}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="font-mono text-foreground">{row.join("")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ciphertext groups for decryption */}
            {mode === "decrypt" && isKeyValid && (
              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">
                  Ciphertext Groups ({keyLen} × {numRows} chars)
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: keyLen }, (_, i) => {
                    const startPos = i * numRows;
                    const chunk = paddedText.slice(startPos, startPos + numRows);
                    const colIndex = columnOrder.indexOf(i + 1);
                    const status = getColumnStatus(colIndex);
                    return (
                      <div 
                        key={i}
                        onClick={() => !isAnimating && goToStep(i + 1)}
                        className={cn(
                          "rounded px-1.5 py-0.5 transition-all text-xs",
                          !isAnimating && "cursor-pointer hover:bg-muted/50",
                          status === "active" && "bg-green-500/20 border border-green-500",
                          status === "done" && "bg-muted/50 border border-muted-foreground/30",
                          status === "idle" && "bg-muted/30 border border-border"
                        )}
                      >
                        <span className="text-secondary text-[10px]">{i + 1}: </span>
                        <span className={cn(
                          "font-mono",
                          status === "active" && "text-green-400",
                          status === "done" && "text-muted-foreground",
                          status === "idle" && "text-foreground"
                        )}>
                          {chunk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right - Grid Visualization & Steps */}
          <div className="glass-card p-5 space-y-4">
            {isKeyValid ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    {mode === "encrypt" ? "Transposition Grid" : "Decryption Grid"}
                  </h3>
                  {hasAnimated && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevStep}
                        disabled={activeStep <= 1 || isAnimating}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-1">
                        {activeStep > keyLen ? "Done" : `Step ${activeStep}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextStep}
                        disabled={activeStep > keyLen || isAnimating}
                        className="h-6 w-6 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Encryption Grid - shows table with key row */}
                {mode === "encrypt" && (
                  <div className="overflow-x-auto">
                    <table className="mx-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="w-8 h-8 border border-transparent text-xs text-muted-foreground font-normal"></th>
                          {columnOrder.map((num, i) => (
                            <th
                              key={`key-${i}`}
                              onClick={() => !isAnimating && goToStep(num)}
                              className={cn(
                                "w-9 h-9 border border-border font-mono text-base font-bold transition-all",
                                !isAnimating && "cursor-pointer hover:bg-muted/50",
                                getColumnStatus(i) === "active" && "bg-secondary/30 border-secondary text-secondary",
                                getColumnStatus(i) === "done" && "bg-secondary/10 border-secondary/50 text-secondary/70"
                              )}
                            >
                              {num}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayGrid.map((row, rowIndex) => (
                          <tr key={`row-${rowIndex}`}>
                            <td className="w-8 h-8 border border-transparent text-xs text-muted-foreground text-right pr-1">
                              {rowIndex + 1}
                            </td>
                            {row.map((cell, colIndex) => {
                              const cellStatus = getCellStatus(rowIndex, colIndex);
                              return (
                                <td
                                  key={`cell-${rowIndex}-${colIndex}`}
                                  onClick={() => !isAnimating && goToStep(columnOrder[colIndex])}
                                  className={cn(
                                    "w-9 h-9 border border-border font-mono text-base text-center transition-all",
                                    !isAnimating && "cursor-pointer hover:bg-muted/50",
                                    cellStatus === "reading" && "bg-primary/20 border-primary text-primary animate-pulse",
                                    cellStatus === "read" && "bg-primary/10 border-primary/50 text-foreground",
                                    cellStatus === "waiting" && "bg-muted/20 text-muted-foreground/50"
                                  )}
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Decryption Grid - Read rows left to right */}
                {mode === "decrypt" && (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground mb-2">
                      Read rows left to right:
                    </div>
                    <div className="space-y-1.5">
                      {decryptGrid.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-12">Row {rowIndex + 1}:</span>
                          <div className="flex gap-0.5">
                            {row.map((char, colIndex) => {
                              const keyNum = columnOrder[colIndex];
                              // Cell is filled when: animation is done OR we're past this column's step
                              const filled = hasAnimated && (!isAnimating || activeStep > keyNum);
                              const filling = hasAnimated && isAnimating && activeStep === keyNum;
                              return (
                                <span
                                  key={colIndex}
                                  onClick={() => !isAnimating && goToStep(keyNum)}
                                  className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded font-mono text-base border transition-all",
                                    !isAnimating && "cursor-pointer hover:bg-muted/50",
                                    filling && "bg-green-500/20 border-green-500 text-green-400 animate-pulse",
                                    filled && !filling && "bg-green-500/10 border-green-500/50 text-foreground",
                                    !filled && !filling && "bg-muted/20 border-border text-muted-foreground/30"
                                  )}
                                >
                                  {(filled || filling) ? char : ""}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="font-mono text-green-400">
                            {hasAnimated && !isAnimating ? row.join("") : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Column order indicator - clickable */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex flex-wrap items-center justify-center gap-1 text-xs">
                    <span className="text-muted-foreground mr-1">
                      {mode === "encrypt" ? "Read:" : "Fill:"}
                    </span>
                    {Array.from({ length: keyLen }, (_, i) => i + 1).map((readOrder) => {
                      const colIndex = columnOrder.indexOf(readOrder);
                      const status = getColumnStatus(colIndex);
                      return (
                        <span
                          key={readOrder}
                          onClick={() => !isAnimating && goToStep(readOrder)}
                          className={cn(
                            "font-mono px-2 py-0.5 rounded border transition-all",
                            !isAnimating && "cursor-pointer hover:bg-muted/50",
                            status === "active" && (mode === "decrypt"
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : "bg-primary/20 border-primary text-primary"),
                            status === "done" && "bg-muted border-muted-foreground/30 text-muted-foreground",
                            status === "idle" && "border-border text-foreground"
                          )}
                        >
                          {readOrder}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Current Step Detail - merged here */}
                {hasAnimated && activeStep >= 1 && activeStep <= keyLen && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className={cn(
                      "text-sm font-medium mb-3 flex items-center gap-2",
                      mode === "decrypt" ? "text-green-400" : "text-primary"
                    )}>
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        mode === "decrypt" ? "bg-green-500/20 border border-green-500/50" : "bg-primary/20 border border-primary/50"
                      )}>
                        {activeStep}
                      </span>
                      <span>
                        {mode === "encrypt" ? "Reading" : "Filling"} Column #{activeStep}
                        <span className="text-muted-foreground font-normal ml-1">(Position {columnOrder.indexOf(activeStep) + 1})</span>
                      </span>
                    </div>
                    
                    {mode === "encrypt" && (
                      // Enhanced encryption visualization
                      <div className="space-y-3">
                        {/* Visual column reading */}
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Column {columnOrder.indexOf(activeStep) + 1}</div>
                            <div className="flex flex-col gap-0.5">
                              {grid.map((row, rowIdx) => (
                                <span
                                  key={rowIdx}
                                  className="w-8 h-8 flex items-center justify-center bg-primary/20 border border-primary rounded font-mono text-primary animate-pulse"
                                >
                                  {row[columnOrder.indexOf(activeStep)]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-2xl text-muted-foreground">→</div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Read Down</div>
                            <div className="font-mono text-xl text-primary tracking-widest">
                              {grid.map(row => row[columnOrder.indexOf(activeStep)]).join("")}
                            </div>
                          </div>
                        </div>
                        
                        {/* Output building */}
                        <div className="pt-2 border-t border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Ciphertext building:</div>
                          <div className="font-mono text-sm">
                            <span className="text-muted-foreground">{outputText}</span>
                            <span className="text-primary animate-pulse">
                              {grid.map(row => row[columnOrder.indexOf(activeStep)]).join("")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {mode === "decrypt" && (
                      // Show current characters being filled - vertical
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-xs text-muted-foreground">Filling with:</div>
                        <div className="flex flex-col gap-0.5">
                          {paddedText.slice((activeStep - 1) * numRows, activeStep * numRows).split("").map((char, i) => (
                            <span
                              key={i}
                              className="w-8 h-8 flex items-center justify-center bg-green-500/20 border border-green-500 rounded font-mono text-green-400 animate-pulse"
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                        <div className="text-2xl text-muted-foreground">→</div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">Column {columnOrder.indexOf(activeStep) + 1}</div>
                          <div className="font-mono text-xl text-green-400 tracking-widest">
                            {paddedText.slice((activeStep - 1) * numRows, activeStep * numRows)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Done message */}
                {hasAnimated && !isAnimating && activeStep > keyLen && (
                  <div className="mt-4 pt-4 border-t border-border text-center">
                    <span className="text-sm text-muted-foreground">
                      ✓ {mode === "encrypt" ? "Encryption" : "Decryption"} complete!
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                Enter a valid numeric key (e.g., 4312567)
              </div>
            )}
          </div>
        </div>

        {}
      </div>
    </CipherLayout>
  );
}
