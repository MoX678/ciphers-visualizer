import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Eye, EyeOff, ChevronLeft, ChevronRight, Info, FastForward } from "lucide-react";
import { cn } from "@/lib/utils";

// AES S-box
const SBOX: number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

// Inverse S-box
const INV_SBOX: number[] = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d,
];

// Rcon values for key expansion
const RCON: number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

type AESState = number[][];
type OperationType = "initial" | "subbytes" | "shiftrows" | "mixcolumns" | "addroundkey" | "keyexpansion";
type AESStep = {
  name: string;
  description: string;
  state: AESState;
  prevState: AESState;
  operation: OperationType;
  round: number;
  roundKey?: AESState;
  roundKeys?: AESState[];
};

// Helper functions
function textToState(text: string): AESState {
  const bytes = new Array(16).fill(0); // 16 bytes for AES 
  for (let i = 0; i < Math.min(text.length, 16); i++) {
    bytes[i] = text.charCodeAt(i);
  }
  const state: AESState = [];
  // Fill state matrix in column-major  first row is 0,4,8,12
  for (let c = 0; c < 4; c++) {
    state.push([bytes[c], bytes[c + 4], bytes[c + 8], bytes[c + 12]]);
  }
  return state;
}

function hexToState(hexString: string): AESState {
  // Remove spaces and convert to uppercase
  const cleanHex = hexString.replace(/\s/g, '').toUpperCase();
  
  // Pad or truncate to 32 hex chars (16 bytes)
  const paddedHex = cleanHex.padEnd(32, '0').slice(0, 32);
  
  // Convert hex pairs to bytes
  const bytes: number[] = [];
  for (let i = 0; i < 32; i += 2) {
    bytes.push(parseInt(paddedHex.substr(i, 2), 16));
  }
  
  // Convert to state matrix (matching stateToHex.flat().join() output)
  const state: AESState = [];
  for (let c = 0; c < 4; c++) {
    state.push([bytes[c * 4], bytes[c * 4 + 1], bytes[c * 4 + 2], bytes[c * 4 + 3]]);
  }
  return state;
}

function stateToHex(state: AESState): string[][] {
  return state.map(col => col.map(b => b.toString(16).padStart(2, '0').toUpperCase()));
}

function stateToText(state: AESState): string {
  // Convert state matrix back to text (reverse column-major order from textToState)
  const bytes: number[] = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      bytes[c + r * 4] = state[c][r];  // Reverse the textToState mapping
    }
  }
  
  // Convert bytes to string, show all characters including spaces
  let text = '';
  for (const byte of bytes) {
    // Convert printable ASCII characters (including spaces)
    if (byte >= 32 && byte <= 126) {
      text += String.fromCharCode(byte);
    } else if (byte === 0) {
      // Stop at null byte (actual padding)
      break;
    }
    // Skip other non-printable characters
  }
  
  return text;
}

function copyState(state: AESState): AESState {
  return state.map(col => [...col]);
}

// AES operations
function subBytes(state: AESState): AESState {
  return state.map(col => col.map(b => SBOX[b]));
}

function invSubBytes(state: AESState): AESState {
  return state.map(col => col.map(b => INV_SBOX[b]));
}
// first row unchanged
// second row shift left by 1
// third row shift left by 2
function shiftRows(state: AESState): AESState {
  const result = copyState(state);
  const temp1 = result[0][1];  
  result[0][1] = result[1][1];
  result[1][1] = result[2][1];
  result[2][1] = result[3][1];
  result[3][1] = temp1;
  [result[0][2], result[1][2], result[2][2], result[3][2]] = 
  [result[2][2], result[3][2], result[0][2], result[1][2]];
  const temp3 = result[3][3];
  result[3][3] = result[2][3];
  result[2][3] = result[1][3];
  result[1][3] = result[0][3];
  result[0][3] = temp3;
  return result;
}

function invShiftRows(state: AESState): AESState {
  const result = copyState(state);
  const temp1 = result[3][1];
  result[3][1] = result[2][1];
  result[2][1] = result[1][1];
  result[1][1] = result[0][1];
  result[0][1] = temp1;
  [result[0][2], result[1][2], result[2][2], result[3][2]] = 
  [result[2][2], result[3][2], result[0][2], result[1][2]];
  const temp3 = result[0][3];
  result[0][3] = result[1][3];
  result[1][3] = result[2][3];
  result[2][3] = result[3][3];
  result[3][3] = temp3;
  return result;
}

function gmul(a: number, b: number): number {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 0x80;
    a = (a << 1) & 0xff;
    if (hi) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

function mixColumns(state: AESState): AESState {
  const result: AESState = [];
  for (let c = 0; c < 4; c++) {
    const col = state[c];
    result.push([
      gmul(2, col[0]) ^ gmul(3, col[1]) ^ col[2] ^ col[3],
      col[0] ^ gmul(2, col[1]) ^ gmul(3, col[2]) ^ col[3],
      col[0] ^ col[1] ^ gmul(2, col[2]) ^ gmul(3, col[3]),
      gmul(3, col[0]) ^ col[1] ^ col[2] ^ gmul(2, col[3]),
    ]);
  }
  return result;
}

function invMixColumns(state: AESState): AESState {
  const result: AESState = [];
  for (let c = 0; c < 4; c++) {
    const col = state[c];
    result.push([
      gmul(0x0e, col[0]) ^ gmul(0x0b, col[1]) ^ gmul(0x0d, col[2]) ^ gmul(0x09, col[3]),
      gmul(0x09, col[0]) ^ gmul(0x0e, col[1]) ^ gmul(0x0b, col[2]) ^ gmul(0x0d, col[3]),
      gmul(0x0d, col[0]) ^ gmul(0x09, col[1]) ^ gmul(0x0e, col[2]) ^ gmul(0x0b, col[3]),
      gmul(0x0b, col[0]) ^ gmul(0x0d, col[1]) ^ gmul(0x09, col[2]) ^ gmul(0x0e, col[3]),
    ]);
  }
  return result;
}

function addRoundKey(state: AESState, roundKey: AESState): AESState {
  return state.map((col, c) => col.map((b, r) => b ^ roundKey[c][r]));
}

function keyExpansion(key: string): AESState[] {
  const keyBytes = new Array(16).fill(0);
  for (let i = 0; i < Math.min(key.length, 16); i++) {
    keyBytes[i] = key.charCodeAt(i);
  }
  
  const w: number[][] = [];
  for (let i = 0; i < 4; i++) {
    w.push([keyBytes[i * 4], keyBytes[i * 4 + 1], keyBytes[i * 4 + 2], keyBytes[i * 4 + 3]]);
  }
  
  for (let i = 4; i < 44; i++) {
    let temp = [...w[i - 1]];
    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]];
      temp = temp.map(b => SBOX[b]);
      temp[0] ^= RCON[(i / 4) - 1];
    }
    w.push(w[i - 4].map((b, j) => b ^ temp[j]));
  }
  
  const roundKeys: AESState[] = [];
  for (let round = 0; round < 11; round++) {
    roundKeys.push([w[round * 4], w[round * 4 + 1], w[round * 4 + 2], w[round * 4 + 3]]);
  }
  return roundKeys;
}

