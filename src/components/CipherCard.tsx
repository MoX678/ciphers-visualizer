import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface CipherCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  difficulty?: "Easy" | "Medium" | "Advanced";
  delay?: number;
  year?: string;
  category?: string;
  className?: string;
}

const difficultyColors = {
  Easy: "text-primary",
  Medium: "text-secondary",
  Advanced: "text-accent",
};

export function CipherCard({ title, description, icon, href, delay = 0, year, className }: CipherCardProps) {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Scroll to top first, then navigate
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(href);
  };

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col p-5 h-full",
        "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl",
        "hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]",
        "transition-all duration-500 ease-out",
        "opacity-0 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
          {icon}
        </div>
        {year && (
          <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded">
            {year}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-2">
        {description}
      </p>

      <div className="flex items-center text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
        <span className="mr-1">Explore</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
