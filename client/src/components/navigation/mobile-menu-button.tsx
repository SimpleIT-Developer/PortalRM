import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden"
      onClick={onClick}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  );
}