"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Video, Sparkles, FileText, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/episodes", label: "Episodes", icon: Video },
  { href: "/highlights", label: "Highlights", icon: Sparkles },
  { href: "/prompts", label: "Prompts", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Podcast Highlighter
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

