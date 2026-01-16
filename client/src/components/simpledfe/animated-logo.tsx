import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showPulse?: boolean;
}

export function AnimatedLogo({ size = "md", className, showPulse = false }: AnimatedLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-10 h-10"
  };

  return (
    <div className={cn(
      "inline-flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-2xl animate-float",
      sizeClasses[size],
      className
    )}>
      <div className="relative">
        <svg 
          className={cn(
            "text-white animate-document-emit",
            iconSizes[size]
          )} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
        {showPulse && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping"></div>
        )}
      </div>
    </div>
  );
}
