import { useState, useEffect } from "react";
import { CipherLayout } from "@/components/CipherLayout";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Eye, EyeOff, ChevronLeft, ChevronRight, Info } from "lucide-react";

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
type OperationType = "initial" | "subbytes" | "shiftrows" | "mixcolumns" | "addroundkey";
type AESStep = {
  name: string;
  description: string;
  state: AESState;
  prevState: AESState;
  operation: OperationType;
  round: number;
  roundKey?: AESState;
};

// Helper functions
function textToState(text: string): AESState {
  const bytes = new Array(16).fill(0);
  for (let i = 0; i < Math.min(text.length, 16); i++) {
    bytes[i] = text.charCodeAt(i);
  }
  const state: AESState = [];
  for (let c = 0; c < 4; c++) {
    state.push([bytes[c * 4], bytes[c * 4 + 1], bytes[c * 4 + 2], bytes[c * 4 + 3]]);
  }
  return state;
}

function stateToHex(state: AESState): string[][] {
  return state.map(col => col.map(b => b.toString(16).padStart(2, '0').toUpperCase()));
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
  let state = textToState(plaintext);
  const roundKeys = keyExpansion(key);
  
  const initialState = copyState(state);
  steps.push({
    name: "Initial State",
    description: "Convert plaintext to 4×4 byte matrix (column-major order)",
    state: copyState(state),
    prevState: initialState,
    operation: "initial",
    round: 0,
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
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className={`grid grid-cols-4 gap-1 p-2 rounded-lg ${highlight ? "ring-2 ring-primary" : ""}`}>
        {[0, 1, 2, 3].map(row => (
          [0, 1, 2, 3].map(col => (
            <div
              key={`${row}-${col}`}
              className={`w-10 h-10 flex items-center justify-center font-mono text-xs rounded transition-all border ${colorClass}`}
            >
              {hex[col][row]}
            </div>
          ))
        ))}
      </div>
    </div>
  );
}

// Operation Diagram Components
function SubBytesDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);
  const exampleRow = 0;
  const exampleCol = 0;
  const inputByte = prevHex[exampleCol][exampleRow];
  const outputByte = currHex[exampleCol][exampleRow];
  const row = parseInt(inputByte[0], 16);
  const col = parseInt(inputByte[1], 16);

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-orange-400 text-center">SubBytes Operation</h4>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Input Byte</div>
          <div className="w-12 h-12 bg-orange-500/20 rounded flex items-center justify-center font-mono text-lg text-orange-400 border border-orange-500/50">
            {inputByte}
          </div>
        </div>
        <div className="text-2xl text-orange-400">→</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">S-box[{row}][{col}]</div>
          <div className="w-12 h-12 bg-orange-500/30 rounded flex items-center justify-center font-mono text-lg text-orange-300 border border-orange-500/50">
            {outputByte}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Each byte is replaced by looking up row (first hex digit) and column (second hex digit) in S-box
      </p>
    </div>
  );
}

function ShiftRowsDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-blue-400 text-center">ShiftRows Operation</h4>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">Before</div>
          {[0, 1, 2, 3].map(row => (
            <div key={row} className="flex gap-1 items-center">
              <span className="text-xs text-muted-foreground w-16">Row {row} ←{row}</span>
              {[0, 1, 2, 3].map(col => (
                <div
                  key={col}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-xs rounded ${
                    row === 0 ? "bg-blue-500/20 text-blue-400" :
                    row === 1 ? "bg-green-500/20 text-green-400" :
                    row === 2 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}
                >
                  {prevHex[col][row]}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="text-3xl text-blue-400">→</div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">After</div>
          {[0, 1, 2, 3].map(row => (
            <div key={row} className="flex gap-1">
              {[0, 1, 2, 3].map(col => (
                <div
                  key={col}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-xs rounded ${
                    row === 0 ? "bg-blue-500/20 text-blue-400" :
                    row === 1 ? "bg-green-500/20 text-green-400" :
                    row === 2 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}
                >
                  {currHex[col][row]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-4 text-xs">
        <span className="text-blue-400">Row 0: No shift</span>
        <span className="text-green-400">Row 1: Shift 1</span>
        <span className="text-yellow-400">Row 2: Shift 2</span>
        <span className="text-red-400">Row 3: Shift 3</span>
      </div>
    </div>
  );
}

function MixColumnsDiagram({ prevState, state }: { prevState: AESState; state: AESState }) {
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-purple-400 text-center">MixColumns Operation</h4>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Fixed Matrix</div>
          <div className="grid grid-cols-4 gap-0.5 bg-purple-500/20 p-2 rounded">
            {[[2,3,1,1],[1,2,3,1],[1,1,2,3],[3,1,1,2]].map((row, i) => (
              row.map((val, j) => (
                <div key={`${i}-${j}`} className="w-6 h-6 flex items-center justify-center font-mono text-xs text-purple-400">
                  {val}
                </div>
              ))
            ))}
          </div>
        </div>
        <div className="text-xl text-muted-foreground">×</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Column 0</div>
          <div className="flex flex-col gap-0.5 bg-purple-500/20 p-2 rounded">
            {[0, 1, 2, 3].map(row => (
              <div key={row} className="w-8 h-6 flex items-center justify-center font-mono text-xs text-purple-400">
                {prevHex[0][row]}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xl text-muted-foreground">=</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">New Column 0</div>
          <div className="flex flex-col gap-0.5 bg-purple-500/30 p-2 rounded">
            {[0, 1, 2, 3].map(row => (
              <div key={row} className="w-8 h-6 flex items-center justify-center font-mono text-xs text-purple-300">
                {currHex[0][row]}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Each column is multiplied by a fixed matrix in GF(2⁸). This provides diffusion.
      </p>
    </div>
  );
}

function AddRoundKeyDiagram({ prevState, state, roundKey }: { prevState: AESState; state: AESState; roundKey?: AESState }) {
  const prevHex = stateToHex(prevState);
  const currHex = stateToHex(state);
  const keyHex = roundKey ? stateToHex(roundKey) : null;

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-green-400 text-center">AddRoundKey Operation</h4>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">State</div>
          <div className="grid grid-cols-4 gap-0.5 p-1 rounded bg-muted/50">
            {[0, 1, 2, 3].map(row => (
              [0, 1, 2, 3].map(col => (
                <div key={`${row}-${col}`} className="w-7 h-7 flex items-center justify-center font-mono text-[10px] text-foreground">
                  {prevHex[col][row]}
                </div>
              ))
            ))}
          </div>
        </div>
        <div className="text-xl text-green-400">⊕</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Round Key</div>
          <div className="grid grid-cols-4 gap-0.5 p-1 rounded bg-green-500/20">
            {keyHex && [0, 1, 2, 3].map(row => (
              [0, 1, 2, 3].map(col => (
                <div key={`${row}-${col}`} className="w-7 h-7 flex items-center justify-center font-mono text-[10px] text-green-400">
                  {keyHex[col][row]}
                </div>
              ))
            ))}
          </div>
        </div>
        <div className="text-xl text-green-400">=</div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Result</div>
          <div className="grid grid-cols-4 gap-0.5 p-1 rounded bg-green-500/30">
            {[0, 1, 2, 3].map(row => (
              [0, 1, 2, 3].map(col => (
                <div key={`${row}-${col}`} className="w-7 h-7 flex items-center justify-center font-mono text-[10px] text-green-300">
                  {currHex[col][row]}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        XOR each byte of the state with the corresponding byte of the round key
      </p>
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

  const paddedInput = inputText.padEnd(16, '\0').slice(0, 16);
  const paddedKey = key.padEnd(16, '\0').slice(0, 16);

  useEffect(() => {
    if (mode === "encrypt") {
      setSteps(aesEncryptWithSteps(paddedInput, paddedKey));
    } else {
      const encryptedSteps = aesEncryptWithSteps(paddedInput, paddedKey);
      const cipherState = encryptedSteps[encryptedSteps.length - 1].state;
      setSteps(aesDecryptWithSteps(cipherState, paddedKey));
    }
    // Reset animation state when inputs change
    setHasAnimated(false);
    setActiveStep(-1);
  }, [paddedInput, paddedKey, mode]);

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
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>How AES Encryption Works</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-xs space-y-3">
                      <div className="bg-muted/20 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2">📊 AES Parameters</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Block size: <span className="text-primary">128 bits</span> (16 bytes)</li>
                          <li>Key size: <span className="text-primary">128 bits</span> (this demo)</li>
                          <li>Rounds: <span className="text-primary">10</span></li>
                        </ul>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2">🔄 Round Operations</h4>
                        <div className="space-y-1 text-muted-foreground">
                          <p><span className="text-orange-400">● SubBytes:</span> S-box substitution</p>
                          <p><span className="text-blue-400">● ShiftRows:</span> Row rotation</p>
                          <p><span className="text-purple-400">● MixColumns:</span> Column mixing (not in last round)</p>
                          <p><span className="text-green-400">● AddRoundKey:</span> XOR with round key</p>
                        </div>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                        <h4 className="font-medium text-green-400 mb-2">✅ Security</h4>
                        <p className="text-muted-foreground">
                          AES is the current standard for symmetric encryption, used worldwide for securing data.
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {mode === "encrypt" ? "Plaintext (16 bytes)" : "Input Text"}
              </label>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 16))}
                className="w-full bg-input border border-border rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter 16 characters..."
                maxLength={16}
              />
              <p className="text-xs text-muted-foreground mt-1">{inputText.length}/16 bytes</p>
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
              <Button onClick={resetAnimation} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-orange-400" />
                  <span className="text-muted-foreground">SubBytes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-blue-400" />
                  <span className="text-muted-foreground">ShiftRows</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-purple-400" />
                  <span className="text-muted-foreground">MixColumns</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-green-400" />
                  <span className="text-muted-foreground">AddRoundKey</span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className={cn(
              "rounded-lg p-3 border",
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
                      setMode(mode === "encrypt" ? "decrypt" : "encrypt");
                      resetAnimation();
                    }}
                  >
                    {mode === "encrypt" ? "→ Decrypt" : "→ Encrypt"}
                  </Button>
                )}
              </div>
              <div className={cn(
                "font-mono text-sm break-all",
                mode === "decrypt" ? "text-green-500" : "text-primary"
              )}>
                {hasAnimated && steps.length > 0 
                  ? stateToHex(steps[steps.length - 1].state).flat().join("")
                  : "Click Animate to see result"}
              </div>
            </div>
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

                {/* Current State Matrix */}
                {currentStep && (
              <div className="flex justify-center">
                <StateMatrix 
                  state={currentStep.state} 
                  label="Current State" 
                  highlight
                  colorClass={`border ${
                    currentStep.operation === "subbytes" ? "bg-orange-500/10 text-orange-400 border-orange-500/50" :
                    currentStep.operation === "shiftrows" ? "bg-blue-500/10 text-blue-400 border-blue-500/50" :
                    currentStep.operation === "mixcolumns" ? "bg-purple-500/10 text-purple-400 border-purple-500/50" :
                    currentStep.operation === "addroundkey" ? "bg-green-500/10 text-green-400 border-green-500/50" :
                    "bg-primary/10 text-primary border-primary/50"
                  }`}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {currentStep?.description}
            </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
                <p className="text-sm italic">Click Animate to see AES steps</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Visualization - Full Width */}
        {currentStep && (
          <div className="glass-card p-5 space-y-4">
            {/* Before and After States */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <StateMatrix 
                state={currentStep.prevState} 
                label="Before" 
                colorClass="bg-muted/50 text-muted-foreground border-border"
              />
              <div className="flex flex-col items-center gap-1">
                <div className={`text-3xl ${
                  currentStep.operation === "subbytes" ? "text-orange-400" :
                  currentStep.operation === "shiftrows" ? "text-blue-400" :
                  currentStep.operation === "mixcolumns" ? "text-purple-400" :
                  currentStep.operation === "addroundkey" ? "text-green-400" :
                  "text-primary"
                }`}>
                  →
                </div>
                <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                  currentStep.operation === "subbytes" ? "bg-orange-500/20 text-orange-400" :
                  currentStep.operation === "shiftrows" ? "bg-blue-500/20 text-blue-400" :
                  currentStep.operation === "mixcolumns" ? "bg-purple-500/20 text-purple-400" :
                  currentStep.operation === "addroundkey" ? "bg-green-500/20 text-green-400" :
                  "bg-primary/20 text-primary"
                }`}>
                  {currentStep.operation.toUpperCase()}
                </div>
              </div>
              <StateMatrix 
                state={currentStep.state} 
                label="After" 
                highlight
                colorClass={`border ${
                  currentStep.operation === "subbytes" ? "bg-orange-500/10 text-orange-400 border-orange-500/50" :
                  currentStep.operation === "shiftrows" ? "bg-blue-500/10 text-blue-400 border-blue-500/50" :
                  currentStep.operation === "mixcolumns" ? "bg-purple-500/10 text-purple-400 border-purple-500/50" :
                  currentStep.operation === "addroundkey" ? "bg-green-500/10 text-green-400 border-green-500/50" :
                  "bg-primary/10 text-primary border-primary/50"
                }`}
              />
            </div>

            {/* Operation-specific diagrams */}
            {currentStep.operation === "subbytes" && (
              <SubBytesDiagram prevState={currentStep.prevState} state={currentStep.state} />
            )}
            {currentStep.operation === "shiftrows" && (
              <ShiftRowsDiagram prevState={currentStep.prevState} state={currentStep.state} />
            )}
            {currentStep.operation === "mixcolumns" && (
              <MixColumnsDiagram prevState={currentStep.prevState} state={currentStep.state} />
            )}
            {currentStep.operation === "addroundkey" && currentStep.roundKey && (
              <AddRoundKeyDiagram prevState={currentStep.prevState} state={currentStep.state} roundKey={currentStep.roundKey} />
            )}
          </div>
        )}

        {/* Round Overview - Full Width */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">AES Round Structure</h3>
          <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs">
            <div className="px-2 py-1 rounded bg-muted text-foreground">Input</div>
            <span className="text-muted-foreground">→</span>
            <div className="px-2 py-1 rounded bg-green-500/20 text-green-400">AddRoundKey</div>
            <span className="text-muted-foreground">→</span>
            <div className="border border-dashed border-muted-foreground rounded px-2 py-1 flex items-center gap-1">
              <span className="text-muted-foreground">×9:</span>
              <span className="text-orange-400">Sub</span>
              <span className="text-blue-400">Shift</span>
              <span className="text-purple-400">Mix</span>
              <span className="text-green-400">Add</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="border border-primary rounded px-2 py-1 flex items-center gap-1">
              <span className="text-orange-400">Sub</span>
              <span className="text-blue-400">Shift</span>
              <span className="text-green-400">Add</span>
            </div>
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
                className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center gap-2 ${
                  idx === displayStep
                    ? "bg-primary/20 border border-primary"
                    : idx < displayStep
                    ? "bg-muted/30 border border-transparent"
                    : "bg-transparent border border-transparent hover:bg-muted/20"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                  idx === displayStep ? "bg-primary text-primary-foreground" :
                  idx < displayStep ? "bg-muted-foreground/50 text-background" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {idx + 1}
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  step.operation === "subbytes" ? "bg-orange-400" :
                  step.operation === "shiftrows" ? "bg-blue-400" :
                  step.operation === "mixcolumns" ? "bg-purple-400" :
                  step.operation === "addroundkey" ? "bg-green-400" :
                  "bg-gray-400"
                }`} />
                <span className="text-xs text-foreground truncate">{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </CipherLayout>
  );
}
