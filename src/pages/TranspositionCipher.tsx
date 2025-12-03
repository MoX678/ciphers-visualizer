import { useState, useEffect, useMemo } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Info } from "lucide-react";
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
    
    return grid.map(row => row.join("")).join("");
  }
}

export default function TranspositionCipher() {
  const [inputText, setInputText] = useState("ATTACKPOSTPONEDUNTILLTWOAM");
  const [key, setKey] = useState("4312567");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [showTutorial, setShowTutorial] = useState(true);
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
    setActiveStep(1);
    setOutputText("");
    // Initialize empty decrypt grid for decryption mode
    if (mode === "decrypt") {
      setDecryptGrid(Array.from({ length: numRows }, () => Array(keyLen).fill("")));
    }
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setActiveStep(-1);
    setOutputText(transpose(inputText, key, mode === "decrypt"));
    setDecryptGrid([]);
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

  useEffect(() => {
    if (isKeyValid) {
      setOutputText(transpose(inputText, key, mode === "decrypt"));
      setDecryptGrid([]);
    }
  }, [inputText, key, mode, isKeyValid]);

  // Get column highlight status based on the key number
  const getColumnStatus = (colIndex: number) => {
    if (!isAnimating) return "idle";
    const keyNumber = columnOrder[colIndex];
    if (keyNumber === activeStep) return "active";
    if (keyNumber < activeStep) return "done";
    return "idle";
  };

  // Get the current grid to display (for decrypt, use the progressively filled grid)
  const displayGrid = useMemo(() => {
    if (mode === "decrypt" && isAnimating && decryptGrid.length > 0) {
      return decryptGrid;
    }
    return grid;
  }, [mode, isAnimating, decryptGrid, grid]);

  // Get cell status for decryption visualization
  const getCellStatus = (rowIndex: number, colIndex: number) => {
    if (!isAnimating) return "idle";
    
    if (mode === "decrypt") {
      const keyNumber = columnOrder[colIndex];
      if (keyNumber === activeStep) return "filling";
      if (keyNumber < activeStep) return "filled";
      return "empty";
    } else {
      // Encryption mode
      const keyNumber = columnOrder[colIndex];
      if (keyNumber === activeStep) return "active";
      if (keyNumber < activeStep) return "done";
      return "idle";
    }
  };

  return (
    <CipherLayout
      title="Row Transposition Cipher"
      description="Rearranges plaintext by writing in rows and reading columns by numeric key order"
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
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">{cleanInput.length} characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numeric Key (e.g., 4312567)
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
                placeholder="Enter numeric key..."
              />
              <p className={cn("text-xs mt-1", isKeyValid ? "text-muted-foreground" : "text-red-400")}>
                {isKeyValid 
                  ? `${keyLen} columns • Key must contain digits 1-${keyLen} without repeats`
                  : "Invalid: must be digits 1-n (e.g., 4312567 uses 1,2,3,4,5,6,7)"
                }
              </p>
            </div>
          </div>

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
        </div>

        {/* Progress */}
        {isAnimating && (
          <div className="glass-card p-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                {mode === "encrypt" 
                  ? "Reading columns in order: 1, 2, 3, ..." 
                  : "Filling columns in order: 1, 2, 3, ..."}
              </span>
              <span>Column {Math.min(activeStep, keyLen)} / {keyLen}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  mode === "decrypt" ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${((activeStep - 1) / keyLen) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Grid Visualization */}
        {isKeyValid && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">
              {mode === "encrypt" ? "Transposition Grid" : "Decryption Grid"}
              {mode === "decrypt" && isAnimating && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Filling columns in order 1, 2, 3...)
                </span>
              )}
            </h3>

            {/* Ciphertext breakdown for decryption */}
            {mode === "decrypt" && (
              <div className="bg-muted/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Ciphertext split into {keyLen} groups of {numRows} characters each:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: keyLen }, (_, i) => {
                    const startPos = i * numRows;
                    const chunk = paddedText.slice(startPos, startPos + numRows);
                    const colIndex = columnOrder.indexOf(i + 1);
                    const status = getColumnStatus(colIndex);
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded px-3 py-2 transition-all duration-300",
                          status === "active" && "bg-green-500/20 border border-green-500 shadow-[0_0_10px_hsl(142,76%,36%,0.5)]",
                          status === "done" && "bg-muted/50 border border-muted-foreground/30",
                          status === "idle" && "bg-muted/30 border border-border"
                        )}
                      >
                        <div className="text-xs text-secondary mb-1">
                          → Col "{i + 1}" (pos {colIndex + 1})
                        </div>
                        <div className={cn(
                          "font-mono text-lg tracking-widest",
                          status === "active" && "text-green-400",
                          status === "done" && "text-muted-foreground",
                          status === "idle" && "text-foreground"
                        )}>
                          {chunk}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="mx-auto border-collapse">
                {/* Key row - the numeric key */}
                <thead>
                  <tr>
                    <th className="w-12 h-10 border border-transparent text-sm text-muted-foreground font-normal">
                      Key:
                    </th>
                    {columnOrder.map((num, i) => (
                      <th
                        key={`key-${i}`}
                        className={cn(
                          "w-12 h-12 border border-border font-mono text-xl font-bold transition-all duration-300",
                          getColumnStatus(i) === "active" && (mode === "decrypt" 
                            ? "bg-green-500/30 border-green-500 text-green-400 shadow-[0_0_15px_hsl(142,76%,36%,0.5)]"
                            : "bg-secondary/30 border-secondary text-secondary shadow-[0_0_15px_hsl(var(--secondary)/0.5)]"),
                          getColumnStatus(i) === "done" && (mode === "decrypt"
                            ? "bg-green-500/10 border-green-500/50 text-green-400/70"
                            : "bg-secondary/10 border-secondary/50 text-secondary/70")
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
                      <td className="w-12 h-10 border border-transparent text-xs text-muted-foreground text-right pr-2">
                        Row {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const cellStatus = getCellStatus(rowIndex, colIndex);
                        return (
                          <td
                            key={`cell-${rowIndex}-${colIndex}`}
                            className={cn(
                              "w-12 h-12 border border-border font-mono text-lg text-center transition-all duration-300",
                              mode === "decrypt" && cellStatus === "filling" && "bg-green-500/20 border-green-500 text-green-400 animate-pulse",
                              mode === "decrypt" && cellStatus === "filled" && "bg-green-500/10 border-green-500/50 text-foreground",
                              mode === "decrypt" && cellStatus === "empty" && "bg-muted/20 text-muted-foreground/30",
                              mode === "encrypt" && cellStatus === "active" && "bg-primary/20 border-primary text-primary animate-pulse",
                              mode === "encrypt" && cellStatus === "done" && "bg-muted/50 text-muted-foreground"
                            )}
                          >
                            {mode === "decrypt" && isAnimating ? (cell || "·") : cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reading/Filling order explanation */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {mode === "encrypt" ? "Read columns in order:" : "Fill columns in order:"}
              </span>
              {Array.from({ length: keyLen }, (_, i) => i + 1).map((readOrder) => {
                const colIndex = columnOrder.indexOf(readOrder);
                const status = getColumnStatus(colIndex);
                return (
                  <span
                    key={readOrder}
                    className={cn(
                      "font-mono px-3 py-1 rounded border transition-all duration-300",
                      status === "active" && (mode === "decrypt"
                        ? "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_hsl(142,76%,36%,0.5)]"
                        : "bg-primary/20 border-primary text-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"),
                      status === "done" && "bg-muted border-muted-foreground/30 text-muted-foreground",
                      status === "idle" && "border-border text-foreground"
                    )}
                  >
                    {readOrder}
                  </span>
                );
              })}
            </div>

            {/* Decryption: Show row reading after grid is filled */}
            {mode === "decrypt" && !isAnimating && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Read rows left to right to get plaintext:
                </p>
                <div className="space-y-2">
                  {grid.map((row, rowIndex) => {
                    // For decrypt display, we need the decrypted grid
                    const decryptedGrid = (() => {
                      const g: string[][] = Array.from({ length: numRows }, () => Array(keyLen).fill(""));
                      let pos = 0;
                      for (let readOrder = 1; readOrder <= keyLen; readOrder++) {
                        const colIdx = columnOrder.indexOf(readOrder);
                        for (let r = 0; r < numRows; r++) {
                          g[r][colIdx] = paddedText[pos++];
                        }
                      }
                      return g;
                    })();
                    
                    return (
                      <div key={rowIndex} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16">Row {rowIndex + 1}:</span>
                        <div className="flex gap-1">
                          {decryptedGrid[rowIndex].map((char, colIndex) => (
                            <span
                              key={colIndex}
                              className="w-8 h-8 flex items-center justify-center bg-primary/10 border border-primary/30 rounded font-mono text-primary"
                            >
                              {char}
                            </span>
                          ))}
                        </div>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-mono text-primary">{decryptedGrid[rowIndex].join("")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current step explanation */}
        {isAnimating && activeStep >= 1 && activeStep <= keyLen && (
          <div className={cn(
            "glass-card p-6",
            mode === "decrypt" ? "border-green-500/50" : "border-primary/50"
          )}>
            <h3 className={cn(
              "text-lg font-semibold mb-3",
              mode === "decrypt" ? "text-green-400" : "text-primary"
            )}>
              Step {activeStep}: {mode === "encrypt" ? "Reading" : "Filling"} Column with Key Number {activeStep}
            </h3>
            <div className="space-y-3">
              {mode === "encrypt" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Finding the column labeled "<span className="text-secondary font-mono font-bold">{activeStep}</span>" 
                    in the key row, then reading all letters in that column from top to bottom.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-muted-foreground">Column position:</span>
                    <span className="font-mono text-primary">{columnOrder.indexOf(activeStep) + 1}</span>
                    <span className="text-sm text-muted-foreground">→ Letters:</span>
                    <span className="font-mono text-primary tracking-widest">
                      {grid.map(row => row[columnOrder.indexOf(activeStep)]).join("")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Taking the next {numRows} characters from ciphertext and filling them into the column labeled "<span className="text-green-400 font-mono font-bold">{activeStep}</span>".
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-2">Characters from ciphertext:</div>
                      <div className="font-mono text-xl text-green-400 tracking-widest">
                        {paddedText.slice((activeStep - 1) * numRows, activeStep * numRows)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        (positions {(activeStep - 1) * numRows + 1} - {activeStep * numRows})
                      </div>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-2">Filling into column:</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Key number</span>
                        <span className="font-mono text-xl text-green-400">{activeStep}</span>
                        <span className="text-sm text-muted-foreground">→ position</span>
                        <span className="font-mono text-xl text-green-400">{columnOrder.indexOf(activeStep) + 1}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Output */}
        {isKeyValid && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              {mode === "encrypt" ? "Ciphertext" : "Plaintext"} Output
            </h3>
            
            {mode === "decrypt" && isAnimating ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  After filling all columns, read rows left-to-right:
                </p>
                <div className="bg-muted/20 rounded-lg p-4">
                  {decryptGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground w-12">Row {rowIndex + 1}:</span>
                      <div className="flex gap-1">
                        {row.map((char, colIndex) => (
                          <span
                            key={colIndex}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center rounded font-mono text-sm transition-all",
                              char ? "bg-green-500/20 border border-green-500/50 text-green-400" : "bg-muted/30 text-muted-foreground/30"
                            )}
                          >
                            {char || "·"}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="font-mono text-green-400">{row.filter(c => c).join("")}</span>
                    </div>
                  ))}
                </div>
                <div className="font-mono text-2xl tracking-widest text-primary break-all pt-2 border-t border-border">
                  {decryptGrid.map(row => row.join("")).join("")}
                </div>
              </div>
            ) : (
              <>
                <div className="font-mono text-2xl tracking-widest text-primary break-all">
                  {transpose(inputText, key, mode === "decrypt")}
                </div>
                
                {/* Show grouped by columns for encryption */}
                {mode === "encrypt" && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Grouped by column reads:</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: keyLen }, (_, readOrder) => {
                        const colIndex = columnOrder.indexOf(readOrder + 1);
                        const columnChars = grid.map(row => row[colIndex]).join("");
                        return (
                          <div key={readOrder} className="bg-muted/30 rounded px-2 py-1">
                            <span className="text-xs text-secondary">Col {readOrder + 1}: </span>
                            <span className="font-mono text-foreground">{columnChars}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Result Summary */}
        {isKeyValid && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Plaintext" : "Ciphertext"}
                </div>
                <div className="font-mono text-lg text-foreground break-all">
                  {cleanInput}
                </div>
              </div>
              <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/30">
                <div className="text-sm text-muted-foreground mb-2">Numeric Key</div>
                <div className="font-mono text-lg text-secondary tracking-widest">
                  {columnOrder.join("")}
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                <div className="text-sm text-muted-foreground mb-2">
                  {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
                </div>
                <div className="font-mono text-lg text-primary break-all">
                  {transpose(inputText, key, mode === "decrypt")}
                </div>
              </div>
            </div>
          </div>
        )}

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
              {mode === "encrypt" ? (
                <>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">📝 Encryption Steps</h4>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                      <li>Write the <span className="text-secondary">numeric key</span> across the top as column headers</li>
                      <li>Write the plaintext in rows beneath the key (pad with X if needed)</li>
                      <li>Read columns in numeric order: first column labeled "1", then "2", then "3", etc.</li>
                      <li>Concatenate the column contents to get the ciphertext</li>
                    </ol>
                  </div>

                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                    <h4 className="font-medium text-foreground mb-2">🔑 Example with Key "4312567"</h4>
                    <div className="space-y-1 text-muted-foreground font-mono text-xs">
                      <p>Key:       <span className="text-secondary">4 3 1 2 5 6 7</span></p>
                      <p>Row 1:     a t t a c k p</p>
                      <p>Row 2:     o s t p o n e</p>
                      <p>Row 3:     d u n t i l l</p>
                      <p>Row 4:     t w o a m x x</p>
                      <p className="pt-2 text-foreground">
                        Read order: Col "1" → ttno, Col "2" → apta, Col "3" → tsuw, ...
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-muted/20 rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">🔓 Decryption Steps</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Set up the grid with the numeric key columns</li>
                    <li>Calculate how many characters go in each column (rows × 1)</li>
                    <li>Fill column "1" first, then "2", then "3", etc.</li>
                    <li>Read the rows left-to-right to recover the plaintext</li>
                  </ol>
                </div>
              )}

              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                <h4 className="font-medium text-yellow-400 mb-2">⚠️ Key Format</h4>
                <p className="text-muted-foreground">
                  The key must contain digits 1 through n without repeats. For example:
                </p>
                <ul className="list-disc list-inside mt-2 text-muted-foreground">
                  <li><span className="text-green-400 font-mono">4312567</span> ✓ Valid (contains 1-7)</li>
                  <li><span className="text-green-400 font-mono">312</span> ✓ Valid (contains 1-3)</li>
                  <li><span className="text-red-400 font-mono">4312467</span> ✗ Invalid (missing 5, has two 4s)</li>
                  <li><span className="text-red-400 font-mono">4589</span> ✗ Invalid (not sequential from 1)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </CipherLayout>
  );
}
