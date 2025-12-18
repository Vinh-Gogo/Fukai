import React from "react";
import { motion } from "framer-motion";

interface StatItem {
  label: string;
  value: string | number;
  icon: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export const StatsGrid = React.memo(({ stats }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="text-center p-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors duration-200"
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-3xl font-bold text-foreground mb-1">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
});

StatsGrid.displayName = "StatsGrid";
