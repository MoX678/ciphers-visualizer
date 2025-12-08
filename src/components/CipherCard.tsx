import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

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

export function CipherCard({ title, description, icon, href, delay = 0 }: CipherCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col p-6 h-full",
        "bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl",
        "hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]",
        "transition-all duration-500 ease-out",
        "opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500">
          {icon}
        </div>

      </div>

      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-grow">
        {description}
      </p>

      <div className="flex items-center text-sm font-medium text-primary/80 group-hover:text-primary transition-colors">
        <span className="mr-2">Start Learning</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
