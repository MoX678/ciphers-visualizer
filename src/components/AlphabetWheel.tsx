import { cn } from "@/lib/utils";

interface AlphabetWheelProps {
  shift: number;
  highlightedInput?: string;
  highlightedOutput?: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetWheel({ shift, highlightedInput, highlightedOutput }: AlphabetWheelProps) {
  const shiftedAlphabet = [...ALPHABET.slice(shift), ...ALPHABET.slice(0, shift)];
  
  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
      <div className="min-w-max p-3 rounded-xl bg-gradient-to-br from-muted/20 to-muted/5 border border-border/30">
        {/* Original alphabet - Input Row */}
        <div className="flex gap-0.5">
          <div className="w-16 h-9 flex items-center justify-end pr-2">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wide transition-colors",
              highlightedInput ? "text-blue-400" : "text-muted-foreground/60"
            )}>Plain</span>
          </div>
          {ALPHABET.map((letter, i) => {
            const isHighlighted = highlightedInput === letter;
            return (
              <div
                key={`orig-${i}`}
                className={cn(
                  "w-9 h-9 flex flex-col items-center justify-center font-mono text-sm rounded-lg transition-all duration-200",
                  isHighlighted
                    ? "bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30 scale-110 z-10"
                    : "bg-muted/30 text-foreground/50 hover:bg-muted/50 hover:text-foreground/70"
                )}
              >
                <span className="font-medium">{letter}</span>
                <span className="text-[8px] opacity-50">{i}</span>
              </div>
            );
          })}
        </div>
        
        {/* Shift indicator row */}
        <div className="flex gap-0.5 mt-0.5">
          <div className="w-16 h-6 flex items-center justify-end pr-2">
            <span className={cn(
              "text-[10px] font-mono transition-colors",
              highlightedInput ? "text-amber-400" : "text-muted-foreground/40"
            )}>+{shift}</span>
          </div>
          {ALPHABET.map((_, i) => {
            const isHighlighted = highlightedInput === ALPHABET[i];
            return (
              <div 
                key={`arrow-${i}`} 
                className={cn(
                  "w-9 h-6 flex items-center justify-center transition-all duration-200",
                  isHighlighted ? "text-amber-400 scale-125" : "text-muted-foreground/20"
                )}
              >
                ↓
              </div>
            );
          })}
        </div>
        
        {/* Shifted alphabet - Output Row */}
        <div className="flex gap-0.5 mt-0.5">
          <div className="w-16 h-9 flex items-center justify-end pr-2">
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wide transition-colors",
              highlightedOutput ? "text-primary" : "text-muted-foreground/60"
            )}>Cipher</span>
          </div>
          {shiftedAlphabet.map((letter, i) => {
            const isHighlighted = highlightedOutput === letter && highlightedInput === ALPHABET[i];
            return (
              <div
                key={`shift-${i}`}
                className={cn(
                  "w-9 h-9 flex flex-col items-center justify-center font-mono text-sm rounded-lg transition-all duration-200",
                  isHighlighted
                    ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary shadow-lg shadow-primary/40 scale-110 z-20"
                    : "bg-muted/30 text-foreground/50 hover:bg-muted/50 hover:text-foreground/70"
                )}
              >
                <span className="font-medium">{letter}</span>
                <span className="text-[8px] opacity-50">{ALPHABET.indexOf(letter)}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-xs">
          <div className={cn(
            "w-3 h-3 rounded border transition-colors",
            highlightedInput ? "bg-blue-500/50 border-blue-500" : "bg-muted/50 border-border"
          )}></div>
          <span className="text-muted-foreground">Plaintext</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className={cn(
            "w-3 h-3 rounded border transition-colors",
            highlightedInput ? "bg-amber-500/50 border-amber-500" : "bg-muted/50 border-border"
          )}></div>
          <span className="text-muted-foreground">Shift (+{shift})</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className={cn(
            "w-3 h-3 rounded border transition-colors",
            highlightedOutput ? "bg-primary/50 border-primary" : "bg-muted/50 border-border"
          )}></div>
          <span className="text-muted-foreground">Ciphertext</span>
        </div>
      </div>
    </div>
  );
}
