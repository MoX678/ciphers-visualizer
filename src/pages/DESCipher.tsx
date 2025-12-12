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
  const keyBits = stringToBits(key.padEnd(8, '\0').slice(0, 8));
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
  blockInfo?: {
    currentBlock: number;
    totalBlocks: number;
    blocks: string[];
  };
}

function desEncryptWithSteps(plaintext: string, key: string): DESStep[] {
  const steps: DESStep[] = [];
  const inputBits = stringToBits(plaintext.padEnd(8, '\0').slice(0, 8));
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
  const inputBits = stringToBits(ciphertext.padEnd(8, '\0').slice(0, 8));
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

// Multi-block DES functions
function desEncryptMultiBlock(plaintext: string, key: string): DESStep[] {
  const allSteps: DESStep[] = [];
  const blocks = [];
  
  // Split into 8-byte blocks with padding
  for (let i = 0; i < plaintext.length; i += 8) {
    const block = plaintext.slice(i, i + 8).padEnd(8, '\0');
    blocks.push(block);
  }
  
  // Ensure at least one block
  if (blocks.length === 0) {
    blocks.push(plaintext.padEnd(8, '\0').slice(0, 8));
  }
  
  allSteps.push({
    name: "Block Division",
    description: `Split input into ${blocks.length} block(s) of 8 bytes each`,
    type: "initial",
    L: [],
    R: [],
    blockInfo: { currentBlock: 0, totalBlocks: blocks.length, blocks }
  });
  
  blocks.forEach((block, blockIndex) => {
    const blockSteps = desEncryptWithSteps(block, key);
    blockSteps.forEach((step, stepIndex) => {
      allSteps.push({
        ...step,
        name: `Block ${blockIndex + 1}: ${step.name}`,
        description: `Block ${blockIndex + 1}/${blocks.length}: ${step.description}`,
        blockInfo: { currentBlock: blockIndex, totalBlocks: blocks.length, blocks }
      });
    });
  });
  
  return allSteps;
}

function desDecryptMultiBlock(ciphertext: string, key: string): DESStep[] {
  const allSteps: DESStep[] = [];
  const blocks = [];
  
  // Split into 8-byte blocks
  for (let i = 0; i < ciphertext.length; i += 8) {
    const block = ciphertext.slice(i, i + 8).padEnd(8, '\0');
    blocks.push(block);
  }
  
  // Ensure at least one block
  if (blocks.length === 0) {
    blocks.push(ciphertext.padEnd(8, '\0').slice(0, 8));
  }
  
  allSteps.push({
    name: "Block Division",
    description: `Split ciphertext into ${blocks.length} block(s) of 8 bytes each`,
    type: "initial",
    L: [],
    R: [],
    blockInfo: { currentBlock: 0, totalBlocks: blocks.length, blocks }
  });
  
  blocks.forEach((block, blockIndex) => {
    const blockSteps = desDecryptWithSteps(block, key);
    blockSteps.forEach((step, stepIndex) => {
      allSteps.push({
        ...step,
        name: `Block ${blockIndex + 1}: ${step.name}`,
        description: `Block ${blockIndex + 1}/${blocks.length}: ${step.description}`,
        blockInfo: { currentBlock: blockIndex, totalBlocks: blocks.length, blocks }
      });
    });
  });
  
  return allSteps;
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


export default function DESCipher() {
  const [inputText, setInputText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('des-input-text') || "HELLO WORLD DES!";
    }
    return "HELLO WORLD DES!";
  });
  const [key, setKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('des-key') || "SECRETKY";
    }
    return "SECRETKY";
  });
  const [mode, setMode] = useState<"encrypt" | "decrypt">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('des-mode') as "encrypt" | "decrypt") || "encrypt";
    }
    return "encrypt";
  });
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Save to localStorage when values change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('des-input-text', inputText);
    }
  }, [inputText]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('des-key', key);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('des-mode', mode);
    }
  }, [mode]);

  const paddedInput = inputText; // Don't limit to 8 chars for multi-block
  const paddedKey = key.padEnd(8, '\0').slice(0, 8);

  const steps = useMemo(() => {
    if (mode === "encrypt") {
      return desEncryptMultiBlock(paddedInput, paddedKey);
    } else {
      return desDecryptMultiBlock(paddedInput, paddedKey);
    }
  }, [paddedInput, paddedKey, mode]);

  // Reset animation state when inputs change
  useEffect(() => {
    setHasAnimated(false);
    setActiveStep(-1);
  }, [paddedInput, paddedKey, mode]);

  const finalOutput = useMemo(() => {
    if (steps.length === 0) return "";
    
    // Collect all final block results
    const blockResults = [];
    let currentBlock = -1;
    
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.blockInfo && step.blockInfo.currentBlock !== currentBlock && step.type === "fp") {
        const bits = [...step.L, ...step.R];
        blockResults.unshift(bitsToHex(bits));
        currentBlock = step.blockInfo.currentBlock;
      } else if (!step.blockInfo && step.type === "fp") {
        // Single block mode
        const bits = [...step.L, ...step.R];
        return bitsToHex(bits);
      }
    }
    
    return blockResults.join("");
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
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>How DES Encryption Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Overview */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/30">
                      <h4 className="font-semibold text-lg text-blue-400 mb-2">📘 Overview</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        DES (Data Encryption Standard) is a symmetric-key algorithm that encrypts data in 64-bit blocks using a 56-bit key. 
                        It uses a Feistel network structure with 16 rounds of processing, making it a classic example of substitution-permutation cryptography.
                      </p>
                    </div>

                    {/* Parameters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-muted/20 rounded-lg p-3 border border-border">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <span className="text-lg">📊</span> DES Parameters
                        </h4>
                        <ul className="space-y-1.5 text-muted-foreground">
                          <li className="flex justify-between">
                            <span>Block Size:</span>
                            <span className="text-primary font-semibold">64 bits</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Key Length:</span>
                            <span className="text-primary font-semibold">56 bits (effective)</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Key Input:</span>
                            <span className="text-primary font-semibold">64 bits (8 parity)</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Rounds:</span>
                            <span className="text-primary font-semibold">16</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Structure:</span>
                            <span className="text-primary font-semibold">Feistel Network</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-muted/20 rounded-lg p-3 border border-border">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <span className="text-lg">🔄</span> Feistel Function (f)
                        </h4>
                        <ol className="space-y-1.5 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-orange-400 font-bold">1.</span>
                            <div>
                              <span className="text-orange-400 font-semibold">Expansion (E):</span>
                              <span className="text-xs block">32 bits → 48 bits</span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-400 font-bold">2.</span>
                            <div>
                              <span className="text-green-400 font-semibold">XOR:</span>
                              <span className="text-xs block">Mix with 48-bit subkey</span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-purple-400 font-bold">3.</span>
                            <div>
                              <span className="text-purple-400 font-semibold">S-boxes:</span>
                              <span className="text-xs block">48 bits → 32 bits (8 boxes)</span>
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-400 font-bold">4.</span>
                            <div>
                              <span className="text-blue-400 font-semibold">Permutation (P):</span>
                              <span className="text-xs block">Rearrange 32 bits</span>
                            </div>
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Step by Step Process */}
                    <div className="bg-muted/20 rounded-lg p-4 border border-border">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="text-lg">🔢</span> Encryption Process
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold">1</div>
                          <div>
                            <div className="font-semibold text-foreground">Block Division</div>
                            <div className="text-xs text-muted-foreground">Plaintext converted to 64-bit blocks. Each block split into L (left 32 bits) and R (right 32 bits).</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold">2</div>
                          <div>
                            <div className="font-semibold text-foreground">Initial Permutation (IP)</div>
                            <div className="text-xs text-muted-foreground">Bits rearranged according to IP table for better diffusion. Produces L0 and R0.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 font-bold">3</div>
                          <div>
                            <div className="font-semibold text-foreground">16 Feistel Rounds</div>
                            <div className="text-xs text-muted-foreground">Each round: L<sub>i</sub> = R<sub>i-1</sub>, R<sub>i</sub> = L<sub>i-1</sub> ⊕ f(R<sub>i-1</sub>, K<sub>i</sub>). The f-function combines expansion, key mixing, S-box substitution, and permutation.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold">4</div>
                          <div>
                            <div className="font-semibold text-foreground">32-bit Swap</div>
                            <div className="text-xs text-muted-foreground">After 16 rounds, swap L16 and R16 positions before final permutation.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 font-bold">5</div>
                          <div>
                            <div className="font-semibold text-foreground">Final Permutation (FP)</div>
                            <div className="text-xs text-muted-foreground">Inverse of IP applied to produce final 64-bit ciphertext.</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Warning */}
                    <div className="bg-yellow-500/10 rounded-lg p-4 border-2 border-yellow-500/30">
                      <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                        <span className="text-lg">⚠️</span> Security Note
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        DES is <strong className="text-yellow-400">no longer secure</strong> for modern applications due to its 56-bit key size, 
                        which is vulnerable to brute-force attacks. Use <strong className="text-primary">AES (Advanced Encryption Standard)</strong> with 
                        128-bit, 192-bit, or 256-bit keys for secure encryption. DES is now primarily used for educational purposes and understanding cryptographic principles.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext" : "Input Text"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 32))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter text (blocks of 8 chars)..."
                maxLength={32}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {inputText.length}/32 chars • DES processes in 8-byte blocks
                {inputText.length > 8 && (
                  <span className="text-yellow-400 ml-1">
                    ({Math.ceil(inputText.length / 8)} blocks)
                  </span>
                )}
              </p>
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
                      // Convert final output to ASCII text for decryption
                      if (mode === "encrypt" && steps.length > 0) {
                        // Collect all final block results as ASCII text
                        const blockResults = [];
                        let currentBlock = -1;
                        
                        for (let i = steps.length - 1; i >= 0; i--) {
                          const step = steps[i];
                          if (step.blockInfo && step.blockInfo.currentBlock !== currentBlock && step.type === "fp") {
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.unshift(resultText);
                            currentBlock = step.blockInfo.currentBlock;
                          } else if (!step.blockInfo && step.type === "fp") {
                            // Single block mode
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.push(resultText);
                            break;
                          }
                        }
                        
                        setInputText(blockResults.join(""));
                      } else if (mode === "decrypt" && steps.length > 0) {
                        // Similar logic for decrypt mode
                        const blockResults = [];
                        let currentBlock = -1;
                        
                        for (let i = steps.length - 1; i >= 0; i--) {
                          const step = steps[i];
                          if (step.blockInfo && step.blockInfo.currentBlock !== currentBlock && step.type === "fp") {
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.unshift(resultText);
                            currentBlock = step.blockInfo.currentBlock;
                          } else if (!step.blockInfo && step.type === "fp") {
                            // Single block mode
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.push(resultText);
                            break;
                          }
                        }
                        
                        setInputText(blockResults.join(""));
                      }
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
                    {!isAnimating && hasAnimated ? finalOutput : 
                     hasAnimated && activeStep >= 0 ? (() => {
                       // Show progressive building of result for each step
                       const results = [];
                       let completedBlocks = -1;
                       let currentBlockProgress = "";
                       
                       // Find completed blocks and current block progress
                       for (let i = 0; i <= activeStep && i < steps.length; i++) {
                         const step = steps[i];
                         
                         if (step.blockInfo && step.type === "fp" && step.blockInfo.currentBlock > completedBlocks) {
                           // Block completed
                           completedBlocks = step.blockInfo.currentBlock;
                           const bits = [...step.L, ...step.R];
                           results.push(bitsToHex(bits));
                         } else if (step.blockInfo && step.blockInfo.currentBlock === completedBlocks + 1) {
                           // Current block in progress
                           if (step.type === "round" || step.type === "fp" || step.type === "swap") {
                             const bits = [...step.L, ...step.R];
                             currentBlockProgress = bitsToHex(bits);
                           }
                         }
                       }
                       
                       const currentStep = activeStep >= 0 ? steps[activeStep] : null;
                       const totalBlocks = currentStep?.blockInfo?.totalBlocks || 1;
                       
                       // Combine completed blocks + current progress
                       const completedText = results.join("");
                       
                       // Show current block progress or placeholder
                       let progressText = "";
                       if (currentBlockProgress && completedBlocks + 1 < totalBlocks) {
                         progressText = currentBlockProgress;
                       } else if (results.length < totalBlocks) {
                         progressText = "????????".repeat(Math.max(0, totalBlocks - results.length));
                       }
                       
                       return (
                         <span>
                           <span className={mode === "decrypt" ? "text-green-400" : "text-primary"}>{completedText}</span>
                           {progressText && (
                             <span className={currentBlockProgress ? "text-yellow-400 animate-pulse" : "text-muted-foreground"}>
                               {progressText}
                             </span>
                           )}
                         </span>
                       );
                     })() : 
                     "Click Animate to see result"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">ASCII</div>
                  <div className={cn(
                    "font-mono text-sm",
                    mode === "decrypt" ? "text-green-500" : "text-primary"
                  )}>
                    {!isAnimating && hasAnimated && steps.length > 0 ? 
                      (() => {
                        // Collect all final block results as ASCII text
                        const blockResults = [];
                        let currentBlock = -1;
                        
                        for (let i = steps.length - 1; i >= 0; i--) {
                          const step = steps[i];
                          if (step.blockInfo && step.blockInfo.currentBlock !== currentBlock && step.type === "fp") {
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.unshift(resultText);
                            currentBlock = step.blockInfo.currentBlock;
                          } else if (!step.blockInfo && step.type === "fp") {
                            // Single block mode
                            const bits = [...step.L, ...step.R];
                            const resultText = bitsToString(bits);
                            blockResults.push(resultText);
                            break;
                          }
                        }
                        
                        return blockResults.join("").replace(/[^\u0020-\u007E]/g, '·');
                      })() :
                      hasAnimated && activeStep >= 0 ? (() => {
                        // Show progressive building of ASCII result with current step
                        const results = [];
                        let completedBlocks = -1;
                        let currentBlockProgress = "";
                        
                        // Find completed blocks and current block progress
                        for (let i = 0; i <= activeStep && i < steps.length; i++) {
                          const step = steps[i];
                          
                          if (step.blockInfo && step.type === "fp" && step.blockInfo.currentBlock > completedBlocks) {
                            // Block completed
                            completedBlocks = step.blockInfo.currentBlock;
                            const bits = [...step.L, ...step.R];
                            // eslint-disable-next-line no-control-regex
                            const resultText = bitsToString(bits).replace(/[\x00-\x1F\x7F-\xFF]/g, '·');
                            results.push(resultText);
                          } else if (step.blockInfo && step.blockInfo.currentBlock === completedBlocks + 1) {
                            // Current block in progress
                            if (step.type === "round" || step.type === "fp" || step.type === "swap") {
                              const bits = [...step.L, ...step.R];
                              // eslint-disable-next-line no-control-regex
                              const resultText = bitsToString(bits).replace(/[\x00-\x1F\x7F-\xFF]/g, '·');
                              currentBlockProgress = resultText;
                            }
                          }
                        }
                        
                        const currentStep = activeStep >= 0 ? steps[activeStep] : null;
                        const totalBlocks = currentStep?.blockInfo?.totalBlocks || 1;
                        
                        // Combine completed blocks + current progress
                        const completedText = results.join("");
                        
                        // Show current block progress or placeholder
                        let progressText = "";
                        if (currentBlockProgress && completedBlocks + 1 < totalBlocks) {
                          progressText = currentBlockProgress;
                        } else if (results.length < totalBlocks) {
                          progressText = "········".repeat(Math.max(0, totalBlocks - results.length));
                        }
                        
                        return (
                          <span>
                            <span className={mode === "decrypt" ? "text-green-400" : "text-primary"}>{completedText}</span>
                            {progressText && (
                              <span className={currentBlockProgress ? "text-yellow-400 animate-pulse" : "text-muted-foreground"}>
                                {progressText}
                              </span>
                            )}
                          </span>
                        );
                      })() :
                      "Processing..."}
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
                  {currentStep?.round && ` • Round ${currentStep.round}`}
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

            {/* Show L/R and Key only for non-round steps */}
            {currentStep && currentStep.type !== "round" && (
              <>
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
              </>
            )}
            
            {/* Show key for non-round steps that have a subkey */}
            {currentStep && currentStep.type !== "round" && currentStep.subkey && (
              <div className="text-center pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Round Key K{currentStep.round} (48 bits)
                </div>
                <div className="font-mono text-xs px-2 py-1 rounded bg-green-500/10 border border-green-500/50 text-green-400 inline-block">
                  {bitsToHex(currentStep.subkey)}
                </div>
              </div>
            )}

            {/* Completion State for FP - Show final diagram with completion message */}
            {currentStep && currentStep.type === "fp" && (
              <div className="pt-3 border-t border-border">
                {/* Completion Banner */}
                <div className="mb-3 flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base font-semibold text-green-400">Encryption Complete - All 16 Rounds Processed</span>
                </div>

                {/* Final Output Display */}
                <div className="bg-muted/10 rounded-lg p-6 border border-border">
                  <h4 className="text-sm font-medium text-green-400 text-center mb-4">Final Ciphertext Output</h4>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="px-6 py-4 bg-green-500/10 border-2 border-green-500/50 rounded">
                        <div className="font-mono text-xl text-green-300 font-bold break-all">
                          {bitsToHex([...currentStep.L, ...currentStep.R])}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        After Final Permutation (FP)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Swap Step Visualization */}
            {currentStep && currentStep.type === "swap" && (
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium text-purple-400 text-center mb-3">32-bit Swap Operation</h4>
                <div className="bg-muted/10 rounded-lg p-6 border border-border">
                  <div className="flex justify-center">
                    <div className="relative" style={{ width: '420px', height: '300px' }}>
                      
                      {/* Before Swap - Top */}
                      <div className="absolute top-0 left-0 right-0">
                        <div className="text-xs text-muted-foreground text-center mb-2 font-semibold">Before Swap</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xs font-medium text-blue-400 mb-2">L16</div>
                            <div className="px-6 py-3 bg-blue-500/10 border-2 border-blue-500/50 rounded text-blue-400 font-mono text-lg font-bold">
                              {bitsToHex(currentStep.R).slice(0, 8)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-medium text-orange-400 mb-2">R16</div>
                            <div className="px-6 py-3 bg-orange-500/10 border-2 border-orange-500/50 rounded text-orange-400 font-mono text-lg font-bold">
                              {bitsToHex(currentStep.L).slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Swap Arrows */}
                      <div className="absolute" style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                        <div className="flex items-center gap-3">
                          {/* Left arrow curving right */}
                          <svg width="80" height="60" className="text-blue-500/60">
                            <path d="M 10 10 Q 40 30 70 50" stroke="currentColor" strokeWidth="3" fill="none" />
                            <polygon points="70,50 65,45 75,48 70,55" fill="currentColor" />
                          </svg>
                          
                          {/* Swap icon */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/25 to-purple-500/15 border-2 border-purple-500/60 flex items-center justify-center shadow-lg ring-2 ring-purple-500/30 animate-pulse">
                            <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                          
                          {/* Right arrow curving left */}
                          <svg width="80" height="60" className="text-orange-500/60">
                            <path d="M 70 10 Q 40 30 10 50" stroke="currentColor" strokeWidth="3" fill="none" />
                            <polygon points="10,50 15,45 5,48 10,55" fill="currentColor" />
                          </svg>
                        </div>
                      </div>

                      {/* After Swap - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="text-xs text-muted-foreground text-center mb-2 font-bold">After Swap</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center animate-in slide-in-from-left duration-500">
                            <div className="text-xs font-semibold text-orange-400 mb-2">R16</div>
                            <div className="px-6 py-3 bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-2 border-orange-500/60 rounded-lg text-orange-400 font-mono text-lg font-bold shadow-lg ring-2 ring-orange-500/20 hover:scale-105 transition-transform">
                              {bitsToHex(currentStep.L).slice(0, 8)}
                            </div>
                          </div>
                          <div className="text-center animate-in slide-in-from-right duration-500">
                            <div className="text-xs font-semibold text-blue-400 mb-2">L16</div>
                            <div className="px-6 py-3 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/60 rounded-lg text-blue-400 font-mono text-lg font-bold shadow-lg ring-2 ring-blue-500/20 hover:scale-105 transition-transform">
                              {bitsToHex(currentStep.R).slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                    The 32-bit halves are swapped before the final permutation
                  </div>
                </div>
              </div>
            )}

            {/* Initial Input Visualization */}
            {currentStep && currentStep.type === "initial" && (
              <div className="pt-3 border-t border-border animate-in fade-in duration-500">
                <h4 className="text-sm font-bold text-purple-400 text-center mb-3 uppercase tracking-wider">Block Division</h4>
                <div className="bg-gradient-to-br from-muted/15 to-muted/5 rounded-xl p-4 border-2 border-border shadow-lg">
                  
                  {/* Block Progress */}
                  {currentStep.blockInfo && (
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/60 rounded-lg">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-yellow-400">
                          Block {currentStep.blockInfo.currentBlock + 1} of {currentStep.blockInfo.totalBlocks}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Blocks Grid */}
                  {currentStep.blockInfo && currentStep.blockInfo.blocks && (
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(currentStep.blockInfo.blocks.length, 4)}, 1fr)` }}>
                      {currentStep.blockInfo.blocks.map((block, idx) => {
                        const isActive = idx === currentStep.blockInfo?.currentBlock;
                        const isCompleted = idx < (currentStep.blockInfo?.currentBlock || 0);
                        
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-lg p-3 border-2 transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/60 shadow-lg'
                                : isCompleted
                                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-400/40'
                                : 'bg-muted/20 border-border'
                            }`}
                          >
                            {/* Status badge */}
                            <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isActive
                                ? 'bg-yellow-400 text-black'
                                : isCompleted
                                ? 'bg-green-400 text-black'
                                : 'bg-muted border border-border text-muted-foreground'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>

                            {/* Hex display */}
                            <div className={`font-mono text-xs font-semibold text-center px-2 py-1.5 rounded border ${
                              isActive
                                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                                : isCompleted
                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                : 'bg-muted/30 border-border text-foreground'
                            }`}>
                              {block.split('').map((char, i) => 
                                char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
                              ).join('')}
                            </div>

                            {/* Size */}
                            <div className="text-center mt-1.5">
                              <span className="text-[9px] text-muted-foreground">64 bits</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Initial Permutation (IP) Visualization */}
            {currentStep && currentStep.type === "ip" && (
              <div className="pt-3 border-t border-border animate-in fade-in duration-500">
                <h4 className="text-sm font-bold text-purple-400 text-center mb-3 uppercase tracking-wider">Initial Permutation (IP)</h4>
                <div className="bg-gradient-to-br from-muted/15 to-muted/5 rounded-xl p-6 border-2 border-border shadow-lg">
                  <div className="space-y-6">
                    
                    {/* Permutation Description */}
                    <div className="text-center animate-in zoom-in duration-300">
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/20 to-blue-500/10 border-2 border-blue-500/60 rounded-lg shadow-md ring-2 ring-blue-500/20">
                        <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-sm font-bold text-blue-400">
                          Bits Rearranged According to IP Table
                        </span>
                      </div>
                    </div>

                    {/* Before Permutation */}
                    <div className="animate-in slide-in-from-top duration-500 delay-100">
                      <div className="text-xs text-muted-foreground mb-3 text-center font-bold">Before Permutation</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Original L (Bits 1-32)</div>
                          <div className="px-4 py-3 bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border rounded-lg text-foreground font-mono text-base font-bold shadow-md hover:scale-105 transition-transform">
                            {/* Get the previous step's L value */}
                            {(() => {
                              const prevStep = steps.find(s => s.type === "initial");
                              return prevStep ? bitsToHex(prevStep.L).slice(0, 8) : "--------";
                            })()}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Original R (Bits 33-64)</div>
                          <div className="px-4 py-3 bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-border rounded-lg text-foreground font-mono text-base font-bold shadow-md hover:scale-105 transition-transform">
                            {(() => {
                              const prevStep = steps.find(s => s.type === "initial");
                              return prevStep ? bitsToHex(prevStep.R).slice(0, 8) : "--------";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permutation Process */}
                    <div className="relative py-4">
                      <div className="flex justify-center items-center gap-4">
                        {/* Left curved line */}
                        <svg width="100" height="80" className="text-blue-400/40">
                          <path d="M 10 10 Q 30 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                          <path d="M 30 10 Q 40 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                          <path d="M 50 10 Q 50 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                        </svg>

                        {/* IP Table Icon */}
                        <div className="px-6 py-4 bg-gradient-to-br from-purple-500/25 to-purple-500/15 border-2 border-purple-500/60 rounded-xl shadow-lg ring-2 ring-purple-500/30 animate-pulse">
                          <div className="text-center">
                            <div className="text-sm font-bold text-purple-300 mb-1">IP TABLE</div>
                            <div className="text-xs text-muted-foreground font-medium">64-bit permutation</div>
                          </div>
                        </div>

                        {/* Right curved line */}
                        <svg width="100" height="80" className="text-orange-400/40">
                          <path d="M 50 10 Q 50 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                          <path d="M 70 10 Q 60 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                          <path d="M 90 10 Q 70 40 50 70" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4,4" />
                        </svg>
                      </div>
                      
                      {/* Arrow down */}
                      <div className="flex justify-center mt-2">
                        <svg className="w-6 h-6 text-purple-400" fill="currentColor">
                          <polygon points="3,0 3,14 0,14 6,20 12,14 9,14 9,0" />
                        </svg>
                      </div>
                    </div>

                    {/* After Permutation */}
                    <div className="animate-in slide-in-from-bottom duration-500 delay-200">
                      <div className="text-xs text-muted-foreground mb-3 text-center font-bold">After Permutation</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xs font-semibold text-blue-400 mb-2">Permuted L (L0)</div>
                          <div className="px-6 py-3 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/60 rounded-lg text-blue-400 font-mono text-lg font-bold shadow-lg ring-2 ring-blue-500/20 hover:scale-105 transition-transform">
                            {bitsToHex(currentStep.L).slice(0, 8)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-orange-400 mb-2">Permuted R (R0)</div>
                          <div className="px-6 py-3 bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-2 border-orange-500/60 rounded-lg text-orange-400 font-mono text-lg font-bold shadow-lg ring-2 ring-orange-500/20 hover:scale-105 transition-transform">
                            {bitsToHex(currentStep.R).slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="text-center text-xs text-muted-foreground pt-3 border-t border-border">
                      IP rearranges the 64 input bits to provide better diffusion. These permuted values (L0, R0) enter the 16 rounds.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DES Feistel Network Visualization - App Design */}
            {currentStep?.type === "round" && currentStep.expanded && (
              <div className="pt-3 border-t border-border animate-in fade-in duration-500">
                <h4 className="text-sm font-bold text-purple-400 text-center mb-4 uppercase tracking-wider">Round {currentStep.round} - Feistel Network</h4>
                
                <div className="relative border border-border/50 rounded-xl p-6 bg-gradient-to-br from-muted/10 to-transparent">
                  
                  {/* Input Label */}
                  <div className="absolute left-4 text-sm text-muted-foreground font-medium" style={{ top: '28px' }}>Input</div>
                  
                  {/* Round Label */}
                  <div className="absolute left-4 text-sm text-muted-foreground font-medium" style={{ bottom: '28px' }}>Round {currentStep.round}</div>

                  {/* Main Diagram Container */}
                  <div className="ml-16 mr-4">
                    
                    {/* Top Row - L0 | R0 with values */}
                    <div className="flex">
                      <div className="flex-1 h-14 bg-gradient-to-r from-blue-500/25 to-blue-500/15 border-2 border-blue-500/50 flex flex-col items-center justify-center">
                        <span className="text-blue-400/70 text-xs font-semibold">L<sub>{currentStep.round - 1}</sub></span>
                        <span className="text-blue-400 font-mono font-bold text-sm">
                          {(() => {
                            const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                            return prevRound ? bitsToHex(prevRound.L) : bitsToHex(currentStep.L);
                          })()}
                        </span>
                      </div>
                      <div className="flex-1 h-14 bg-gradient-to-r from-orange-500/25 to-orange-500/15 border-2 border-orange-500/50 border-l-0 flex flex-col items-center justify-center">
                        <span className="text-orange-400/70 text-xs font-semibold">R<sub>{currentStep.round - 1}</sub></span>
                        <span className="text-orange-400 font-mono font-bold text-sm">
                          {(() => {
                            const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                            return prevRound ? bitsToHex(prevRound.R) : bitsToHex(currentStep.R);
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section with connections */}
                    <div className="relative" style={{ height: '220px' }}>
                      
                      {/* Connection lines - proper Feistel structure */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 220" preserveAspectRatio="none">
                        {/* L path: straight down, then horizontal to XOR */}
                        <path d="M 100 0 L 100 100 L 150 100" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="2.5" fill="none" />
                        
                        {/* From XOR output to R4 (goes right then down) */}
                        <path d="M 190 100 L 300 100 L 300 220" stroke="rgba(251, 146, 60, 0.6)" strokeWidth="2.5" fill="none" />
                        
                        {/* R path: down to f-box */}
                        <path d="M 300 0 L 300 45" stroke="rgba(251, 146, 60, 0.6)" strokeWidth="2.5" fill="none" />
                        
                        {/* f-box output horizontal to XOR */}
                        <path d="M 260 75 L 170 100" stroke="rgba(168, 85, 247, 0.7)" strokeWidth="2.5" fill="none" />
                        
                        {/* R continues down (SWAP - becomes L4) */}
                        <path d="M 300 95 L 300 160" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                        <path d="M 300 160 L 100 220" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2.5" fill="none" />
                        
                        {/* Key arrow pointing to f-box */}
                        <path d="M 370 70 L 340 70" stroke="rgba(74, 222, 128, 0.7)" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                        
                        {/* Arrowhead marker */}
                        <defs>
                          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="rgba(74, 222, 128, 0.7)" />
                          </marker>
                        </defs>
                      </svg>

                      {/* XOR Circle */}
                      <div className="absolute z-10" style={{ left: '42%', top: '82px', transform: 'translateX(-50%)' }}>
                        <div className="w-10 h-10 rounded-full border-2 border-blue-400/60 bg-background flex items-center justify-center shadow-lg">
                          <span className="text-blue-400 font-bold text-xl">⊕</span>
                        </div>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium">XOR</span>
                      </div>

                      {/* F-Box */}
                      <div className="absolute" style={{ left: '75%', top: '45px', transform: 'translateX(-50%)' }}>
                        <div className="px-4 py-2 bg-purple-500/20 border-2 border-dashed border-purple-500/60 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-purple-400 font-bold italic text-xl">f</span>
                          <span className="text-purple-400/80 font-mono text-[9px]">
                            {bitsToHex(currentStep.feistelOutput || []).slice(0, 8)}
                          </span>
                        </div>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-medium whitespace-nowrap">f-function</span>
                      </div>

                      {/* Key label */}
                      <div className="absolute" style={{ right: '2%', top: '55px' }}>
                        <div className="flex items-center gap-1 text-green-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <span className="text-xs font-bold">K<sub className="text-[9px]">{currentStep.round}</sub></span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">Subkey</span>
                      </div>

                      {/* Swap label in middle */}
                      <div className="absolute text-[10px] text-muted-foreground/70 font-medium" style={{ left: '55%', top: '165px' }}>
                        SWAP
                      </div>
                    </div>

                    {/* Bottom Row - L1 | R1 with values */}
                    <div className="flex">
                      <div className="flex-1 h-14 bg-gradient-to-r from-blue-500/25 to-blue-500/15 border-2 border-blue-500/50 flex flex-col items-center justify-center">
                        <span className="text-blue-400/70 text-xs font-semibold">L<sub>{currentStep.round}</sub></span>
                        <span className="text-blue-400 font-mono font-bold text-sm">
                          {(() => {
                            const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                            return prevRound ? bitsToHex(prevRound.R) : bitsToHex(currentStep.L);
                          })()}
                        </span>
                      </div>
                      <div className="flex-1 h-14 bg-gradient-to-r from-orange-500/25 to-orange-500/15 border-2 border-orange-500/50 border-l-0 flex flex-col items-center justify-center">
                        <span className="text-orange-400/70 text-xs font-semibold">R<sub>{currentStep.round}</sub></span>
                        <span className="text-orange-400 font-mono font-bold text-sm">
                          {bitsToHex(currentStep.R)}
                        </span>
                      </div>
                    </div>

                    {/* Round Equations - below the diagram */}
                    <div className="flex justify-center gap-6 mt-3 py-2 px-3 bg-muted/20 rounded-lg border border-border/30">
                      <div className="text-sm font-mono">
                        <span className="text-blue-400">L<sub>{currentStep.round}</sub></span>
                        <span className="text-muted-foreground"> = </span>
                        <span className="text-orange-400">R<sub>{currentStep.round - 1}</sub></span>
                      </div>
                      <div className="text-sm font-mono">
                        <span className="text-orange-400">R<sub>{currentStep.round}</sub></span>
                        <span className="text-muted-foreground"> = </span>
                        <span className="text-blue-400">L<sub>{currentStep.round - 1}</sub></span>
                        <span className="text-muted-foreground"> ⊕ </span>
                        <span className="text-purple-400">f(</span>
                        <span className="text-orange-400">R<sub>{currentStep.round - 1}</sub></span>
                        <span className="text-purple-400">, </span>
                        <span className="text-green-400">K<sub>{currentStep.round}</sub></span>
                        <span className="text-purple-400">)</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Values Grid - Matches your app style */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-blue-400 font-semibold mb-1">L0</div>
                    <div className="font-mono text-foreground/80">
                      {(() => {
                        const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                        return prevRound ? bitsToHex(prevRound.L) : bitsToHex(currentStep.L);
                      })()}
                    </div>
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-orange-400 font-semibold mb-1">R0</div>
                    <div className="font-mono text-foreground/80">
                      {(() => {
                        const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                        return prevRound ? bitsToHex(prevRound.R) : bitsToHex(currentStep.R);
                      })()}
                    </div>
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-green-400 font-semibold mb-1">K{currentStep.round}</div>
                    <div className="font-mono text-foreground/80">
                      {currentStep.subkey ? bitsToHex(currentStep.subkey) : ""}
                    </div>
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-purple-400 font-semibold mb-1">f(R, K)</div>
                    <div className="font-mono text-foreground/80">
                      {bitsToHex(currentStep.feistelOutput || [])}
                    </div>
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-blue-400 font-semibold mb-1">L1 = R0</div>
                    <div className="font-mono text-foreground/80">
                      {(() => {
                        const prevRound = steps.find(s => s.type === "round" && s.round === currentStep.round - 1);
                        return prevRound ? bitsToHex(prevRound.R) : bitsToHex(currentStep.L);
                      })()}
                    </div>
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-muted/10">
                    <div className="text-orange-400 font-semibold mb-1">R1 = L ⊕ f</div>
                    <div className="font-mono text-foreground/80">
                      {bitsToHex(currentStep.R)}
                    </div>
                  </div>
                </div>

              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-3 border-t border-border">
              {currentStep?.description}
              {currentStep?.blockInfo && (
                <span className="block mt-1 text-yellow-400">
                  Processing {currentStep.blockInfo.currentBlock + 1} of {currentStep.blockInfo.totalBlocks} blocks
                </span>
              )}
            </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <p className="text-sm italic">Click Animate to see DES steps</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
