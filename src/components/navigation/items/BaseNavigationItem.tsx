import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BaseNavigationItemProps {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  collapsed?: boolean;
  delay?: number;
  variant?: 'navigation' | 'tool';
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const BaseNavigationItem = React.memo(({
  name,
  href,
  icon: Icon,
  description,
  collapsed = false,
  delay = 0,
  variant = 'navigation',
  onClick,
  isActive: propIsActive,
  className
}: BaseNavigationItemProps) => {
  const pathname = usePathname();
  const isActive = propIsActive ?? pathname === href;
  const [isMounted, setIsMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isToolVariant = variant === 'tool';
  const isLink = href && href !== '#background-bar';

  const baseClasses = cn(
    "group relative flex items-center font-medium text-white transition-all duration-300 ease-out transform hover:scale-105",
    "rounded-xl overflow-hidden",
    collapsed
      ? "w-16 h-16 justify-center"
      : isToolVariant ? "gap-3 px-3 py-2" : "gap-2 px-3 py-2.5 pl-5",
    className
  );

  const content = (
    <>
      {/* Background layer with gradient animation - only for navigation variant */}
      {variant === 'navigation' && (
        <div 
          className={cn(
            "absolute inset-0 z-0 transition-all duration-500 ease-out",
            isActive 
              ? "bg-gradient-to-r from-white/15 to-purple-500/10" 
              : "bg-transparent group-hover:bg-white/5"
          )}
        />
      )}
      
      {/* Glowing border effect on active/hover - only for navigation variant */}
      {variant === 'navigation' && (
        <div 
          className={cn(
            "absolute inset-0 z-10 rounded-xl transition-all duration-400 ease-out",
            "border-2 border-transparent"
          )}
          style={{
            boxShadow: isActive 
              ? '0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)'
              : isHovering
                ? '0 0 8px rgba(255, 255, 255, 0.2)'
                : 'none'
          }}
        />
      )}

      {/* Icon container */}
      <div 
        className={cn(
          "relative z-20 flex-shrink-0 transition-all duration-400 ease-out transform",
          collapsed ? "w-6 h-6" : isToolVariant ? "w-5 h-5" : "w-5 h-5",
          isHovering && !isActive && "scale-110",
          isActive && "scale-110"
        )}
      >
        <div className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          variant === 'navigation' 
            ? (isActive ? "text-white" : "text-blue-200 group-hover:text-white")
            : "text-white"
        )}>
          <Icon 
            className={cn(
              "transition-all duration-300 transform",
              variant === 'navigation' && isActive && "rotate-12"
            )}
          />
          {/* Pulse animation for active state - only for navigation variant */}
          {variant === 'navigation' && isActive && (
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.7)',
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </div>
      </div>

      {/* Content with smooth entrance animation - only for non-collapsed state */}
      {!collapsed && (
        <div 
          className={cn(
            "relative z-20 flex-1 min-w-0 transition-all duration-400 ease-out",
            !isMounted && "opacity-0 translate-x-2"
          )}
        >
          {variant === 'navigation' ? (
            <>
              <div 
                className={cn(
                  "font-medium transition-all duration-400 ease-out leading-tight",
                  isActive 
                    ? "text-white translate-x-0 opacity-100"
                    : "text-blue-100 group-hover:text-white",
                  !isMounted && "translate-x-1 opacity-0"
                )}
                style={{
                  transitionDelay: `${delay + 100}ms`
                }}
              >
                {name}
              </div>
              {description && (
                <div 
                  className={cn(
                    "text-sm transition-all duration-400 ease-out truncate opacity-90",
                    isActive 
                      ? "text-blue-200 translate-x-0 opacity-100"
                      : "text-blue-300 group-hover:text-blue-200",
                    !isMounted && "translate-x-1 opacity-0"
                  )}
                  style={{
                    transitionDelay: `${delay + 200}ms`
                  }}
                >
                  {description}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm font-medium">{name}</div>
          )}
        </div>
      )}

      {/* Modern active indicator with gradient and glow - only for navigation variant */}
      {variant === 'navigation' && isActive && !collapsed && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 rounded-full"
          style={{
            height: 'calc(100% - 0.75rem)',
            background: 'linear-gradient(to bottom, #6366f1, #8b5cf6, #ec4899)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.8), 0 0 20px rgba(236, 72, 153, 0.6)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}

      {/* Ripple effect on click - only for navigation variant */}
      {variant === 'navigation' && (
        <div 
          className={cn(
            "absolute inset-0 z-30 rounded-xl opacity-0 transition-opacity duration-500 ease-out",
            "bg-white/20"
          )}
          style={{
            transform: 'scale(0.9)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
    </>
  );

  const props = {
    onMouseEnter: () => setIsHovering(true),
    onMouseLeave: () => setIsHovering(false),
    className: baseClasses,
    title: collapsed ? name : undefined,
    style: {
      transitionDelay: `${delay}ms`
    },
    onClick
  };

  if (isLink) {
    return (
      <Link href={href} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <div {...props}>
      {content}
    </div>
  );
});

// Add keyframes for animations - only on client side
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px) translateX(0);
      }
      to {
        opacity: 1;
        transform: translateY(0) translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
}

BaseNavigationItem.displayName = "BaseNavigationItem";
