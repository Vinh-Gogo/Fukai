import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export const QuickActionCard = React.memo(
  ({
    icon: Icon,
    title,
    description,
    onClick,
    className,
  }: QuickActionCardProps) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group",
          className,
        )}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </motion.div>
    );
  },
);

QuickActionCard.displayName = "QuickActionCard";
