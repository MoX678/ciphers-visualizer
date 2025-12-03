import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CipherCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  difficulty?: "Easy" | "Medium" | "Advanced";
  delay?: number;
}

const difficultyColors = {
  Easy: "text-primary",
  Medium: "text-secondary",
  Advanced: "text-accent",
};

export function CipherCard({ title, description, icon, href, difficulty, delay = 0 }: CipherCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative glass-card p-6 hover:border-primary/50 transition-all duration-500",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          {difficulty && (
            <span className={cn("text-xs font-medium", difficultyColors[difficulty])}>
              {difficulty}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Explore</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
