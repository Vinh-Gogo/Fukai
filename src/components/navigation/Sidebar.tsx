import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right";
  width?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  children,
  className,
  position = "left",
  width = "w-64",
}) => {
  const sidebarVariants = {
    closed: {
      x: position === "left" ? "-100%" : "100%",
    },
    open: {
      x: 0,
    },
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
    },
    open: {
      opacity: 1,
    },
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={cn(
              "fixed top-0 bottom-0 bg-white border-r border-gray-200 shadow-lg z-50",
              "md:relative md:translate-x-0 md:shadow-none md:border-r",
              position === "right" && "right-0 border-l border-r-0",
              width,
              className,
            )}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <Button variant="icon" size="sm" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
