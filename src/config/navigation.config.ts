import {
  Search,
  FileText,
  Database,
  MessageCircle,
  Settings,
  History,
  Archive,
  BarChart3,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface NavigationItemConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  gradient: string;
}

export interface ToolItemConfig {
  name: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}

export const navigationItems: NavigationItemConfig[] = [
  {
    name: "Crawl Data",
    href: "/",
    icon: Search,
    description: "Web scraping dashboard",
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
  },
  {
    name: "Data Process",
    href: "/pdfs",
    icon: FileText,
    description: "PDF to Markdown pipeline",
    gradient: "from-purple-500 via-pink-500 to-purple-600",
  },
  {
    name: "Personal Archive",
    href: "/archive",
    icon: Archive,
    description: "Manage downloaded files",
    gradient: "from-amber-500 via-orange-500 to-amber-600",
  },
  {
    name: "Activity Dashboard",
    href: "/activity-dashboard",
    icon: BarChart3,
    description: "Monitor user activity",
    gradient: "from-emerald-500 via-teal-500 to-emerald-600",
  },
  {
    name: "RAG Query",
    href: "/rag",
    icon: MessageCircle,
    description: "AI-powered semantic search",
    gradient: "from-indigo-500 via-violet-500 to-indigo-600",
  },
  {
    name: "AI Chat",
    href: "/chat",
    icon: MessageCircle,
    description: "AI Agent messaging",
    gradient: "from-fuchsia-500 via-pink-500 to-fuchsia-600",
  },
];

export const toolItems: ToolItemConfig[] = [
  {
    name: "History",
    href: "/history",
    icon: History,
    gradient: "from-gray-500 via-gray-400 to-gray-600",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    gradient: "from-blue-500 via-blue-400 to-blue-600",
  },
];
