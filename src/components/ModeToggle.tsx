import { cn } from "@/lib/utils";
import { Lock, Unlock } from "lucide-react";

interface ModeToggleProps {
  mode: "encrypt" | "decrypt";
  onChange: (mode: "encrypt" | "decrypt") => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="relative flex rounded-lg bg-muted/50 p-1 border border-border">
      {/* Sliding background indicator */}
      <div 
        className={cn(
          "absolute top-1 bottom-1 rounded-md transition-all duration-300 ease-out",
          mode === "encrypt" 
            ? "left-1 w-[calc(50%-2px)] bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]" 
            : "left-[calc(50%+1px)] w-[calc(50%-2px)] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        )}
      />
      
      <button
        onClick={() => onChange("encrypt")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300",
          mode === "encrypt"
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Lock className="w-4 h-4" />
        Encrypt
      </button>
      <button
        onClick={() => onChange("decrypt")}
        className={cn(
          "relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300",
          mode === "decrypt"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Unlock className="w-4 h-4" />
        Decrypt
      </button>
    </div>
  );
}
