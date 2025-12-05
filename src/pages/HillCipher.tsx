import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { LetterBox } from "@/components/LetterBox";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Matrix operations
function matrixMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => 
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// Calculate modular inverse using extended Euclidean algorithm
function modInverse(a: number, m: number): number {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return -1; // No inverse exists
}

// Calculate determinant for 2x2 matrix
function determinant2x2(matrix: number[][]): number {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

// Calculate inverse matrix mod 26 for 2x2
function inverseMatrix2x2(matrix: number[][]): number[][] | null {
  const det = mod(determinant2x2(matrix), 26);
  const detInv = modInverse(det, 26);
  
  if (detInv === -1) return null; // No inverse exists
  
  return [
    [mod(matrix[1][1] * detInv, 26), mod(-matrix[0][1] * detInv, 26)],
    [mod(-matrix[1][0] * detInv, 26), mod(matrix[0][0] * detInv, 26)]
  ];
}

function hillEncrypt(text: string, keyMatrix: number[][]): string {
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  // Pad with X if needed
  const paddedText = cleanText.length % 2 === 0 ? cleanText : cleanText + "X";
  
  let result = "";
  for (let i = 0; i < paddedText.length; i += 2) {
    const vector = [
      ALPHABET.indexOf(paddedText[i]),
      ALPHABET.indexOf(paddedText[i + 1])
    ];
    const encrypted = matrixMultiply(keyMatrix, vector).map(v => mod(v, 26));
    result += ALPHABET[encrypted[0]] + ALPHABET[encrypted[1]];
  }
  return result;
}

function hillDecrypt(text: string, keyMatrix: number[][]): string {
  const inverseKey = inverseMatrix2x2(keyMatrix);
  if (!inverseKey) return "INVALID KEY";
  
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, "");
  
  let result = "";
  for (let i = 0; i < cleanText.length; i += 2) {
    if (i + 1 >= cleanText.length) break;
    const vector = [
      ALPHABET.indexOf(cleanText[i]),
      ALPHABET.indexOf(cleanText[i + 1])
    ];
    const decrypted = matrixMultiply(inverseKey, vector).map(v => mod(v, 26));
    result += ALPHABET[decrypted[0]] + ALPHABET[decrypted[1]];
  }
  return result;
}