function aesEncryptWithSteps(plaintext: string, key: string): AESStep[] {
  const steps: AESStep[] = []; 
  
  // Create empty state for block representation
  const emptyState: AESState = [
    [0, 0, 0, 0],
    [0, 0, 0, 0], 
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  
  // Add Block to State conversion step (combines block conversion and initial state)
  const inputState = textToState(plaintext);
  steps.push({
    name: "Block to State",
    description: "Convert 16-byte input block to 4×4 state matrix (column-major order) - ready for encryption",
    state: inputState,
    prevState: emptyState,
    operation: "initial",
    round: 0,
  });
  
  let state = textToState(plaintext);
  const roundKeys = keyExpansion(key);
  
  // Add Key Expansion step (showing the derived round keys)
  steps.push({
    name: "Key Expansion",
    description: "Generate 11 round keys from the original 128-bit key using the AES key schedule",
    state: roundKeys[0],
    prevState: emptyState,
    operation: "keyexpansion",
    round: 0,
    roundKeys: roundKeys,
  });
  
  let prevState = copyState(state);
  state = addRoundKey(state, roundKeys[0]);
  steps.push({
    name: "Add Round Key (Initial)",
    description: "XOR state with first round key",
    state: copyState(state),
    prevState,
    operation: "addroundkey",
    round: 0,
    roundKey: roundKeys[0],
  });
  
  for (let round = 1; round <= 9; round++) {
    prevState = copyState(state);
    state = subBytes(state);
    steps.push({
      name: `Round ${round}: SubBytes`,
      description: "Replace each byte using S-box lookup table",
      state: copyState(state),
      prevState,
      operation: "subbytes",
      round,
    });
    
    prevState = copyState(state);
    state = shiftRows(state);
    steps.push({
      name: `Round ${round}: ShiftRows`,
      description: "Cyclically shift rows left by 0, 1, 2, 3 positions",
      state: copyState(state),
      prevState,
      operation: "shiftrows",
      round,
    });
    
    prevState = copyState(state);
    state = mixColumns(state);
    steps.push({
      name: `Round ${round}: MixColumns`,
      description: "Mix columns using matrix multiplication in GF(2⁸)",
      state: copyState(state),
      prevState,
      operation: "mixcolumns",
      round,
    });
    
    prevState = copyState(state);
    state = addRoundKey(state, roundKeys[round]);
    steps.push({
      name: `Round ${round}: AddRoundKey`,
      description: `XOR state with round key ${round}`,
      state: copyState(state),
      prevState,
      operation: "addroundkey",
      round,
      roundKey: roundKeys[round],
    });
  }
  
  prevState = copyState(state);
  state = subBytes(state);
  steps.push({
    name: "Round 10: SubBytes",
    description: "Replace each byte using S-box lookup table",
    state: copyState(state),
    prevState,
    operation: "subbytes",
    round: 10,
  });
  
  prevState = copyState(state);
  state = shiftRows(state);
  steps.push({
    name: "Round 10: ShiftRows",
    description: "Cyclically shift rows left by 0, 1, 2, 3 positions",
    state: copyState(state),
    prevState,
    operation: "shiftrows",
    round: 10,
  });
  
  prevState = copyState(state);
  state = addRoundKey(state, roundKeys[10]);
  steps.push({
    name: "Round 10: AddRoundKey (Final)",
    description: "XOR state with final round key - Encryption complete!",
    state: copyState(state),
    prevState,
    operation: "addroundkey",
    round: 10,
    roundKey: roundKeys[10],
  });
  
  return steps;
}

function aesDecryptWithSteps(ciphertext: AESState, key: string): AESStep[] {
  const steps: AESStep[] = [];
  let state = copyState(ciphertext);
  const roundKeys = keyExpansion(key);
  
  steps.push({
    name: "Initial Ciphertext",
    description: "Start with the encrypted 4×4 byte matrix",
    state: copyState(state),
    prevState: copyState(state),
    operation: "initial",
    round: 0,
  });
  
  let prevState = copyState(state);
  state = addRoundKey(state, roundKeys[10]);
  steps.push({
    name: "Add Round Key (Initial)",
    description: "XOR state with last round key",
    state: copyState(state),
    prevState,
    operation: "addroundkey",
    round: 0,
    roundKey: roundKeys[10],
  });
  
  for (let round = 9; round >= 1; round--) {
    prevState = copyState(state);
    state = invShiftRows(state);
    steps.push({
      name: `Round ${10 - round}: InvShiftRows`,
      description: "Cyclically shift rows right by 0, 1, 2, 3 positions",
      state: copyState(state),
      prevState,
      operation: "shiftrows",
      round: 10 - round,
    });
    
    prevState = copyState(state);
    state = invSubBytes(state);
    steps.push({
      name: `Round ${10 - round}: InvSubBytes`,
      description: "Replace each byte using inverse S-box lookup",
      state: copyState(state),
      prevState,
      operation: "subbytes",
      round: 10 - round,
    });
    
    prevState = copyState(state);
    state = addRoundKey(state, roundKeys[round]);
    steps.push({
      name: `Round ${10 - round}: AddRoundKey`,
      description: `XOR state with round key ${round}`,
      state: copyState(state),
      prevState,
      operation: "addroundkey",
      round: 10 - round,
      roundKey: roundKeys[round],
    });
    
    prevState = copyState(state);
    state = invMixColumns(state);
    steps.push({
      name: `Round ${10 - round}: InvMixColumns`,
      description: "Inverse mix columns using matrix multiplication in GF(2⁸)",
      state: copyState(state),
      prevState,
      operation: "mixcolumns",
      round: 10 - round,
    });
  }
  
  prevState = copyState(state);
  state = invShiftRows(state);
  steps.push({
    name: "Round 10: InvShiftRows",
    description: "Cyclically shift rows right by 0, 1, 2, 3 positions",
    state: copyState(state),
    prevState,
    operation: "shiftrows",
    round: 10,
  });
  
  prevState = copyState(state);
  state = invSubBytes(state);
  steps.push({
    name: "Round 10: InvSubBytes",
    description: "Replace each byte using inverse S-box lookup",
    state: copyState(state),
    prevState,
    operation: "subbytes",
    round: 10,
  });
  
  prevState = copyState(state);
  state = addRoundKey(state, roundKeys[0]);
  steps.push({
    name: "Round 10: AddRoundKey (Final)",
    description: "XOR state with initial round key - Decryption complete!",
    state: copyState(state),
    prevState,
    operation: "addroundkey",
    round: 10,
    roundKey: roundKeys[0],
  });
  
  return steps;
}

// State Matrix Component
function StateMatrix({ 
  state, 
  label, 
  highlight,
  colorClass = "bg-muted text-foreground border-border"
}: { 
  state: AESState; 
  label: string;
  highlight?: boolean;
  colorClass?: string;
}) {
  const hex = stateToHex(state);
  return (
    <div className="flex flex-col items-center group">
      <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
      <div className={cn(
        "p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80",
        highlight ? "ring-2 ring-primary/70 shadow-lg shadow-primary/20" : "ring-1 ring-border/50",
        "transition-all duration-300 hover:scale-105"
      )}>
        {/* Grid with spacing */}
        <div className="grid grid-cols-4 gap-1 md:gap-1.5">
          {[0, 1, 2, 3].map(row => (
            [0, 1, 2, 3].map(col => (
              <div
                key={`${row}-${col}`}
                className={cn(
                  "w-8 h-8 md:w-11 md:h-11 flex items-center justify-center font-mono text-xs md:text-sm font-semibold",
                  "transition-all duration-300 rounded-md border",
                  colorClass,
                  "hover:brightness-125 hover:scale-105 cursor-default"
                )}
              >
                {hex[col][row]}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
}

// Operation Diagram Components
function SubBytesDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);

  // Get all 16 positions in order (row by row)
  const allPositions = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      allPositions.push({ row, col });
    }
  }

  const { row: exampleRow, col: exampleCol } = allPositions[currentPosition];
  const inputByte = prevHex[exampleCol][exampleRow];
  const outputByte = currHex[exampleCol][exampleRow];
  const row = parseInt(inputByte[0], 16);
  const col = parseInt(inputByte[1], 16);

  // Auto-cycle through all positions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosition(prev => {
        if (prev < 15) {
          return prev + 1;
        } else {
          setShowComplete(true);
          return 15; // Stay on last position
        }
      });
    }, 1500); // 1.5 seconds per position
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl p-6 space-y-6 border border-orange-500/30 shadow-lg">
      <h4 className="font-bold text-orange-400 text-center text-sm">
        SubBytes Operation - Position [{exampleRow}][{exampleCol}] ({currentPosition + 1}/16)
      </h4>
      
      {/* Horizontal Layout: Before → Operation → After - Same Style */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* Before State Matrix - Highlight the cell being looked up */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">Before</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-border/50 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isHighlighted = row === exampleRow && col === exampleCol && !showComplete;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isHighlighted
                            ? "bg-gradient-to-b from-orange-500/40 to-orange-500/20 border-orange-400 text-orange-200 ring-2 ring-orange-400/60"
                            : "bg-gradient-to-b from-muted/40 to-muted/20 border-border/50 text-foreground/70",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {prevHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple Operation Indicator */}
        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 delay-100">
          <div className="text-3xl lg:text-4xl text-orange-400 font-bold">S</div>
          <div className="text-xs font-semibold text-orange-300">S-box</div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
            {currentPosition + 1}/16
          </div>
        </div>
        
        {/* After State Matrix - With orange highlighting */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">After</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-orange-500/30 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isHighlighted = row === exampleRow && col === exampleCol && !showComplete;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isHighlighted
                            ? "bg-gradient-to-b from-orange-500/60 to-orange-500/40 border-orange-400 text-orange-100 ring-2 ring-orange-400 shadow-lg"
                            : "bg-gradient-to-b from-orange-500/30 to-orange-500/10 border-orange-500/50 text-orange-300",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {currHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact S-box Table with Integrated Lookup Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-orange-300">AES S-box Lookup Table</h5>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-orange-500/50 border border-orange-500"></div>
              <span className="text-muted-foreground">Column</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-amber-500/50 border border-amber-500"></div>
              <span className="text-muted-foreground">Row</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-orange-500 border border-orange-400"></div>
              <span className="text-muted-foreground">Result</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
          {/* Lookup Details Panel - Connected Tape */}
          {!showComplete && (
            <div className="flex items-stretch">
              {/* Input */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground font-medium mb-1">Input</div>
                <div className="px-1.5 py-1.5 rounded-l-lg bg-gradient-to-r from-orange-500/30 to-orange-500/20 border border-orange-500/40 border-r-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-orange-500/30 to-orange-500/10 rounded-md flex items-center justify-center font-mono text-base md:text-lg font-bold text-orange-400 border border-orange-500/50">
                    {inputByte}
                  </div>
                </div>
                <div className="text-[9px] text-orange-400 mt-1">
                  Row: {inputByte[0]} | Col: {inputByte[1]}
                </div>
              </div>
              
              {/* S-box Index */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground font-medium mb-1">S-box</div>
                <div className="px-1.5 py-1.5 bg-gradient-to-r from-orange-500/20 via-orange-500/30 to-orange-500/20 border-y border-orange-500/40">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-orange-500/40 to-orange-500/20 rounded-md flex items-center justify-center font-mono text-xs font-bold text-orange-200 border border-orange-400/60">
                    [{row}][{col}]
                  </div>
                </div>
                <div className="text-[9px] text-orange-400 mt-1">
                  Lookup
                </div>
              </div>
              
              {/* Output */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground font-medium mb-1">Output</div>
                <div className="px-1.5 py-1.5 rounded-r-lg bg-gradient-to-r from-orange-500/20 to-orange-500/40 border border-orange-500/50 border-l-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-orange-500/60 to-orange-500/30 rounded-md flex items-center justify-center font-mono text-base md:text-lg font-bold text-orange-100 border border-orange-400 shadow-lg ring-2 ring-orange-400/50 animate-pulse">
                    {outputByte}
                  </div>
                </div>
                <div className="text-[9px] text-orange-300 font-semibold mt-1">
                  Substituted
                </div>
              </div>
            </div>
          )}
          
          {/* S-box Table - Vigenère Style */}
          <div className="p-2 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-orange-500/20 overflow-x-auto">
            {/* Column headers */}
            <div className="flex gap-0.5 min-w-max">
              <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                +
              </div>
              {Array.from({length: 16}, (_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-mono text-[10px] rounded transition-all duration-200",
                    i === col && !showComplete
                      ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/30" 
                      : "text-orange-400 bg-orange-500/10"
                  )}
                >
                  {i.toString(16).toUpperCase()}
                </div>
              ))}
            </div>
            
            {/* S-box rows */}
            <div className="min-w-max">
              {Array.from({length: 16}, (_, r) => {
                const isKeyRow = r === row && !showComplete;
                return (
                  <div key={r} className="flex gap-0.5 mt-0.5">
                    {/* Row header */}
                    <div 
                      className={cn(
                        "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-mono text-[10px] rounded transition-all duration-200",
                        isKeyRow 
                          ? "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30" 
                          : "text-amber-400 bg-amber-500/10"
                      )}
                    >
                      {r.toString(16).toUpperCase()}
                    </div>
                    {/* S-box values */}
                    {Array.from({length: 16}, (_, c) => {
                      const sboxValue = SBOX[r * 16 + c];
                      const isIntersection = r === row && c === col && !showComplete;
                      const isInActiveRow = isKeyRow;
                      const isInActiveCol = c === col && !showComplete;
                      
                      return (
                        <div 
                          key={c} 
                          className={cn(
                            "w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-mono text-[9px] md:text-[10px] rounded transition-all duration-200",
                            isIntersection 
                              ? "bg-orange-500 text-orange-50 font-bold ring-1 ring-orange-400 shadow-md shadow-orange-500/40" 
                              : isInActiveRow && isInActiveCol
                                ? "bg-orange-500/30 text-orange-200"
                                : isInActiveRow
                                  ? "bg-amber-500/20 text-amber-300"
                                  : isInActiveCol
                                    ? "bg-orange-500/20 text-orange-300"
                                    : "text-foreground/40 hover:bg-muted/50 hover:text-foreground/70"
                          )}
                        >
                          {sboxValue.toString(16).padStart(2, '0').toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftRowsDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const getRowColor = (row: number) => {
    const colors = [
      { bg: "from-blue-500/30 to-blue-500/10", border: "border-blue-500/50", text: "text-blue-300" },
      { bg: "from-green-500/30 to-green-500/10", border: "border-green-500/50", text: "text-green-300" },
      { bg: "from-yellow-500/30 to-yellow-500/10", border: "border-yellow-500/50", text: "text-yellow-300" },
      { bg: "from-red-500/30 to-red-500/10", border: "border-red-500/50", text: "text-red-300" }
    ];
    return colors[row];
  };

  // Create color-coded state matrices with spacing
  const ColorCodedStateMatrix = ({ state, label }: { state: AESState; label: string }) => {
    const hex = stateToHex(state);
    return (
      <div className="flex flex-col items-center group">
        <div className="text-xs font-medium text-muted-foreground mb-2">{label}</div>
        <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-border/50 transition-all duration-300 hover:scale-105">
          <div className="grid grid-cols-4 gap-1 md:gap-1.5">
            {[0, 1, 2, 3].map(row => {
              const color = getRowColor(row);
              return [0, 1, 2, 3].map(col => (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                    "transition-all duration-300 rounded-md border",
                    `bg-gradient-to-b ${color.bg} ${color.border} ${color.text}`,
                    "hover:brightness-125 hover:scale-105 cursor-default"
                  )}
                >
                  {hex[col][row]}
                </div>
              ));
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl p-6 space-y-6 border border-blue-500/30 shadow-lg">
      <h4 className="font-bold text-blue-400 text-center text-sm">ShiftRows Operation</h4>
      
      {/* Horizontal Layout: Before → Operation → After */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* Before State Matrix */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <ColorCodedStateMatrix state={prevState} label="Before" />
        </div>
        
        {/* Operation Indicator */}
        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 delay-100">
          <div className="text-3xl lg:text-4xl text-blue-400 animate-pulse font-bold">↻</div>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400">
            Shift Rows
          </div>
        </div>
        
        {/* After State Matrix */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <ColorCodedStateMatrix state={state} label="After" />
        </div>
      </div>

      {/* Row Shift Details */}
      <div className="bg-background/60 rounded-lg p-4 border border-blue-500/20">
        <h6 className="text-xs text-blue-300 mb-3 text-center font-semibold">Shift Pattern by Row</h6>
        
        <div className="space-y-2">
          {[0, 1, 2, 3].map(row => {
            const color = getRowColor(row);
            const prevHex = stateToHex(prevState);
            const shiftAmount = row;
            
            return (
              <div key={row} className={cn("flex items-center justify-between p-2.5 rounded-lg border", color.border.replace("/50", "/30"), "bg-gradient-to-r", color.bg.replace("from-", "from-").replace("/30", "/10").replace("/10", "/5"))}>
                <div className={cn("text-sm font-bold min-w-[40px]", color.text)}>
                  R{row}:
                </div>
                
                <div className="flex items-center gap-3 flex-1 justify-center">
                  {/* Before - Show which elements will shift */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((col) => {
                      // Elements that will wrap around are highlighted
                      const willWrap = col < shiftAmount;
                      return (
                        <div key={col} className={cn(
                          "h-8 w-8 flex items-center justify-center font-mono text-xs font-semibold rounded-md border transition-all",
                          willWrap 
                            ? cn("ring-2 ring-offset-1 ring-offset-background animate-pulse", color.border.replace("border-", "ring-"), `bg-gradient-to-b ${color.bg.replace("/30", "/50").replace("/10", "/30")} ${color.border} ${color.text}`)
                            : cn(`bg-gradient-to-b ${color.bg} ${color.border} ${color.text}`)
                        )}>
                          {prevHex[col][row]}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Shift Arrow with amount */}
                  <div className="flex flex-col items-center">
                    <div className={cn("text-base font-bold", color.text)}>
                      {shiftAmount === 0 ? "=" : `←${shiftAmount}`}
                    </div>
                  </div>
                  
                  {/* After - Show where elements ended up */}
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((col) => {
                      const sourceCol = (col + shiftAmount) % 4;
                      // Elements that wrapped from the beginning are highlighted in result
                      const wasWrapped = sourceCol < shiftAmount;
                      return (
                        <div key={col} className={cn(
                          "h-8 w-8 flex items-center justify-center font-mono text-xs font-bold rounded-md border transition-all",
                          wasWrapped 
                            ? cn("ring-2 ring-offset-1 ring-offset-background shadow-lg", color.border.replace("border-", "ring-"), `bg-gradient-to-b ${color.bg.replace("/30", "/60").replace("/10", "/40")} ${color.border} ${color.text}`)
                            : cn(`bg-gradient-to-b ${color.bg.replace("/30", "/40").replace("/10", "/20")} ${color.border} ${color.text}`)
                        )}>
                          {prevHex[sourceCol][row]}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground min-w-[55px] text-right">
                  {row === 0 ? "No shift" : `wrap ${row}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Legend */}
      <div className="flex justify-center gap-2 text-[10px] flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>R0</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>R1</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>R2</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>R3</span>
        <span className="text-muted-foreground ml-2">• Ring = wrapped elements</span>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center">
        Each row shifts left by its row number. Highlighted elements wrap around.
      </p>
    </div>
  );
}

function MixColumnsDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const [currentCol, setCurrentCol] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const prevHex = stateToHex(prevState);
  const stateHex = stateToHex(state);
  
  // MixColumns fixed matrix
  const fixedMatrix = [
    [2, 3, 1, 1],
    [1, 2, 3, 1], 
    [1, 1, 2, 3],
    [3, 1, 1, 2]
  ];

  // Input column values for current column
  const inputCol = [
    parseInt(prevHex[currentCol][0], 16),
    parseInt(prevHex[currentCol][1], 16),
    parseInt(prevHex[currentCol][2], 16),
    parseInt(prevHex[currentCol][3], 16)
  ];

  // Calculate results for each row
  const calculations = fixedMatrix.map((row, rowIdx) => {
    const terms = row.map((coeff, colIdx) => {
      const inputByte = inputCol[colIdx];
      const result = coeff === 1 ? inputByte : gmul(coeff, inputByte);
      return { coeff, inputByte, result };
    });
    const finalResult = terms.reduce((acc, term) => acc ^ term.result, 0);
    return { terms, finalResult };
  });

  // Auto-cycle through all columns and rows - loops forever
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRow(prev => {
        if (prev < 3) {
          return prev + 1;
        } else {
          // Move to next column
          setCurrentCol(prevCol => (prevCol + 1) % 4);
          return 0;
        }
      });
    }, 1500); // 1.5 seconds per row
    return () => clearInterval(interval);
  }, []);

  const currentCalculation = calculations[currentRow];

  return (
    <div className="rounded-xl p-6 space-y-6 border border-purple-500/30 shadow-lg">
      <h4 className="font-bold text-purple-400 text-center text-sm">
        MixColumns Operation - Column {currentCol + 1}, Row {currentRow + 1}
      </h4>
      
      {/* Horizontal Layout: Before → Operation → After */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* Before State Matrix - Highlight the current column */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">Before</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-border/50 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isInCurrentCol = col === currentCol;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isInCurrentCol
                            ? "bg-gradient-to-b from-purple-500/40 to-purple-500/20 border-purple-400 text-purple-200 ring-2 ring-purple-400/60"
                            : "bg-gradient-to-b from-muted/40 to-muted/20 border-border/50 text-foreground/70",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {prevHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Operation Indicator */}
        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 delay-100">
          <div className="text-3xl lg:text-4xl text-purple-400 font-bold">×</div>
          <div className="text-xs font-semibold text-purple-300">MixColumns</div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Row {currentRow + 1}/4
          </div>
        </div>
        
        {/* After State Matrix - With purple highlighting */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">After</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-purple-500/30 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isHighlighted = row === currentRow && col === currentCol;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isHighlighted
                            ? "bg-gradient-to-b from-purple-500/60 to-purple-500/40 border-purple-400 text-purple-100 ring-2 ring-purple-400 shadow-lg"
                            : "bg-gradient-to-b from-purple-500/30 to-purple-500/10 border-purple-500/50 text-purple-300",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {stateHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Matrix Equation & Calculation - Always visible, loops */}
      <div className="bg-background/60 rounded-xl p-4 border border-purple-500/20">
        <h6 className="text-xs text-purple-300 mb-4 text-center font-semibold">
          <span className="px-2 py-0.5 bg-purple-500/20 rounded-full border border-purple-400/30">
            Column {currentCol + 1}, Row {currentRow + 1} - Galois Field
          </span>
        </h6>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
          {/* Matrix Equation - Compact Tape Style */}
          <div className="flex items-center justify-center gap-2">
              {/* Fixed Matrix */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground mb-1">Fixed</div>
                <div className="px-2 py-2 rounded-l-lg bg-gradient-to-r from-purple-500/25 to-purple-500/10 border border-purple-500/30 border-r-0">
                  <div className="grid grid-cols-4 gap-0.5">
                    {fixedMatrix.map((row, i) => (
                      row.map((val, j) => (
                        <div 
                          key={`${i}-${j}`} 
                          className={cn(
                            "w-6 h-6 md:w-7 md:h-7 flex items-center justify-center font-mono text-[10px] md:text-xs font-bold rounded border transition-all duration-300",
                            i === currentRow 
                              ? 'text-purple-100 bg-purple-500/50 border-purple-300 ring-1 ring-purple-400/50' 
                              : i < currentRow
                              ? 'text-purple-200 bg-purple-500/25 border-purple-400/40'
                              : 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                          )}
                        >
                          {val}
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Multiply symbol */}
              <div className="text-lg text-purple-400 font-bold">×</div>
              
              {/* Input Column */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground mb-1">Col {currentCol + 1}</div>
                <div className="px-2 py-2 bg-gradient-to-r from-purple-500/10 via-purple-500/20 to-purple-500/10 border-y border-purple-500/30">
                  <div className="flex flex-col gap-0.5">
                    {inputCol.map((val, idx) => (
                      <div 
                        key={idx} 
                        className="w-9 h-6 md:w-10 md:h-7 flex items-center justify-center font-mono text-[10px] md:text-xs font-bold rounded border text-purple-100 bg-purple-500/35 border-purple-400"
                      >
                        {val.toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Equals symbol */}
              <div className="text-lg text-purple-400 font-bold">=</div>
              
              {/* Output Column */}
              <div className="flex flex-col items-center">
                <div className="text-[10px] text-muted-foreground mb-1">Result</div>
                <div className="px-2 py-2 rounded-r-lg bg-gradient-to-r from-purple-500/10 to-purple-500/30 border border-purple-500/40 border-l-0">
                  <div className="flex flex-col gap-0.5">
                    {calculations.map((calc, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-9 h-6 md:w-10 md:h-7 flex items-center justify-center font-mono text-[10px] md:text-xs font-bold rounded border transition-all duration-300",
                          idx === currentRow
                            ? 'text-purple-100 bg-purple-500/60 border-purple-300 ring-1 ring-purple-400'
                            : idx < currentRow
                            ? 'text-purple-200 bg-purple-500/35 border-purple-400'
                            : 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                        )}
                      >
                        {calc.finalResult.toString(16).padStart(2, '0').toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-24 bg-gradient-to-b from-transparent via-purple-500/30 to-transparent"></div>
          <div className="lg:hidden w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

          {/* Step-by-Step Calculation - Compact */}
          <div className="flex-1 max-w-xs">
            <div className="text-center mb-2">
              <div className="text-[10px] font-semibold text-purple-200 px-2 py-1 bg-purple-500/15 rounded border border-purple-400/20 inline-block">
                [{fixedMatrix[currentRow].join(', ')}] × col
              </div>
            </div>
            
            {/* Multiplication terms - Compact grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {currentCalculation.terms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-1 p-1 rounded bg-background/30 border border-purple-500/15">
                  <div className={cn(
                    "px-1.5 py-0.5 rounded font-mono text-[10px] font-bold flex-shrink-0",
                    term.coeff === 1 
                      ? 'bg-green-500/40 text-green-100 border border-green-400/60' 
                      : term.coeff === 2 
                      ? 'bg-blue-500/40 text-blue-100 border border-blue-400/60'
                      : 'bg-orange-500/40 text-orange-100 border border-orange-400/60'
                  )}>
                    {term.coeff}×{term.inputByte.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                  <span className="text-purple-400 text-xs">=</span>
                  <div className="px-1.5 py-0.5 bg-purple-500/30 text-purple-100 border border-purple-400/60 rounded font-mono text-[10px] font-bold">
                    {term.result.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Final XOR - Compact */}
            <div className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
              <div className="flex items-center justify-center gap-1 flex-wrap font-mono">
                {currentCalculation.terms.map((term, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="px-1 py-0.5 rounded bg-purple-500/25 text-purple-200 text-[10px] font-bold">
                      {term.result.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                    {idx < currentCalculation.terms.length - 1 && (
                      <span className="text-purple-400 text-xs font-bold">⊕</span>
                    )}
                  </span>
                ))}
                <span className="text-purple-400 text-sm font-bold mx-1">=</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300 ring-1 ring-purple-400/50">
                  {currentCalculation.finalResult.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center bg-background/50 rounded-lg p-3">
        <span className="text-purple-300 font-semibold">Auto-cycling:</span> Loops through all 4 columns × 4 rows using Galois Field arithmetic
      </p>
    </div>
  );
}

function AddRoundKeyDiagram({ prevState, state, roundKey }: { prevState: AESState; state: AESState; roundKey?: AESState }) {
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);
  const keyHex = roundKey ? stateToHex(roundKey) : null;
  
  const [currentCell, setCurrentCell] = useState({ row: 0, col: 0 });
  
  // Auto-cycle through cells
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCell(prev => {
        const nextCol = prev.col + 1;
        if (nextCol >= 4) {
          const nextRow = (prev.row + 1) % 4;
          return { row: nextRow, col: 0 };
        }
        return { row: prev.row, col: nextCol };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl p-4 space-y-4 border border-green-500/30 shadow-lg">
      <h4 className="font-bold text-green-400 text-center text-sm">AddRoundKey Operation</h4>
      
      {/* Horizontal Layout: State ⊕ Key = Result (full matrices, no background) */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-4">
        {/* State Matrix - Highlight current cell */}
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">State</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-border/50 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isActive = row === currentCell.row && col === currentCell.col;
                    return (
                      <div
                        key={`state-${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isActive
                            ? "bg-gradient-to-b from-green-500/50 to-green-500/30 border-green-400 text-green-100 ring-2 ring-green-400/60 shadow-lg"
                            : "bg-gradient-to-b from-muted/40 to-muted/20 border-border/50 text-foreground/70",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {prevHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* XOR Symbol */}
        <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-300 delay-100">
          <div className="text-2xl lg:text-3xl text-green-400 font-bold">⊕</div>
          <div className="text-[10px] bg-green-500/20 px-1.5 py-0.5 rounded-full text-green-300 font-medium">XOR</div>
        </div>
        
        {/* Round Key Matrix - Full yellow highlight */}
        <div className="animate-in fade-in zoom-in duration-300 delay-150">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">Round Key</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-yellow-500/40 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isActive = row === currentCell.row && col === currentCell.col;
                    return (
                      <div
                        key={`key-${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isActive
                            ? "bg-gradient-to-b from-yellow-500/60 to-yellow-500/40 border-yellow-400 text-yellow-100 ring-2 ring-yellow-400/60 shadow-lg"
                            : "bg-gradient-to-b from-yellow-500/30 to-yellow-500/10 border-yellow-500/50 text-yellow-300",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {keyHex ? keyHex[col][row] : "00"}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Equals Symbol */}
        <div className="text-xl lg:text-2xl text-green-400 font-bold">=</div>
        
        {/* Result Matrix - Highlight current cell */}
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
          <div className="flex flex-col items-center group">
            <div className="text-xs font-medium text-muted-foreground mb-2">Result</div>
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-green-500/30 transition-all duration-300 hover:scale-105">
              <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                {[0, 1, 2, 3].map(row => 
                  [0, 1, 2, 3].map(col => {
                    const isActive = row === currentCell.row && col === currentCell.col;
                    return (
                      <div
                        key={`result-${row}-${col}`}
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-mono text-sm md:text-base font-semibold",
                          "transition-all duration-300 rounded-md border",
                          isActive
                            ? "bg-gradient-to-b from-green-500/70 to-green-500/50 border-green-400 text-green-100 ring-2 ring-green-400 shadow-lg"
                            : "bg-gradient-to-b from-green-500/30 to-green-500/10 border-green-500/50 text-green-300",
                          "hover:brightness-125 cursor-default"
                        )}
                      >
                        {currHex[col][row]}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caesar-style XOR Step Visualization */}
      <div className="bg-background/60 rounded-xl p-4 border border-green-500/20">
        <h6 className="text-xs text-green-300 mb-4 text-center font-semibold">
          <span className="px-2 py-0.5 bg-green-500/20 rounded-full border border-green-400/30">
            Cell [{currentCell.row + 1}, {currentCell.col + 1}] XOR Step
          </span>
        </h6>
        
        {/* Caesar-style vertical step: Value (decimal) ⊕ Key (decimal) = Result (decimal) */}
        <div className="flex items-center justify-center gap-4">
          {/* State byte */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-mono text-lg md:text-xl font-bold rounded-lg border-2 bg-green-500/30 border-green-400 text-green-100 shadow-lg">
              {prevHex[currentCell.col][currentCell.row]}
            </div>
            <div className="text-sm text-green-400/80 font-mono mt-1">
              ({parseInt(prevHex[currentCell.col][currentCell.row], 16)})
            </div>
          </div>
          
          {/* XOR Symbol */}
          <div className="flex flex-col items-center">
            <div className="text-2xl text-green-400 font-bold">⊕</div>
          </div>
          
          {/* Key byte */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-mono text-lg md:text-xl font-bold rounded-lg border-2 bg-yellow-500/30 border-yellow-400 text-yellow-100 shadow-lg">
              {keyHex ? keyHex[currentCell.col][currentCell.row] : "00"}
            </div>
            <div className="text-sm text-yellow-400/80 font-mono mt-1">
              ({keyHex ? parseInt(keyHex[currentCell.col][currentCell.row], 16) : 0})
            </div>
          </div>
          
          {/* Equals Symbol */}
          <div className="flex flex-col items-center">
            <div className="text-2xl text-green-400 font-bold">=</div>
          </div>
          
          {/* Result byte */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center font-mono text-lg md:text-xl font-bold rounded-lg border-2 bg-green-500/50 border-green-400 text-green-100 ring-2 ring-green-400/50 shadow-lg">
              {currHex[currentCell.col][currentCell.row]}
            </div>
            <div className="text-sm text-green-300 font-mono mt-1">
              ({parseInt(currHex[currentCell.col][currentCell.row], 16)})
            </div>
          </div>
        </div>

        {/* Binary breakdown */}
        <div className="mt-4 bg-background/40 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">Binary XOR</div>
          <div className="flex items-center justify-center gap-2 font-mono text-xs">
            <span className="text-green-300">{parseInt(prevHex[currentCell.col][currentCell.row], 16).toString(2).padStart(8, '0')}</span>
            <span className="text-green-400 font-bold">⊕</span>
            <span className="text-yellow-300">{keyHex ? parseInt(keyHex[currentCell.col][currentCell.row], 16).toString(2).padStart(8, '0') : '00000000'}</span>
            <span className="text-muted-foreground">=</span>
            <span className="text-green-100 font-bold">{parseInt(currHex[currentCell.col][currentCell.row], 16).toString(2).padStart(8, '0')}</span>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center bg-background/50 rounded-lg p-2">
        <span className="text-green-300 font-semibold">Auto-cycling:</span> XOR each state byte with round key byte
      </p>
    </div>
  );
}

// Key Expansion Diagram Component - Visualize all 11 round keys with schedule algorithm
function KeyExpansionDiagram({ roundKeys, originalKey }: { roundKeys: AESState[]; originalKey: string }) {
  const [selectedRound, setSelectedRound] = useState(0);
  
  // Convert state to hex
  const stateToHex = (state: AESState) => 
    state.map(col => col.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()));
  
  // Get original key bytes
  const keyBytes = new Array(16).fill(0);
  for (let i = 0; i < Math.min(originalKey.length, 16); i++) {
    keyBytes[i] = originalKey.charCodeAt(i);
  }
  
  // Calculate all 44 words (W0-W43) for the schedule diagram
  const words: number[][] = [];
  for (let i = 0; i < 4; i++) {
    words.push([keyBytes[i * 4], keyBytes[i * 4 + 1], keyBytes[i * 4 + 2], keyBytes[i * 4 + 3]]);
  }
  for (let i = 4; i < 44; i++) {
    let temp = [...words[i - 1]];
    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]];
      temp = temp.map(b => SBOX[b]);
      temp[0] ^= RCON[(i / 4) - 1];
    }
    words.push(words[i - 4].map((b, j) => b ^ temp[j]));
  }
  
  const selectedKeyHex = stateToHex(roundKeys[selectedRound]);
  
  // Word to hex string helper
  const wordToHex = (word: number[]) => word.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
  
  // Get g() transformed word
  const getGWord = (wordIdx: number) => {
    if (wordIdx < 1) return words[0];
    let temp = [...words[wordIdx]];
    temp = [temp[1], temp[2], temp[3], temp[0]]; // RotWord
    temp = temp.map(b => SBOX[b]); // SubWord
    temp[0] ^= RCON[Math.floor((wordIdx + 1) / 4) - 1]; // Rcon
    return temp;
  };
  
  return (
    <div className="rounded-xl p-4 space-y-4 border border-yellow-500/30">
      <h4 className="font-bold text-yellow-400 text-center text-sm">Key Expansion (AES-128)</h4>
      
      {/* Original Key Tape → W0-W3 */}
      <div className="flex flex-col items-center">
        <div className="text-xs font-medium text-muted-foreground mb-2">Original Key → W₀W₁W₂W₃</div>
        <div className="flex items-center">
          {[0, 1, 2, 3].map(wordIdx => (
            <div key={wordIdx} className="flex items-center">
              {words[wordIdx].map((byte, byteIdx) => (
                <div 
                  key={`${wordIdx}-${byteIdx}`} 
                  className={cn(
                    "w-7 h-9 md:w-8 md:h-10 flex items-center justify-center font-mono text-[10px] md:text-xs font-semibold border-y border-l bg-gradient-to-b from-yellow-500/30 to-yellow-500/10 border-yellow-500/50 text-yellow-300",
                    wordIdx === 0 && byteIdx === 0 && "rounded-l-lg",
                    wordIdx === 3 && byteIdx === 3 && "rounded-r-lg border-r",
                    selectedRound === 0 && "ring-1 ring-yellow-400/50"
                  )}
                >
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </div>
              ))}
              {wordIdx < 3 && <div className="w-px h-6 bg-yellow-500/40 mx-0.5" />}
            </div>
          ))}
        </div>
      </div>
      
      {/* Round Key Selector */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-center text-muted-foreground">Select Round Key</div>
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {roundKeys.map((_, round) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={cn(
                "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center font-mono text-xs font-semibold rounded-lg border transition-all duration-200",
                selectedRound === round
                  ? "bg-gradient-to-b from-yellow-500/60 to-yellow-500/40 border-yellow-400 text-yellow-100 ring-2 ring-yellow-400/60 shadow-lg scale-110"
                  : "bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400/70 hover:bg-yellow-500/30 hover:scale-105"
              )}
            >
              K{round}
            </button>
          ))}
        </div>
      </div>
      
      {/* Dynamic Algorithm Section based on selected round */}
      <div className="rounded-xl p-3 border border-yellow-500/20 space-y-3">
        <div className="text-xs text-center text-yellow-400 font-semibold">
          {selectedRound === 0 ? "K₀ = Original Key (W₀W₁W₂W₃)" : `Computing K${selectedRound} (W${selectedRound * 4} to W${selectedRound * 4 + 3})`}
        </div>
        
        {selectedRound > 0 && (
          <div className="space-y-3">
            {/* Show computation for each word in the selected round key */}
            {[0, 1, 2, 3].map(wordOffset => {
              const wordIdx = selectedRound * 4 + wordOffset;
              const isGFunction = wordIdx % 4 === 0;
              const prevWord = words[wordIdx - 1];
              const prevPrevWord = words[wordIdx - 4];
              const resultWord = words[wordIdx];
              
              return (
                <div key={wordOffset} className={cn(
                  "p-2 rounded-lg border transition-all",
                  isGFunction ? "bg-orange-500/5 border-orange-500/30" : "bg-blue-500/5 border-blue-500/30"
                )}>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {/* W[i-4] */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-muted-foreground">W{wordIdx - 4}</span>
                      <div className="flex">
                        {prevPrevWord.map((b, i) => (
                          <div key={i} className="w-5 h-6 flex items-center justify-center font-mono text-[8px] font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-300 first:rounded-l last:rounded-r">
                            {b.toString(16).padStart(2, '0').toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <span className="text-lg text-yellow-400 font-bold">⊕</span>
                    
                    {/* W[i-1] or g(W[i-1]) */}
                    <div className="flex flex-col items-center">
                      <span className={cn("text-[8px]", isGFunction ? "text-orange-400" : "text-muted-foreground")}>
                        {isGFunction ? `g(W${wordIdx - 1})` : `W${wordIdx - 1}`}
                      </span>
                      <div className="flex">
                        {(isGFunction ? getGWord(wordIdx - 1) : prevWord).map((b, i) => (
                          <div key={i} className={cn(
                            "w-5 h-6 flex items-center justify-center font-mono text-[8px] font-semibold border first:rounded-l last:rounded-r",
                            isGFunction 
                              ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                              : "bg-purple-500/20 border-purple-500/40 text-purple-300"
                          )}>
                            {b.toString(16).padStart(2, '0').toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <span className="text-lg text-muted-foreground">=</span>
                    
                    {/* Result W[i] */}
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-yellow-400 font-semibold">W{wordIdx}</span>
                      <div className="flex">
                        {resultWord.map((b, i) => (
                          <div key={i} className="w-5 h-6 flex items-center justify-center font-mono text-[8px] font-bold bg-yellow-500/30 border border-yellow-400 text-yellow-200 first:rounded-l last:rounded-r">
                            {b.toString(16).padStart(2, '0').toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* g function detail when applicable */}
                  {isGFunction && (
                    <div className="mt-2 pt-2 border-t border-orange-500/20 flex items-center justify-center gap-2 flex-wrap text-[8px]">
                      <span className="text-orange-400 font-semibold">g():</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300">RotWord</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300">SubWord</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300">⊕ Rcon[{selectedRound - 1}]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {selectedRound === 0 && (
          <div className="text-[10px] text-center text-muted-foreground">
            The first round key K₀ is simply the original 128-bit key
          </div>
        )}
      </div>
      
      {/* Selected Round Key Matrix */}
      <div className="flex flex-col items-center">
        <div className="text-xs font-medium text-yellow-400 mb-2">
          Round Key {selectedRound} = W{selectedRound * 4} | W{selectedRound * 4 + 1} | W{selectedRound * 4 + 2} | W{selectedRound * 4 + 3}
        </div>
        <div className="p-2 md:p-3 rounded-xl ring-1 ring-yellow-500/40">
          <div className="grid grid-cols-4 gap-1.5 md:gap-2">
            {[0, 1, 2, 3].map(row => 
              [0, 1, 2, 3].map(col => (
                <div
                  key={`${row}-${col}`}
                  className="w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center font-mono text-sm md:text-base font-semibold rounded-md border bg-gradient-to-b from-yellow-500/40 to-yellow-500/20 border-yellow-500/60 text-yellow-200 hover:brightness-125 cursor-default"
                >
                  <span>{selectedKeyHex[col][row]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AESCipher() {
  const [inputText, setInputText] = useState("HELLO AES WORLD!");
  const [key, setKey] = useState("MYSECRETKEY12345");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [activeStep, setActiveStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [steps, setSteps] = useState<AESStep[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);

  const paddedInput = inputText.padEnd(16, '\0').slice(0, 16);
  const paddedKey = key.padEnd(16, '\0').slice(0, 16);

  useEffect(() => {
    if (mode === "encrypt") {
      setSteps(aesEncryptWithSteps(paddedInput, paddedKey));
    } else {
      // In decrypt mode, treat input as hex ciphertext
      try {
        const cipherState = hexToState(inputText);
        setSteps(aesDecryptWithSteps(cipherState, paddedKey));
      } catch (error) {
        // If hex parsing fails, try encrypting then decrypting
        const encryptedSteps = aesEncryptWithSteps(paddedInput, paddedKey);
        const cipherState = encryptedSteps[encryptedSteps.length - 1].state;
        setSteps(aesDecryptWithSteps(cipherState, paddedKey));
      }
    }
    // Reset animation state when inputs change
    setHasAnimated(false);
    setActiveStep(-1);
  }, [paddedInput, paddedKey, mode, inputText]);

  const startAnimation = () => {
    setIsAnimating(true);
    setHasAnimated(true);
    setActiveStep(0);
    setRevealedChars(0);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setHasAnimated(false);
    setActiveStep(-1);
    setRevealedChars(0);
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
    }, 1200);

    return () => clearTimeout(timer);
  }, [isAnimating, activeStep, steps.length]);

  const currentStep = hasAnimated ? (activeStep >= 0 ? steps[activeStep] : steps[steps.length - 1]) : null;
  const displayStep = activeStep >= 0 ? activeStep : steps.length - 1;

  return (
    <CipherLayout
      title="AES Encryption"
      description="Advanced Encryption Standard - 128-bit block cipher"
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Advanced Encryption Standard (AES) - Complete Guide</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 text-sm">
                    {/* Overview */}
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                      <h3 className="font-semibold text-primary mb-3">🔐 Overview</h3>
                      <p className="text-muted-foreground mb-3">
                        AES (Advanced Encryption Standard) is a symmetric block cipher established by NIST in 2001. 
                        It operates on fixed-size blocks of data using a secret key shared between sender and receiver.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-background/50 rounded p-2">
                          <div className="font-medium text-primary">Block Size</div>
                          <div className="text-muted-foreground">128 bits (16 bytes)</div>
                        </div>
                        <div className="bg-background/50 rounded p-2">
                          <div className="font-medium text-primary">Key Sizes</div>
                          <div className="text-muted-foreground">128, 192, 256 bits</div>
                        </div>
                        <div className="bg-background/50 rounded p-2">
                          <div className="font-medium text-primary">Rounds</div>
                          <div className="text-muted-foreground">10, 12, 14 respectively</div>
                        </div>
                      </div>
                    </div>

                    {/* Mathematical Foundation */}
                    <div className="bg-muted/10 rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-3">📐 Mathematical Foundation</h3>
                      <div className="space-y-3">
                        <div className="bg-background/50 rounded p-3">
                          <h4 className="font-medium text-foreground mb-2">Galois Field GF(2⁸)</h4>
                          <p className="text-muted-foreground text-xs mb-2">
                            AES operates in the finite field GF(2⁸) with irreducible polynomial: 
                            <span className="font-mono bg-muted px-1 mx-1 rounded">x⁸ + x⁴ + x³ + x + 1</span>
                          </p>
                          <p className="text-muted-foreground text-xs">
                            This allows for mathematical operations on bytes while maintaining security properties.
                          </p>
                        </div>
                        
                        <div className="bg-background/50 rounded p-3">
                          <h4 className="font-medium text-foreground mb-2">State Matrix</h4>
                          <p className="text-muted-foreground text-xs">
                            Data is arranged in a 4×4 byte matrix (column-major order) called the "State". 
                            All operations are performed on this matrix representation.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Operations */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">🔄 Round Operations (Detailed)</h3>
                      
                      <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                        <h4 className="font-medium text-orange-400 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-orange-400"></div>
                          SubBytes Transformation
                        </h4>
                        <div className="space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            <strong>Purpose:</strong> Non-linear substitution providing confusion (Shannon's principle)
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Process:</strong> Each byte is replaced using the Rijndael S-box, constructed by:
                          </p>
                          <ol className="list-decimal list-inside ml-4 space-y-1 text-muted-foreground">
                            <li>Taking multiplicative inverse in GF(2⁸) (0x00 maps to itself)</li>
                            <li>Applying affine transformation: b' = Ab + c (where A is a fixed matrix, c is constant 0x63)</li>
                          </ol>
                          <div className="bg-background/50 rounded p-2 font-mono text-xs">
                            Example: 0x53 → S-box → 0xED
                          </div>
                          <p className="text-muted-foreground">
                            <strong>Security:</strong> Provides resistance against differential and linear cryptanalysis
                          </p>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                        <h4 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-400"></div>
                          ShiftRows Operation
                        </h4>
                        <div className="space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            <strong>Purpose:</strong> Provides diffusion by mixing data across columns
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Process:</strong> Cyclically shift rows left by row number:
                          </p>
                          <div className="bg-background/50 rounded p-3 space-y-1">
                            <div className="text-blue-400">Row 0: [a, b, c, d] → [a, b, c, d] (no shift)</div>
                            <div className="text-blue-400">Row 1: [e, f, g, h] → [f, g, h, e] (shift left 1)</div>
                            <div className="text-blue-400">Row 2: [i, j, k, l] → [k, l, i, j] (shift left 2)</div>
                            <div className="text-blue-400">Row 3: [m, n, o, p] → [p, m, n, o] (shift left 3)</div>
                          </div>
                          <p className="text-muted-foreground">
                            <strong>Effect:</strong> Ensures that each column contains data from different original columns
                          </p>
                        </div>
                      </div>

                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                        <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-400"></div>
                          MixColumns Transformation
                        </h4>
                        <div className="space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            <strong>Purpose:</strong> Maximum diffusion - each output bit depends on all input bits
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Process:</strong> Matrix multiplication in GF(2⁸) using fixed polynomial:
                          </p>
                          <div className="bg-background/50 rounded p-3">
                            <div className="font-mono text-xs text-purple-400 mb-2">
                              [02 03 01 01]   [s₀]   [s'₀]
                              [01 02 03 01] × [s₁] = [s'₁]
                              [01 01 02 03]   [s₂]   [s'₂]
                              [03 01 01 02]   [s₃]   [s'₃]
                            </div>
                          </div>
                          <p className="text-muted-foreground">
                            <strong>Example:</strong> s'₀ = (2×s₀) ⊕ (3×s₁) ⊕ (1×s₂) ⊕ (1×s₃)
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Note:</strong> Omitted in final round to prevent easy attack on last round key
                          </p>
                        </div>
                      </div>

                      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                        <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-400"></div>
                          AddRoundKey Operation
                        </h4>
                        <div className="space-y-2 text-xs">
                          <p className="text-muted-foreground">
                            <strong>Purpose:</strong> Incorporates the secret key into the encryption process
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Process:</strong> Simple XOR between state matrix and round key matrix
                          </p>
                          <div className="bg-background/50 rounded p-2 font-mono text-xs text-green-400">
                            State[i][j] ⊕ RoundKey[i][j] = NewState[i][j]
                          </div>
                          <p className="text-muted-foreground">
                            <strong>Properties:</strong> Invertible (XOR is its own inverse), computationally efficient
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Schedule */}
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                      <h3 className="font-semibold text-yellow-400 mb-3">🔑 Key Expansion Algorithm</h3>
                      <div className="space-y-2 text-xs">
                        <p className="text-muted-foreground">
                          Generates 11 round keys (44 words) from the original 128-bit key using:
                        </p>
                        <ol className="list-decimal list-inside ml-4 space-y-1 text-muted-foreground">
                          <li><strong>RotWord:</strong> Cyclically rotates 4-byte word left by 1 position</li>
                          <li><strong>SubWord:</strong> Applies S-box to each byte of the word</li>
                          <li><strong>Rcon:</strong> Round constants (powers of x in GF(2⁸)): [01, 02, 04, 08, 10, 20, 40, 80, 1B, 36]</li>
                        </ol>
                        <div className="bg-background/50 rounded p-2 font-mono text-xs">
                          W[i] = W[i-4] ⊕ SubWord(RotWord(W[i-1])) ⊕ Rcon[i/4] (for i ≡ 0 mod 4)
                        </div>
                      </div>
                    </div>

                    {/* Security Properties */}
                    <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                      <h3 className="font-semibold text-green-400 mb-3">🛡️ Security Properties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Cryptographic Properties:</h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li><strong>Confusion:</strong> Output bits have complex dependency on key bits</li>
                            <li><strong>Diffusion:</strong> Single bit change affects ~50% of output bits</li>
                            <li><strong>Avalanche Effect:</strong> Small input changes cause large output changes</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Attack Resistance:</h4>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li><strong>Brute Force:</strong> 2¹²⁸ key space (computationally infeasible)</li>
                            <li><strong>Differential:</strong> Resistant due to S-box design</li>
                            <li><strong>Linear:</strong> Low linear bias in S-box</li>
                            <li><strong>Related Key:</strong> Strong key schedule prevents attacks</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Implementation Notes */}
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                      <h3 className="font-semibold text-blue-400 mb-3">⚡ Implementation & Performance</h3>
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Hardware Optimizations:</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>AES-NI instructions on modern CPUs</li>
                              <li>Lookup table implementations</li>
                              <li>Parallel processing of independent blocks</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-1">Side-Channel Considerations:</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Timing attack mitigation</li>
                              <li>Cache-timing resistance</li>
                              <li>Power analysis protection</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Standards & Usage */}
                    <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                      <h3 className="font-semibold text-indigo-400 mb-3">📜 Standards & Real-World Usage</h3>
                      <div className="space-y-2 text-xs">
                        <p className="text-muted-foreground">
                          <strong>Standardization:</strong> NIST FIPS 197 (2001), ISO/IEC 18033-3 (2005)
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Common Applications:</strong> TLS/SSL, VPNs, disk encryption, wireless security (WPA2/3), government communications
                        </p>
                        <div className="bg-background/50 rounded p-2">
                          <p className="text-muted-foreground">
                            <strong>Modes of Operation:</strong> CBC, GCM, CTR, ECB (not recommended), XTS (disk encryption)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext (16 bytes)" : "Ciphertext (32 hex characters)"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(mode === "encrypt" ? e.target.value.slice(0, 16) : e.target.value.slice(0, 32))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={mode === "encrypt" ? "Enter 16 characters..." : "Enter 32 hex chars (e.g., 69C4E0D86A7B0430D8CDB78070B4C55A)"}
                maxLength={mode === "encrypt" ? 16 : 32}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "encrypt" ? `${inputText.length}/16 bytes` : `${inputText.length}/32 hex chars`}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Key (128-bit)
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value.slice(0, 16))}
                  className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-12 font-mono text-lg text-secondary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                  placeholder="Enter 16 char key..."
                  maxLength={16}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
              <Button
                onClick={() => {
                  if (!hasAnimated) {
                    startAnimation();
                  }
                  setActiveStep(steps.length - 1);
                }}
                variant="outline"
                size="icon"
                disabled={!steps.length}
                title="Skip to end"
              >
                <FastForward className="w-4 h-4" />
              </Button>
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend - Tape Style */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-center">
                <div className="flex gap-0">
                  <div className="flex items-center gap-1 px-2 py-1 border-y border-l rounded-l-md bg-gradient-to-b from-orange-500/20 to-orange-500/5 border-orange-500/40">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    <span className="text-[10px] text-orange-400 font-medium">SubBytes</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 border-y bg-gradient-to-b from-blue-500/20 to-blue-500/5 border-blue-500/40">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-[10px] text-blue-400 font-medium">ShiftRows</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 border-y bg-gradient-to-b from-purple-500/20 to-purple-500/5 border-purple-500/40">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-[10px] text-purple-400 font-medium">MixColumns</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 border-y border-r rounded-r-md bg-gradient-to-b from-green-500/20 to-green-500/5 border-green-500/40">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[10px] text-green-400 font-medium">AddRoundKey</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current State Output (During Animation) - Hide when complete */}
            {!(hasAnimated && !isAnimating && activeStep >= steps.length - 1) && (
              <div className={cn(
                "rounded-lg p-3 border",
                mode === "decrypt" 
                  ? "bg-muted/30 border-muted" 
                  : "bg-muted/30 border-muted"
              )}>
                <div className="text-xs text-muted-foreground mb-1">
                  {mode === "encrypt" ? "Current State (Hex)" : "Current State (Hex)"}
                </div>
                <div className="font-mono text-sm break-all min-h-[40px] flex items-center text-muted-foreground">
                  {hasAnimated && steps.length > 0 && currentStep
                    ? stateToHex(currentStep.state).flat().join("")
                    : "Click Animate to see transformation"}
                </div>
              </div>
            )}

            {/* Final Output (Only when animation completes) */}
            {hasAnimated && !isAnimating && activeStep >= steps.length - 1 && (
              <div className={cn(
                "rounded-lg p-4 border-2",
                mode === "decrypt" 
                  ? "bg-green-500/10 border-green-500/50" 
                  : "bg-primary/10 border-primary/50"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-sm font-semibold">
                      {mode === "encrypt" ? "Final Ciphertext" : "Final Plaintext"}
                    </div>
                  </div>
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
                      if (steps.length > 0) {
                        if (mode === "encrypt") {
                          // Encrypt → Decrypt: Pass ciphertext as hex
                          const cipherHex = stateToHex(steps[steps.length - 1].state).flat().join("");
                          setInputText(cipherHex);
                        } else {
                          // Decrypt → Encrypt: Pass plaintext
                          const plaintext = stateToText(steps[steps.length - 1].state) || "";
                          setInputText(plaintext);
                        }
                      }
                      setMode(mode === "encrypt" ? "decrypt" : "encrypt");
                      resetAnimation();
                    }}
                  >
                    {mode === "encrypt" ? "→ Decrypt" : "→ Encrypt"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className={cn(
                    "font-mono text-lg font-bold break-all",
                    mode === "decrypt" ? "text-green-400" : "text-primary"
                  )}>
                    {mode === "encrypt" 
                      ? stateToText(steps[steps.length - 1].state) || stateToHex(steps[steps.length - 1].state).flat().join("")
                      : stateToText(steps[steps.length - 1].state) || stateToHex(steps[steps.length - 1].state).flat().join("")}
                  </div>
                  {mode === "encrypt" && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Hex: {stateToHex(steps[steps.length - 1].state).flat().join("")}
                    </div>
                  )}
                  {mode === "decrypt" && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Bytes: {stateToHex(steps[steps.length - 1].state).flat().join(" ")}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {mode === "encrypt" ? "Encrypted bytes as text (Hex below)" : "Decrypted message"}
                </div>
              </div>
            )}
          </div>

          {/* Right - Step Navigation & State */}
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
                      Step {displayStep + 1}/{steps.length} • Round {currentStep?.round || 0}
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

                {/* Before and After States */}
                {currentStep && (
                  <div className="space-y-4">
                    {/* Special visualization for Block to State */}
                    {currentStep.name === "Block to State" ? (
                      <div className="rounded-xl p-4 space-y-4 border border-primary/30 shadow-lg">
                        <h4 className="font-bold text-primary text-center text-sm">Block to State Conversion</h4>
                        
                        {/* Horizontal Layout: Input Block Tape → State Matrix */}
                        <div className="flex flex-col items-center justify-center gap-6">
                          {/* Input Block - Horizontal Tape */}
                          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex flex-col items-center">
                              <div className="text-xs font-medium text-muted-foreground mb-2">Input Block (16 bytes)</div>
                              <div className="flex items-center">
                                {currentStep.state.flat().map((byte, i) => (
                                  <div 
                                    key={i} 
                                    className={cn(
                                      "w-8 h-10 md:w-10 md:h-12 flex flex-col items-center justify-center font-mono text-xs md:text-sm font-semibold transition-all duration-300 border-y border-l bg-gradient-to-b from-muted/40 to-muted/20 border-border/50 text-foreground/70 hover:brightness-125 cursor-default",
                                      i === 0 && "rounded-l-lg",
                                      i === 15 && "rounded-r-lg border-r"
                                    )}
                                  >
                                    <span>{byte.toString(16).padStart(2, '0').toUpperCase()}</span>
                                    <span className="text-[7px] text-muted-foreground/60">{i}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow pointing down */}
                          <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-300 delay-100">
                            <div className="text-2xl text-primary font-bold">↓</div>
                            <div className="text-[10px] bg-primary/20 px-2 py-0.5 rounded-full text-primary font-medium">Column-Major</div>
                          </div>
                          
                          {/* State Matrix - After */}
                          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="flex flex-col items-center group">
                              <div className="text-xs font-medium text-muted-foreground mb-2">State Matrix (4×4)</div>
                              <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-background/50 to-background/80 ring-1 ring-primary/30 transition-all duration-300 hover:scale-105">
                                <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                                  {[0, 1, 2, 3].map(row => 
                                    [0, 1, 2, 3].map(col => {
                                      const byte = currentStep.state[col][row];
                                      const linearIdx = col * 4 + row;
                                      return (
                                        <div
                                          key={`${row}-${col}`}
                                          className="w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center font-mono text-sm md:text-base font-semibold transition-all duration-300 rounded-md border bg-gradient-to-b from-primary/30 to-primary/10 border-primary/50 text-primary hover:brightness-125 cursor-default"
                                        >
                                          <span>{byte.toString(16).padStart(2, '0').toUpperCase()}</span>
                                          <span className="text-[8px] text-primary/60">{linearIdx}</span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mapping explanation tape */}
                        <div className="bg-background/60 rounded-xl p-3 border border-primary/20">
                          <h6 className="text-xs text-primary mb-2 text-center font-semibold">Column-Major Mapping</h6>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {[0, 1, 2, 3].map(col => (
                              <div key={col} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-[10px] text-primary font-semibold">Col {col}:</span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  [{col * 4},{col * 4 + 1},{col * 4 + 2},{col * 4 + 3}]
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : currentStep.operation === "subbytes" ? (
                      /* SubBytes gets special integrated visualization */
                      <SubBytesDiagram prevState={currentStep.prevState} state={currentStep.state} />
                    ) : currentStep.operation === "shiftrows" ? (
                      /* ShiftRows gets special integrated visualization */
                      <ShiftRowsDiagram prevState={currentStep.prevState} state={currentStep.state} />
                    ) : currentStep.operation === "mixcolumns" ? (
                      /* MixColumns gets special integrated visualization */
                      <MixColumnsDiagram prevState={currentStep.prevState} state={currentStep.state} />
                    ) : currentStep.operation === "addroundkey" && currentStep.roundKey ? (
                      /* AddRoundKey gets special integrated visualization */
                      <AddRoundKeyDiagram prevState={currentStep.prevState} state={currentStep.state} roundKey={currentStep.roundKey} />
                    ) : currentStep.operation === "keyexpansion" && currentStep.roundKeys ? (
                      /* Key Expansion gets special integrated visualization */
                      <KeyExpansionDiagram roundKeys={currentStep.roundKeys} originalKey={key} />
                    ) : (
                      /* Normal state visualization for other operations */
                      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                          <StateMatrix 
                            state={currentStep.prevState} 
                            label="Before" 
                            colorClass="bg-muted/50 text-muted-foreground border-muted"
                          />
                        </div>
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300 delay-200">
                          <div className="text-2xl md:text-3xl animate-pulse text-primary">
                            →
                          </div>
                          <div className="text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-lg bg-primary/30 text-primary ring-2 ring-primary/50">
                            {currentStep.operation.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                          <StateMatrix 
                            state={currentStep.state} 
                            label="After" 
                            highlight
                            colorClass="bg-primary/10 text-primary border-primary"
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      {currentStep?.description}
                    </p>
                  </div>
                )}

                {/* AES Round Structure - Tape Design */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-center">Round Structure</h4>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-0">
                      <div className="px-2 py-1 border-y border-l rounded-l-md bg-gradient-to-b from-muted/30 to-muted/10 border-border text-[10px] font-medium">Input</div>
                      <div className="px-2 py-1 border-y bg-gradient-to-b from-green-500/20 to-green-500/5 border-green-500/40 text-[10px] text-green-400 font-medium">Add</div>
                      <div className="px-2 py-1 border-y bg-gradient-to-b from-muted/20 to-muted/5 border-border flex items-center gap-0.5">
                        <span className="text-[9px] text-muted-foreground">×9:</span>
                        <span className="text-[10px] text-orange-400 font-bold">S</span>
                        <span className="text-[10px] text-blue-400 font-bold">R</span>
                        <span className="text-[10px] text-purple-400 font-bold">M</span>
                        <span className="text-[10px] text-green-400 font-bold">A</span>
                      </div>
                      <div className="px-2 py-1 border-y border-r rounded-r-md bg-gradient-to-b from-primary/20 to-primary/5 border-primary/50 flex items-center gap-0.5">
                        <span className="text-[10px] text-orange-400 font-bold">S</span>
                        <span className="text-[10px] text-blue-400 font-bold">R</span>
                        <span className="text-[10px] text-green-400 font-bold">A</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <p className="text-sm italic">Click Animate to see AES steps</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </CipherLayout>
  );
}
