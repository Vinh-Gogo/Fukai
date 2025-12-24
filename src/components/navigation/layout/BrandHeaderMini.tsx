import { Search } from "lucide-react";
import { GlobalSearch } from "@/components/search";

interface BrandHeaderMiniProps {
  isCollapsed: boolean;
}

export function BrandHeaderMini({ isCollapsed }: BrandHeaderMiniProps) {
  // When collapsed, show the compact header with search icon
  if (isCollapsed) {
    return (
      <>
        
        <div className="mt-2 h-16 w-16 p-1 bg-white flex items-center justify-center rounded-xl shadow-md transition-all">
          {/* Enhanced Icon with Color Spread & Shadow - Fixed Size */}
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center relative group flex-shrink-0 cursor-pointer">

            {/* Icon with Enhanced Shadow */}
            <div className="relative z-10">
              <Search className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)]" />
            </div>

            {/* Interactive Pulse Dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></span>
          </div>
        </div>
      </>
    );
  }

  // When expanded, show the BrandHeaderMini component
  return (
    <div className="mt-2 w-full">
      <GlobalSearch />
    </div>
  );
}
