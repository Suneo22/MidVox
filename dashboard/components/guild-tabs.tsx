"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Ticket,
  BarChart4,
  FileText,
  Settings,
  Layers,
  Sword,
  Activity,
  SmilePlus,
  Rocket,
  Shield,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  Bot,
  Volume2,
  Link2,
  Zap,
  Mic,
  Mail,
  Ban,
  Instagram,
  Radar
} from "lucide-react";

interface Tab {
  name: string;
  href: string;
  icon: any;
}

export function GuildTabs({ guildId }: { guildId: string }) {
  const pathname = usePathname();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const tabs: Tab[] = [
    { name: "Overview", href: `/dashboard/guild/${guildId}`, icon: Layers },
    { name: "Anti-Nuke", href: `/dashboard/guild/${guildId}/antinuke`, icon: Sword },
    { name: "Automod", href: `/dashboard/guild/${guildId}/automod`, icon: ShieldCheck },
    { name: "Anti-Spam+", href: `/dashboard/guild/${guildId}/antispamplus`, icon: Ban },
    { name: "Insta Downloader", href: `/dashboard/guild/${guildId}/instadl`, icon: Instagram },
    { name: "Tickets", href: `/dashboard/guild/${guildId}/tickets`, icon: Ticket },
    { name: "Verification", href: `/dashboard/guild/${guildId}/verification`, icon: Shield },
    { name: "Welcome", href: `/dashboard/guild/${guildId}/welcome`, icon: SmilePlus },
    { name: "Invites", href: `/dashboard/guild/${guildId}/invites`, icon: LinkIcon },
    { name: "Auto Role", href: `/dashboard/guild/${guildId}/autorole`, icon: Bot },
    { name: "Reaction Roles", href: `/dashboard/guild/${guildId}/reactionroles`, icon: Activity },
    { name: "Join to Create", href: `/dashboard/guild/${guildId}/j2c`, icon: Mic },
    { name: "Voice Role", href: `/dashboard/guild/${guildId}/invcrole`, icon: Volume2 },
    { name: "Vanity Roles", href: `/dashboard/guild/${guildId}/vanityroles`, icon: Link2 },
    { name: "Auto React", href: `/dashboard/guild/${guildId}/autoreact`, icon: Zap },
    { name: "Custom Roles", href: `/dashboard/guild/${guildId}/customroles`, icon: Sparkles },
    { name: "Join DM", href: `/dashboard/guild/${guildId}/joindm`, icon: Mail },
    { name: "Leveling", href: `/dashboard/guild/${guildId}/leveling`, icon: BarChart4 },
    { name: "Tracking", href: `/dashboard/guild/${guildId}/tracking`, icon: Radar },
    { name: "Logging", href: `/dashboard/guild/${guildId}/logging`, icon: FileText },
    { name: "Settings", href: `/dashboard/guild/${guildId}/settings`, icon: Settings },
  ].filter(tab => tab.href); // Filter out any undefined hrefs

  // Auto-scroll active tab into view
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLDivElement>('[data-active="true"]');
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <div className="w-full mb-8">
      <div className="sticky top-16 z-20 -mx-4 px-4 pt-3 pb-1 bg-[#0C0C0C]/95 backdrop-blur-sm">
        <div
          ref={scrollContainerRef}
          className="flex gap-1.5 overflow-x-auto no-scrollbar py-1.5 px-1"
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="shrink-0 relative"
              >
                {isActive && (
                  <motion.span
                    layoutId="guild-tab-pill"
                    className="absolute inset-0 bg-primary rounded-lg shadow-md shadow-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div
                  data-active={isActive}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-200 border",
                    isActive
                      ? "text-white border-transparent"
                      : "text-neutral-500 border-[#1F1F1F] bg-[#131313] hover:text-neutral-200 hover:border-[#2A2A2A]"
                  )}
                >
                  <tab.icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-neutral-400")} />
                  {tab.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
