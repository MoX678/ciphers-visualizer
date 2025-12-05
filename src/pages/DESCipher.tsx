import { useState, useEffect, useMemo } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Info, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// DES Tables
const IP: number[] = [
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6,
  64, 56, 48, 40, 32, 24, 16, 8,
  57, 49, 41, 33, 25, 17, 9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7
];

const FP: number[] = [
  40, 8, 48, 16, 56, 24, 64, 32,
  39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25
];

const E: number[] = [
  32, 1, 2, 3, 4, 5,
  4, 5, 6, 7, 8, 9,
  8, 9, 10, 11, 12, 13,
  12, 13, 14, 15, 16, 17,
  16, 17, 18, 19, 20, 21,
  20, 21, 22, 23, 24, 25,
  24, 25, 26, 27, 28, 29,
  28, 29, 30, 31, 32, 1
];

const P: number[] = [
  16, 7, 20, 21, 29, 12, 28, 17,
  1, 15, 23, 26, 5, 18, 31, 10,
  2, 8, 24, 14, 32, 27, 3, 9,
  19, 13, 30, 6, 22, 11, 4, 25
];

const S_BOXES: number[][][] = [
  // S1
  [
    [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
    [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
    [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
    [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
  ],
  // S2
  [
    [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
    [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
    [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
    [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
  ],
  // S3
  [
    [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
    [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
    [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
    [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
  ],
  // S4
  [
    [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
    [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
    [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
    [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
  ],
  // S5
  [
    [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
    [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
    [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
    [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
  ],
  // S6
  [
    [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
    [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
    [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
    [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
  ],
  // S7
  [
    [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
    [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
    [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
    [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
  ],
  // S8
  [
    [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
    [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
    [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
    [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
  ]
];

const PC1: number[] = [
  57, 49, 41, 33, 25, 17, 9,
  1, 58, 50, 42, 34, 26, 18,
  10, 2, 59, 51, 43, 35, 27,
  19, 11, 3, 60, 52, 44, 36,
  63, 55, 47, 39, 31, 23, 15,
  7, 62, 54, 46, 38, 30, 22,
  14, 6, 61, 53, 45, 37, 29,
  21, 13, 5, 28, 20, 12, 4
];

const PC2: number[] = [
  14, 17, 11, 24, 1, 5,
  3, 28, 15, 6, 21, 10,
  23, 19, 12, 4, 26, 8,
  16, 7, 27, 20, 13, 2,
  41, 52, 31, 37, 47, 55,
  30, 40, 51, 45, 33, 48,
  44, 49, 39, 56, 34, 53,
  46, 42, 50, 36, 29, 32
];

const SHIFTS: number[] = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

// Helper functions
function stringToBits(str: string): number[] {
  const bits: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const byte = str.charCodeAt(i);
    for (let j = 7; j >= 0; j--) {
      bits.push((byte >> j) & 1);
    }
  }
  return bits;
}

function bitsToString(bits: number[]): string {
  let str = "";
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0);
    }
    str += String.fromCharCode(byte);
  }
  return str;
}

function bitsToHex(bits: number[]): string {
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4; j++) {
      nibble = (nibble << 1) | (bits[i + j] || 0);
    }
    hex += nibble.toString(16).toUpperCase();
  }
  return hex;
}

function hexToBits(hex: string): number[] {
  const bits: number[] = [];
  for (const char of hex) {
    const nibble = parseInt(char, 16);
    for (let j = 3; j >= 0; j--) {
      bits.push((nibble >> j) & 1);
    }
  }
  return bits;
}

function permute(bits: number[], table: number[]): number[] {
  return table.map(pos => bits[pos - 1]);
}

function xor(a: number[], b: number[]): number[] {
  return a.map((bit, i) => bit ^ b[i]);
}

function leftShift(bits: number[], shifts: number): number[] {
  return [...bits.slice(shifts), ...bits.slice(0, shifts)];
}

// Key Schedule
function generateSubkeys(key: string): number[][] {
  let keyBits = stringToBits(key.padEnd(8, '\0').slice(0, 8));
  while (keyBits.length < 64) keyBits.push(0);
  
  const permutedKey = permute(keyBits, PC1);
  let C = permutedKey.slice(0, 28);
  let D = permutedKey.slice(28, 56);
  
  const subkeys: number[][] = [];
  
  for (let i = 0; i < 16; i++) {
    C = leftShift(C, SHIFTS[i]);
    D = leftShift(D, SHIFTS[i]);
    const combined = [...C, ...D];
    subkeys.push(permute(combined, PC2));
  }
  
  return subkeys;
}

// Feistel function
function feistel(R: number[], subkey: number[]): { result: number[]; expanded: number[]; xored: number[]; sboxOutputs: number[][] } {
  const expanded = permute(R, E);
  const xored = xor(expanded, subkey);
  
  const sboxOutputs: number[][] = [];
  let sboxResult: number[] = [];
  
  for (let i = 0; i < 8; i++) {
    const block = xored.slice(i * 6, (i + 1) * 6);
    const row = (block[0] << 1) | block[5];
    const col = (block[1] << 3) | (block[2] << 2) | (block[3] << 1) | block[4];
    const val = S_BOXES[i][row][col];
    const output = [(val >> 3) & 1, (val >> 2) & 1, (val >> 1) & 1, val & 1];
    sboxOutputs.push(output);
    sboxResult = [...sboxResult, ...output];
  }
  
  const result = permute(sboxResult, P);
  return { result, expanded, xored, sboxOutputs };
}

// Step types for visualization
type DESStepType = "initial" | "ip" | "round" | "swap" | "fp" | "final";

interface DESStep {
  name: string;
  description: string;
  type: DESStepType;
  round?: number;
  L: number[];
  R: number[];
  subkey?: number[];
  expanded?: number[];
  xored?: number[];
  sboxOutputs?: number[][];
  feistelOutput?: number[];
}

function desEncryptWithSteps(plaintext: string, key: string): DESStep[] {
  const steps: DESStep[] = [];
  let inputBits = stringToBits(plaintext.padEnd(8, '\0').slice(0, 8));
  while (inputBits.length < 64) inputBits.push(0);
  
  const subkeys = generateSubkeys(key);
  
  steps.push({
    name: "Initial Input",
    description: "Convert plaintext to 64-bit binary",
    type: "initial",
    L: inputBits.slice(0, 32),
    R: inputBits.slice(32, 64),
  });
  
  const permuted = permute(inputBits, IP);
  let L = permuted.slice(0, 32);
  let R = permuted.slice(32, 64);
  
  steps.push({
    name: "Initial Permutation (IP)",
    description: "Rearrange bits according to IP table",
    type: "ip",
    L: [...L],
    R: [...R],
  });
  
  for (let i = 0; i < 16; i++) {
    const { result: f, expanded, xored, sboxOutputs } = feistel(R, subkeys[i]);
    const newL = R;
    const newR = xor(L, f);
    
    steps.push({
      name: `Round ${i + 1}`,
      description: `L${i+1} = R${i}, R${i+1} = L${i} ⊕ f(R${i}, K${i+1})`,
      type: "round",
      round: i + 1,
      L: [...newL],
      R: [...newR],
      subkey: subkeys[i],
      expanded,
      xored,
      sboxOutputs,
      feistelOutput: f,
    });
    
    L = newL;
    R = newR;
  }
  
  steps.push({
    name: "32-bit Swap",
    description: "Swap L16 and R16 before final permutation",
    type: "swap",
    L: [...R],
    R: [...L],
  });
  
  const combined = [...R, ...L];
  const cipherBits = permute(combined, FP);
  
  steps.push({
    name: "Final Permutation (FP)",
    description: "Apply inverse of initial permutation to get ciphertext",
    type: "fp",
    L: cipherBits.slice(0, 32),
    R: cipherBits.slice(32, 64),
  });
  
  return steps;
}

function desDecryptWithSteps(ciphertext: string, key: string): DESStep[] {
  const steps: DESStep[] = [];
  let inputBits = stringToBits(ciphertext.padEnd(8, '\0').slice(0, 8));
  while (inputBits.length < 64) inputBits.push(0);
  
  const subkeys = generateSubkeys(key);
  
  steps.push({
    name: "Initial Ciphertext",
    description: "Convert ciphertext to 64-bit binary",
    type: "initial",
    L: inputBits.slice(0, 32),
    R: inputBits.slice(32, 64),
  });
  
  const permuted = permute(inputBits, IP);
  let L = permuted.slice(0, 32);
  let R = permuted.slice(32, 64);
  
  steps.push({
    name: "Initial Permutation (IP)",
    description: "Rearrange bits according to IP table",
    type: "ip",
    L: [...L],
    R: [...R],
  });
  
  // For decryption, use subkeys in reverse order
  for (let i = 0; i < 16; i++) {
    const { result: f, expanded, xored, sboxOutputs } = feistel(R, subkeys[15 - i]);
    const newL = R;
    const newR = xor(L, f);
    
    steps.push({
      name: `Round ${i + 1}`,
      description: `L${i+1} = R${i}, R${i+1} = L${i} ⊕ f(R${i}, K${16-i}) [Key ${16-i}]`,
      type: "round",
      round: i + 1,
      L: [...newL],
      R: [...newR],
      subkey: subkeys[15 - i],
      expanded,
      xored,
      sboxOutputs,
      feistelOutput: f,
    });
    
    L = newL;
    R = newR;
  }
  
  steps.push({
    name: "32-bit Swap",
    description: "Swap L16 and R16 before final permutation",
    type: "swap",
    L: [...R],
    R: [...L],
  });
  
  const combined = [...R, ...L];
  const plainBits = permute(combined, FP);
  
  steps.push({
    name: "Final Permutation (FP)",
    description: "Apply inverse of initial permutation to get plaintext",
    type: "fp",
    L: plainBits.slice(0, 32),
    R: plainBits.slice(32, 64),
  });
  
  return steps;
}

// Components
function BitBlock({ bits, label, color = "primary" }: { bits: number[]; label: string; color?: string }) {
  const colorClasses = {
    primary: "bg-primary/10 border-primary/50 text-primary",
    secondary: "bg-secondary/10 border-secondary/50 text-secondary",
    green: "bg-green-500/10 border-green-500/50 text-green-400",
    orange: "bg-orange-500/10 border-orange-500/50 text-orange-400",
    purple: "bg-purple-500/10 border-purple-500/50 text-purple-400",
    blue: "bg-blue-500/10 border-blue-500/50 text-blue-400",
  };
  
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn("font-mono text-sm px-2 py-1 rounded border", colorClasses[color as keyof typeof colorClasses] || colorClasses.primary)}>
        {bitsToHex(bits)}
      </div>
    </div>
  );
}

function FeistelDiagram({ step }: { step: DESStep }) {
  if (!step.expanded || !step.xored || !step.sboxOutputs || !step.subkey) return null;
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-purple-400 text-center">Feistel Function Detail</h4>
      
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
        <BitBlock bits={step.R} label="R (32 bits)" color="blue" />
        <span className="text-muted-foreground">→</span>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Expansion (E)</div>
          <div className="font-mono text-xs px-2 py-1 rounded bg-orange-500/10 border border-orange-500/50 text-orange-400">
            {bitsToHex(step.expanded)}
          </div>
        </div>
        <span className="text-muted-foreground">⊕</span>
        <BitBlock bits={step.subkey} label={`K${step.round}`} color="green" />
      </div>
      
      <div className="flex justify-center">
        <div className="text-2xl text-purple-400">↓</div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-2">S-Box Substitution (8 boxes × 6→4 bits)</div>
        <div className="flex justify-center gap-1 flex-wrap">
          {step.sboxOutputs.map((output, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] text-muted-foreground">S{i + 1}</div>
              <div className="font-mono text-xs px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
                {bitsToHex(output)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <div className="text-2xl text-purple-400">↓</div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-muted-foreground mb-1">P-Box Permutation → f(R, K)</div>
        <div className="font-mono text-sm px-3 py-1 rounded bg-purple-500/20 border border-purple-500/50 text-purple-400 inline-block">
          {step.feistelOutput ? bitsToHex(step.feistelOutput) : ""}
        </div>
      </div>
    </div>
  );
}

export default function DESCipher() {
  const [inputText, setInputText] = useState("HELLO123");
  const [key, setKey] = useState("SECRETKY");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const paddedInput = inputText.padEnd(8, '\0').slice(0, 8);
  const paddedKey = key.padEnd(8, '\0').slice(0, 8);

  const steps = useMemo(() => {
    if (mode === "encrypt") {
      return desEncryptWithSteps(paddedInput, paddedKey);
    } else {
      // For decrypt, first encrypt to get ciphertext, then show decrypt steps
      const encSteps = desEncryptWithSteps(paddedInput, paddedKey);
      const lastStep = encSteps[encSteps.length - 1];
      const cipherBits = [...lastStep.L, ...lastStep.R];
      const ciphertext = bitsToString(cipherBits);
      return desDecryptWithSteps(ciphertext, paddedKey);
    }
  }, [paddedInput, paddedKey, mode]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
  }, [paddedInput, paddedKey, mode]);

  const finalOutput = useMemo(() => {
    if (steps.length === 0) return "";
    const lastStep = steps[steps.length - 1];
    const bits = [...lastStep.L, ...lastStep.R];
    return bitsToHex(bits);
  }, [steps]);

  const startAnimation = () => {
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(0);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
  };

  const goToPrevStep = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
  };

  useEffect(() => {
    if (!isAnimating || activeStep < 0) return;

    if (activeStep >= steps.length - 1) {
      setIsAnimating(false);
      return;
    }

    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAnimating, activeStep, steps.length]);

  const currentStep = hasAnimated ? (activeStep >= 0 ? steps[activeStep] : steps[steps.length - 1]) : null;
  const displayStep = activeStep >= 0 ? activeStep : steps.length - 1;

  return (
    <CipherLayout
      title="DES Encryption"
      description="Data Encryption Standard - 64-bit block cipher with 56-bit key"
    >
      <div className="w-full space-y-4">
        {/* Top Row - 2 columns: Controls + Step Navigation */}
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
                    <DialogTitle>How DES Encryption Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2">📊 DES Parameters</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Block: <span className="text-primary">64 bits</span></li>
                          <li>Key: <span className="text-primary">56 bits</span> effective</li>
                          <li>Rounds: <span className="text-primary">16</span></li>
                          <li>Structure: <span className="text-primary">Feistel</span></li>
                        </ul>
                      </div>

                      <div className="bg-muted/20 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2">🔄 Feistel Function</h4>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                          <li><span className="text-orange-400">E:</span> 32→48 bits</li>
                          <li><span className="text-green-400">XOR:</span> with subkey</li>
                          <li><span className="text-purple-400">S-boxes:</span> 48→32 bits</li>
                          <li><span className="text-blue-400">P:</span> permutation</li>
                        </ol>
                      </div>

                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 md:col-span-2">
                        <h4 className="font-medium text-yellow-400 mb-1">⚠️ Security Note</h4>
                        <p className="text-muted-foreground">
                          DES is insecure (56-bit key). Use <span className="text-primary">AES</span> for secure applications.
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext (8 bytes)" : "Input Text"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 8))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter 8 characters..."
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground mt-1">{inputText.length}/8 bytes</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Key (64 bits)
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value.slice(0, 8))}
                  className="w-full bg-input border border-secondary rounded-lg px-4 py-3 pr-12 font-mono text-lg text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Enter 8 char key..."
                  maxLength={8}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">56 effective bits</p>
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

            {/* Output preview */}
            <div className={cn(
              "rounded-lg p-3 border pt-4 border-t",
              mode === "decrypt" 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-primary/10 border-primary/30"
            )}>
              <div className="flex items-center justify-between mb-2">
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
                      setMode(mode === "encrypt" ? "decrypt" : "encrypt");
                      resetAnimation();
                    }}
                  >
                    {mode === "encrypt" ? "→ Decrypt" : "→ Encrypt"}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Hex</div>
                  <div className={cn(
                    "font-mono text-sm break-all",
                    mode === "decrypt" ? "text-green-500" : "text-primary"
                  )}>
                    {hasAnimated ? finalOutput : "Click Animate"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ASCII</div>
                  <div className={cn(
                    "font-mono text-sm",
                    mode === "decrypt" ? "text-green-500" : "text-primary"
                  )}>
                    {hasAnimated && steps.length > 0 ? bitsToString([...steps[steps.length - 1].L, ...steps[steps.length - 1].R]).replace(/[\x00-\x1F\x7F-\xFF]/g, '·') : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Step Navigation & L/R display */}
          <div className="glass-card p-5 space-y-4">
            {hasAnimated ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPrevStep}
                    disabled={activeStep <= 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center flex-1">
                <div className="text-sm font-semibold text-foreground truncate">
                  {currentStep?.name || "Final State"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Step {displayStep + 1}/{steps.length}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextStep}
                disabled={activeStep >= steps.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((displayStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* L and R halves */}
            {currentStep && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs font-medium text-blue-400 mb-1">Left (L)</div>
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
                    <div className="font-mono text-sm text-blue-400">
                      {bitsToHex(currentStep.L)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">32 bits</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-orange-400 mb-1">Right (R)</div>
                  <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-3">
                    <div className="font-mono text-sm text-orange-400">
                      {bitsToHex(currentStep.R)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">32 bits</div>
                  </div>
                </div>
              </div>
            )}

            {/* Subkey display */}
            {currentStep?.subkey && (
              <div className="text-center pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Round Key K{currentStep.round} (48 bits)
                </div>
                <div className="font-mono text-xs px-2 py-1 rounded bg-green-500/10 border border-green-500/50 text-green-400 inline-block">
                  {bitsToHex(currentStep.subkey)}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {currentStep?.description}
            </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <p className="text-sm italic">Click Animate to see DES steps</p>
              </div>
            )}
          </div>
        </div>

        {/* Feistel Detail - Full Width (only for round steps) */}
        {currentStep?.type === "round" && <FeistelDiagram step={currentStep} />}

        {/* DES Structure - Full Width */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">DES Round Structure</h3>
          <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
            <div className="px-2 py-1 rounded bg-muted text-foreground">Plaintext</div>
            <span className="text-muted-foreground">→</span>
            <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400">IP</div>
            <span className="text-muted-foreground">→</span>
            <div className="border border-dashed border-purple-500/50 rounded px-2 py-1">
              <span className="text-purple-400">16 × Feistel</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">Swap</div>
            <span className="text-muted-foreground">→</span>
            <div className="px-2 py-1 rounded bg-green-500/20 text-green-400">FP</div>
            <span className="text-muted-foreground">→</span>
            <div className="px-2 py-1 rounded bg-primary text-primary-foreground">Cipher</div>
          </div>
        </div>

        {/* Steps Timeline - Full Width */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">All Steps</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveStep(idx);
                  setIsAnimating(false);
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded transition-all flex items-center gap-2",
                  idx === displayStep
                    ? "bg-primary/20 border border-primary"
                    : idx < displayStep
                    ? "bg-muted/30 border border-transparent"
                    : "bg-transparent border border-transparent hover:bg-muted/20"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0",
                  idx === displayStep ? "bg-primary text-primary-foreground" :
                  idx < displayStep ? "bg-muted-foreground/50 text-background" :
                  "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  step.type === "round" ? "bg-purple-400" :
                  step.type === "ip" ? "bg-blue-400" :
                  step.type === "fp" ? "bg-green-400" :
                  step.type === "swap" ? "bg-orange-400" :
                  "bg-gray-400"
                )} />
                <span className="text-xs text-foreground truncate">{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
