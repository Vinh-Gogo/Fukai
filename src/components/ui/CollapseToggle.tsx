import React, { useState, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

// ============================================================================
// Types
// ============================================================================

interface CollapseToggleProps {
  collapsed: boolean;
  onClick: () => void;
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

// ============================================================================
// Custom Hook: useRandomPosition
// ============================================================================

// Generate random position only once on client
const generateRandomPosition = () => ({
  top: Math.random() * 70 + 10, // 10% to 80%
  left: Math.random() * 70 + 10,
});

const useRandomPosition = () => {
  // Lazy initialization - only runs on first render
  const [position] = useState(() => 
    typeof window !== 'undefined' ? generateRandomPosition() : { top: 50, left: 50 }
  );
  
  // Track if we're on client
  const [isMounted, setIsMounted] = useState(typeof window !== 'undefined');

  // For SSR: set mounted after hydration via subscription pattern
  useEffect(() => {
    if (!isMounted) {
      // Use requestAnimationFrame to avoid synchronous setState
      const id = requestAnimationFrame(() => setIsMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isMounted]);

  return { position, isMounted };
};

// ============================================================================
// Auth hook using Zustand store
// ============================================================================

const useAuth = () => {
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated)
  const { login: storeLogin, logout: storeLogout } = useAuthStore((state) => ({
    login: state.login,
    logout: state.logout
  }))

  // Wrap Zustand login to work with the component's expectations
  const login = useCallback(() => {
    // For demo purposes, create a mock user and token
    storeLogin({
      id: 'demo-user',
      email: 'demo@example.com',
      full_name: 'Demo User',
      is_active: true,
      created_at: new Date().toISOString()
    }, 'demo-token')
  }, [storeLogin])

  const logout = useCallback(() => {
    storeLogout()
  }, [storeLogout])

  return { isLoggedIn, login, logout }
}

// ============================================================================
// Custom Hook: useContextMenu
// ============================================================================

const useContextMenu = () => {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const open = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState({ isOpen: true, position: { x: e.clientX, y: e.clientY } });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!state.isOpen) return;
    
    const handler = () => close();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [state.isOpen, close]);

  return { ...state, open, close };
};

// ============================================================================
// Sub-component: FlySVG
// ============================================================================

interface FlySVGProps {
  uniqueId: string;
}

const FlySVG = React.memo(({ uniqueId }: FlySVGProps) => {
  const bodyGradientId = `fly-body-${uniqueId}`;
  const wingGradientId = `fly-wing-${uniqueId}`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <defs>
        <radialGradient id={bodyGradientId} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <radialGradient id={wingGradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(200, 220, 255, 0.6)" />
          <stop offset="100%" stopColor="rgba(150, 180, 220, 0.3)" />
        </radialGradient>
      </defs>

      {/* Wings */}
      <motion.ellipse
        cx="30" cy="45" rx="22" ry="12"
        fill={`url(#${wingGradientId})`}
        stroke="rgba(100, 130, 180, 0.5)"
        strokeWidth="0.5"
        style={{ transformOrigin: '45px 50px' }}
        animate={{ rotate: [-15, 15, -15] }}
        transition={{ duration: 0.05, repeat: Infinity }}
      />
      <motion.ellipse
        cx="70" cy="45" rx="22" ry="12"
        fill={`url(#${wingGradientId})`}
        stroke="rgba(100, 130, 180, 0.5)"
        strokeWidth="0.5"
        style={{ transformOrigin: '55px 50px' }}
        animate={{ rotate: [15, -15, 15] }}
        transition={{ duration: 0.05, repeat: Infinity }}
      />

      {/* Body */}
      <ellipse cx="50" cy="55" rx="12" ry="15" fill={`url(#${bodyGradientId})`} />
      <ellipse cx="50" cy="72" rx="10" ry="12" fill={`url(#${bodyGradientId})`} />

      {/* Head */}
      <circle cx="50" cy="38" r="10" fill={`url(#${bodyGradientId})`} />

      {/* Eyes */}
      <ellipse cx="44" cy="35" rx="5" ry="6" fill="#8B0000" />
      <ellipse cx="43" cy="34" rx="2" ry="2.5" fill="#ff4444" opacity="0.6" />
      <ellipse cx="56" cy="35" rx="5" ry="6" fill="#8B0000" />
      <ellipse cx="57" cy="34" rx="2" ry="2.5" fill="#ff4444" opacity="0.6" />

      {/* Legs */}
      <g stroke="#1a1a1a" strokeWidth="1.5" fill="none">
        <path d="M42,58 Q35,62 28,68" />
        <path d="M40,65 Q32,70 25,78" />
        <path d="M42,72 Q35,78 30,88" />
        <path d="M58,58 Q65,62 72,68" />
        <path d="M60,65 Q68,70 75,78" />
        <path d="M58,72 Q65,78 70,88" />
      </g>

      {/* Antennae */}
      <g stroke="#1a1a1a" strokeWidth="1" fill="none">
        <path d="M46,30 Q44,24 40,20" />
        <path d="M54,30 Q56,24 60,20" />
      </g>
    </svg>
  );
});

FlySVG.displayName = "FlySVG";

// ============================================================================
// Sub-component: AuthContextMenu
// ============================================================================

interface AuthContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const AuthContextMenu = React.memo(({
  isOpen,
  position,
  isLoggedIn,
  onLogin,
  onLogout,
}: AuthContextMenuProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[200] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[160px]"
        style={{ left: position.x, top: position.y }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            {isLoggedIn ? '🟢 Đã đăng nhập' : '🔴 Chưa đăng nhập'}
          </div>

          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="font-medium">Đăng nhập</span>
            </button>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));

AuthContextMenu.displayName = "AuthContextMenu";

// ============================================================================
// Main Component: CollapseToggle
// ============================================================================

export const CollapseToggle = React.memo(({ collapsed, onClick }: CollapseToggleProps) => {
  const uniqueId = useId();
  const { position, isMounted } = useRandomPosition();
  const { isLoggedIn, login, logout } = useAuth();
  const contextMenu = useContextMenu();

  const handleLogin = useCallback(() => {
    login();
    contextMenu.close();
    alert('🪰 Đăng nhập thành công!');
  }, [login, contextMenu]);

  const handleLogout = useCallback(() => {
    logout();
    contextMenu.close();
    alert('🪰 Đăng xuất thành công!');
  }, [logout, contextMenu]);

  if (!isMounted) return null;

  return (
    <>
      <button
        onClick={onClick}
        onContextMenu={contextMenu.open}
        className="fixed z-[100] transition-all duration-300 hover:scale-125 flex items-center justify-center cursor-pointer"
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title="🪰 Click: Toggle Navigation | Right-click: Login/Logout"
        style={{
          top: `${position.top}%`,
          left: `${position.left}%`,
          width: '50px',
          height: '50px',
          background: 'transparent',
          border: 'none',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 5, -5, 3, -3, 0],
            x: [0, 2, -2, 1, -1, 0],
            y: [0, -2, 2, -1, 1, 0],
          }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          className="relative w-12 h-12"
        >
          <FlySVG uniqueId={uniqueId} />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full bg-black/20 blur-sm" />
        </motion.div>
      </button>

      <AuthContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </>
  );
});

CollapseToggle.displayName = "CollapseToggle";