export default function HillCipher() {
  const [inputText, setInputText] = useState("HELP");
  const [keyMatrix, setKeyMatrix] = useState([
    [3, 3],
    [2, 5]
  ]);
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [outputText, setOutputText] = useState("");
  const [currentCalculation, setCurrentCalculation] = useState<{
    inputPair: string;
    inputVector: number[];
    resultVector: number[];
    outputPair: string;
    matrixUsed: number[][];
    rawResults: number[];
  } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<{
    inputPair: string;
    inputVector: number[];
    resultVector: number[];
    outputPair: string;
    matrixUsed: number[][];
    rawResults: number[];
  }[]>([]);

  const cleanInput = inputText.toUpperCase().replace(/[^A-Z]/g, "");
  const paddedInput = cleanInput.length % 2 === 0 ? cleanInput : cleanInput + "X";
  const totalSteps = Math.ceil(paddedInput.length / 2);
  
  const processText = mode === "encrypt" ? hillEncrypt : hillDecrypt;
  const inverseKey = inverseMatrix2x2(keyMatrix);
  const isValidKey = inverseKey !== null;

  const startAnimation = () => {
    if (!isValidKey && mode === "decrypt") {
      return;
    }
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(0);
    setOutputText("");
    setCompletedSteps([]);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
    setCurrentCalculation(null);
    setCompletedSteps([]);
    setOutputText("");
  };

  // Navigate to a specific step
  const goToStep = (step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setIsAnimating(false);
    setActiveStep(step);
    
    // Calculate all steps up to this point
    const matrixUsed = mode === "encrypt" ? keyMatrix : inverseKey!;
    const newCompletedSteps: typeof completedSteps = [];
    let output = "";
    
    for (let i = 0; i <= step; i++) {
      const idx = i * 2;
      const char1 = paddedInput[idx];
      const char2 = paddedInput[idx + 1] || "X";
      const inputVector = [ALPHABET.indexOf(char1), ALPHABET.indexOf(char2)];
      const rawResults = matrixMultiply(matrixUsed, inputVector);
      const resultVector = rawResults.map(v => mod(v, 26));
      const outputPair = ALPHABET[resultVector[0]] + ALPHABET[resultVector[1]];
      
      newCompletedSteps.push({
        inputPair: char1 + char2,
        inputVector,
        resultVector,
        outputPair,
        matrixUsed,
        rawResults
      });
      output += outputPair;
    }
    
    setCompletedSteps(newCompletedSteps);
    setOutputText(output);
    setCurrentCalculation(newCompletedSteps[step]);
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

    if (activeStep >= totalSteps) {
      setIsAnimating(false);
      // Keep the last step's calculation visible
      if (completedSteps.length > 0) {
        setCurrentCalculation(completedSteps[completedSteps.length - 1]);
        setActiveStep(totalSteps - 1);
      }
      return;
    }

    const idx = activeStep * 2;
    const char1 = paddedInput[idx];
    const char2 = paddedInput[idx + 1] || "X";
    const inputVector = [ALPHABET.indexOf(char1), ALPHABET.indexOf(char2)];
    
    const matrixUsed = mode === "encrypt" ? keyMatrix : inverseKey!;
    const rawResults = matrixMultiply(matrixUsed, inputVector);
    const resultVector = rawResults.map(v => mod(v, 26));
    const outputPair = ALPHABET[resultVector[0]] + ALPHABET[resultVector[1]];

    const stepData = {
      inputPair: char1 + char2,
      inputVector,
      resultVector,
      outputPair,
      matrixUsed,
      rawResults
    };

    setCurrentCalculation(stepData);

    const timer = setTimeout(() => {
      setOutputText((prev) => prev + outputPair);
      setCompletedSteps((prev) => [...prev, stepData]);
      setActiveStep((prev) => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, activeStep]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
    setCurrentCalculation(null);
    setCompletedSteps([]);
    setOutputText("");
  }, [inputText, keyMatrix, mode]);

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const num = parseInt(value) || 0;
    const newMatrix = keyMatrix.map((r, i) => 
      r.map((c, j) => (i === row && j === col) ? mod(num, 26) : c)
    );
    setKeyMatrix(newMatrix);
  };

  return (
    <CipherLayout
      title="Hill Cipher"
      description="Matrix-based encryption using linear algebra"
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
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>How Hill Cipher Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Visual Flow Diagram */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-foreground mb-3 text-center">Encryption Process Flow</h4>
                      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 font-mono">HE</div>
                          <span className="text-[10px] text-muted-foreground">Pair</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-blue-500/30 text-blue-300 font-mono">[7,4]</div>
                          <span className="text-[10px] text-muted-foreground">Numbers</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-purple-500/20 text-purple-400 font-mono">K×V</div>
                          <span className="text-[10px] text-muted-foreground">Multiply</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-orange-500/20 text-orange-400 font-mono">[33,34]</div>
                          <span className="text-[10px] text-muted-foreground">Raw</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-green-500/20 text-green-400 font-mono">mod 26</div>
                          <span className="text-[10px] text-muted-foreground">Wrap</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-green-500/30 text-green-300 font-mono">[7,8]</div>
                          <span className="text-[10px] text-muted-foreground">Result</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded bg-primary/20 text-primary font-mono font-bold">HI</div>
                          <span className="text-[10px] text-muted-foreground">Output</span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-purple-400 mb-2">Matrix Multiplication</h4>
                        <div className="font-mono text-muted-foreground space-y-1 text-xs">
                          <p>Result[0] = K[0,0]×V[0] + K[0,1]×V[1]</p>
                          <p>Result[1] = K[1,0]×V[0] + K[1,1]×V[1]</p>
                        </div>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-green-400 mb-2">Why Mod 26?</h4>
                        <p className="text-muted-foreground text-xs">
                          26 letters (A-Z). Modulo wraps results to 0-25 range for letter mapping.
                        </p>
                        <p className="text-muted-foreground mt-1 font-mono text-xs">33 mod 26 = 7 → H</p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-medium text-secondary mb-2">Key Requirements</h4>
                        <ul className="text-muted-foreground space-y-1 text-xs">
                          <li>• Square matrix (2×2)</li>
                          <li>• det(K) coprime with 26</li>
                          <li>• Values 0-25</li>
                        </ul>
                      </div>
                    </div>

                    {/* Decryption Note */}
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                      <h4 className="text-sm font-medium text-primary mb-1">🔓 Decryption</h4>
                      <p className="text-sm text-muted-foreground">
                        To decrypt, multiply by the <strong className="text-foreground">inverse matrix</strong> (K⁻¹) instead of K.
                        The inverse "undoes" encryption: K⁻¹ × (K × V) = V
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
                onChange={(e) => setInputText(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 16))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter message..." : "Enter ciphertext..."}
              />
              {cleanInput.length % 2 !== 0 && mode === "encrypt" && (
                <p className="text-xs text-muted-foreground mt-1">Will pad with 'X'</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Key Matrix (2×2)
              </label>
              <div className="flex items-center gap-2">
                <div className="text-3xl text-muted-foreground">[</div>
                <div className="grid grid-cols-2 gap-2">
                  {keyMatrix.map((row, i) => 
                    row.map((val, j) => (
                      <input
                        key={`${i}-${j}`}
                        type="number"
                        value={val}
                        onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                        className="w-12 h-12 bg-secondary/10 border border-secondary/50 rounded-lg text-center font-mono text-lg text-secondary focus:outline-none focus:ring-2 focus:ring-secondary"
                        min={0}
                        max={25}
                      />
                    ))
                  )}
                </div>
                <div className="text-3xl text-muted-foreground">]</div>
              </div>
              {!isValidKey && (
                <p className="text-xs text-red-500 mt-1">Invalid: no modular inverse</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={isAnimating ? () => setIsAnimating(false) : startAnimation}
                variant="neon"
                className="flex-1"
                disabled={!isValidKey && mode === "decrypt"}
              >
                {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAnimating ? "Pause" : "Animate"}
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Step Navigation */}
            {(activeStep >= 0 || completedSteps.length > 0) && (
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevStep}
                  disabled={activeStep <= 0 || isAnimating}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center flex-1">
                  <div className="text-xs text-muted-foreground">
                    Step {activeStep + 1} of {totalSteps}
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextStep}
                  disabled={activeStep >= totalSteps - 1 || isAnimating}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Output */}
            <div className={cn(
              "rounded-lg p-3 border mt-4",
              mode === "decrypt" 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-primary/10 border-primary/30"
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
                      "h-6 text-xs px-2",
                      mode === "encrypt"
                        ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                        : "border-primary/50 text-primary hover:bg-primary/10"
                    )}
                    onClick={() => {
                      const result = processText(inputText, keyMatrix);
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
                "font-mono text-lg tracking-widest",
                mode === "decrypt" ? "text-green-500" : "text-primary"
              )}>
                {hasAnimated 
                  ? (isAnimating ? outputText : processText(inputText, keyMatrix))
                  : "Click Animate to see result"}
              </div>
            </div>

            {/* Key Matrix Information */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-foreground mb-3">Key Matrix Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/5 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-secondary mb-2">Encryption Matrix</h5>
                  <div className="flex items-center gap-2 font-mono">
                    <div className="text-lg text-muted-foreground">[</div>
                    <div className="grid grid-cols-2 gap-1">
                      {keyMatrix.map((row, i) => 
                        row.map((val, j) => (
                          <div key={`enc-${i}-${j}`} className="w-7 h-7 bg-secondary/10 rounded flex items-center justify-center text-sm text-secondary">
                            {val}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="text-lg text-muted-foreground">]</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    det = {mod(determinant2x2(keyMatrix), 26)} (mod 26)
                  </p>
                </div>
                
                <div className="bg-primary/5 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-primary mb-2">Decryption Matrix</h5>
                  {inverseKey ? (
                    <>
                      <div className="flex items-center gap-2 font-mono">
                        <div className="text-lg text-muted-foreground">[</div>
                        <div className="grid grid-cols-2 gap-1">
                          {inverseKey.map((row, i) => 
                            row.map((val, j) => (
                              <div key={`dec-${i}-${j}`} className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center text-sm text-primary">
                                {Math.round(val)}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="text-lg text-muted-foreground">]</div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        K × K⁻¹ ≡ I (mod 26)
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-red-500">
                      No inverse exists
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right - Visualization */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {mode === "encrypt" ? "Encryption" : "Decryption"} Process
            </h3>

            {/* Progress */}
            {isAnimating && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>Pair {activeStep + 1} / {totalSteps}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Input pairs */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Input Pairs</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                  const idx = stepIdx * 2;
                  const char1 = paddedInput[idx];
                  const char2 = paddedInput[idx + 1] || "X";
                  const isActive = stepIdx === activeStep;
                  const isProcessed = stepIdx <= activeStep && activeStep >= 0;
                  
                  return (
                    <button 
                      key={stepIdx}
                      onClick={() => !isAnimating && goToStep(stepIdx)}
                      disabled={isAnimating}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded transition-all cursor-pointer hover:bg-muted/30",
                        isActive && "bg-primary/20 ring-1 ring-primary",
                        isProcessed && !isActive && "bg-muted/50",
                        !isProcessed && "bg-muted/20"
                      )}
                    >
                      <LetterBox letter={char1} variant="input" isActive={isActive} />
                      <LetterBox letter={char2} variant="input" isActive={isActive} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matrix operation indicator */}
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-xs bg-muted/20 px-3 py-1.5 rounded">
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-0.5">[</span>
                  <div className="grid grid-cols-2 gap-0.5">
                    {(mode === "encrypt" ? keyMatrix : inverseKey || keyMatrix).map((row, i) => 
                      row.map((val, j) => (
                        <span 
                          key={`${i}-${j}`} 
                          className={cn(
                            "w-5 h-5 flex items-center justify-center text-[10px] font-mono",
                            mode === "encrypt" ? "text-secondary" : "text-primary"
                          )}
                        >
                          {Math.round(val)}
                        </span>
                      ))
                    )}
                  </div>
                  <span className="text-muted-foreground ml-0.5">]</span>
                </div>
                <span className="text-muted-foreground">×</span>
                <span className={cn(
                  "font-mono",
                  hasAnimated && currentCalculation 
                    ? "text-blue-400" 
                    : "text-muted-foreground"
                )}>
                  {hasAnimated && currentCalculation 
                    ? `[${currentCalculation.inputVector.join(",")}]` 
                    : "[v]"}
                </span>
                <span className="text-muted-foreground">mod 26</span>
                {hasAnimated && currentCalculation && (
                  <>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-primary font-mono">
                      [{currentCalculation.resultVector.join(",")}]
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Output pairs - Only show when animation has started */}
            {hasAnimated && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Output Pairs</p>
                <div className="flex flex-wrap gap-2">
                  {outputText.length > 0 ? (
                    Array.from({ length: Math.ceil(outputText.length / 2) }).map((_, stepIdx) => {
                      const idx = stepIdx * 2;
                      const char1 = outputText[idx];
                      const char2 = outputText[idx + 1];
                      if (!char1) return null;
                      
                      const isCurrentStep = stepIdx === activeStep;
                      
                      return (
                        <button 
                          key={stepIdx}
                          onClick={() => goToStep(stepIdx)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded transition-all cursor-pointer hover:bg-muted/30",
                            isCurrentStep && "bg-primary/20 ring-1 ring-primary"
                          )}
                        >
                          <LetterBox letter={char1} variant="output" />
                          {char2 && <LetterBox letter={char2} variant="output" />}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Processing...</span>
                  )}
                </div>
              </div>
            )}

            {/* Current calculation detail - Integrated */}
            {currentCalculation && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-primary mb-3">
                  Step {activeStep + 1}: "{currentCalculation.inputPair}" → "{currentCalculation.outputPair}"
                </h4>
                
                {/* Compact 4-step horizontal layout */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Step 1: Letter to Number */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">1</span>
                      Letters → Numbers
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1].map((i) => (
                        <div key={i} className="text-center">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-base font-bold text-blue-400">
                            {currentCalculation.inputPair[i]}
                          </div>
                          <div className="text-xs text-muted-foreground my-0.5">↓</div>
                          <div className="w-7 h-7 rounded bg-blue-500/30 flex items-center justify-center text-xs font-mono text-blue-300">
                            {currentCalculation.inputVector[i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Matrix × Vector */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px]">2</span>
                      Matrix × Vector
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      <div className="grid grid-cols-2 gap-0.5">
                        {currentCalculation.matrixUsed.flat().map((val, i) => (
                          <div key={i} className="w-5 h-5 flex items-center justify-center rounded bg-purple-500/20 text-purple-400 text-[10px]">
                            {Math.round(val)}
                          </div>
                        ))}
                      </div>
                      <span className="text-purple-400 text-sm">×</span>
                      <div className="flex flex-col gap-0.5">
                        {currentCalculation.inputVector.map((v, i) => (
                          <div key={i} className="w-5 h-5 flex items-center justify-center rounded bg-blue-500/20 text-blue-400 text-[10px]">
                            {v}
                          </div>
                        ))}
                      </div>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-orange-400 font-mono text-sm">[{currentCalculation.rawResults.join(",")}]</span>
                    </div>
                  </div>

                  {/* Step 3: Mod 26 */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px]">3</span>
                      Mod 26
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1].map((i) => (
                        <div key={i} className="text-center">
                          <div className="text-xs font-mono text-orange-400">{currentCalculation.rawResults[i]}</div>
                          <div className="text-[10px] text-green-400">mod 26</div>
                          <div className="w-7 h-7 rounded bg-green-500/20 border border-green-500 flex items-center justify-center text-xs font-mono text-green-400 mt-0.5">
                            {currentCalculation.resultVector[i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Numbers → Letters */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px]">4</span>
                      Numbers → Letters
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1].map((i) => (
                        <div key={i} className="text-center">
                          <div className="w-7 h-7 rounded bg-green-500/20 flex items-center justify-center text-xs font-mono text-green-400">
                            {currentCalculation.resultVector[i]}
                          </div>
                          <div className="text-xs text-muted-foreground my-0.5">↓</div>
                          <div className="w-9 h-9 rounded-lg bg-primary/20 border-2 border-primary flex items-center justify-center text-base font-bold text-primary">
                            {currentCalculation.outputPair[i]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row calculation breakdown */}
                <div className="mt-3 text-xs space-y-1.5">
                  {[0, 1].map((row) => (
                    <div key={row} className="flex items-center gap-1 justify-center flex-wrap">
                      <span className="text-muted-foreground w-12">Row {row + 1}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        {Math.round(currentCalculation.matrixUsed[row][0])}
                      </span>
                      <span className="text-muted-foreground">×</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        {currentCalculation.inputVector[0]}
                      </span>
                      <span className="text-muted-foreground">+</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        {Math.round(currentCalculation.matrixUsed[row][1])}
                      </span>
                      <span className="text-muted-foreground">×</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                        {currentCalculation.inputVector[1]}
                      </span>
                      <span className="text-muted-foreground">=</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                        {currentCalculation.rawResults[row]}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">
                        {currentCalculation.resultVector[row]}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                        {currentCalculation.outputPair[row]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
