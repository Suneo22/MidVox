"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ShieldCheck, ChevronRight, RefreshCcw, Server, Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "";
const BOT_INVITE = CLIENT_ID
  ? `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot+applications.commands`
  : "https://discord.com/oauth2/authorize";

export default function GuildsPage() {
  const { data: session, status } = useSession();
  const [botGuilds, setBotGuilds] = useState<any[]>([]);
  const [userGuilds, setUserGuilds] = useState<any[]>([]);
  const [userDiscordError, setUserDiscordError] = useState<string | null>(null);
  const [botError, setBotError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/");
    if (status !== "authenticated") return;

    const fetchData = async () => {
      setLoading(true);
      setBotError(null);
      setUserDiscordError(null);
      try {
        const guilds = await api.listGuilds();
        setBotGuilds(guilds);
        if (session?.accessToken) {
          try {
            const res = await fetch("https://discord.com/api/users/@me/guilds", {
              headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (res.ok) {
              setUserGuilds(await res.json());
            } else {
              setUserDiscordError("Discord API returned " + res.status);
            }
          } catch {
            setUserDiscordError("Discord API fetch failed");
          }
        } else {
          setUserDiscordError("No access token in session");
        }
      } catch (err: any) {
        setBotError(err.message || "Failed to load bot servers.");
      }
      setLoading(false);
    };

    fetchData();
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-600 animate-pulse">
            Loading servers…
          </p>
        </div>
      </div>
    );
  }

  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);
  const adminUserGuilds = userGuilds.filter((g: any) => {
    try {
      const perms = BigInt(g.permissions);
      return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD || g.owner === true;
    } catch { return g.owner === true; }
  });

  const adminGuildIds = new Set(adminUserGuilds.map((g: any) => String(g.id)));
  const managedGuilds = botGuilds.filter((g: any) => adminGuildIds.has(String(g.id)));
  const allGuilds = managedGuilds.length > 0 ? managedGuilds : botGuilds;
  const guilds = query
    ? allGuilds.filter((g: any) => g.name.toLowerCase().includes(query.toLowerCase()))
    : allGuilds;

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-amber-500 to-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
              Your Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Servers</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Select a server to configure its modules and settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
            <input
              type="text"
              placeholder="Filter servers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48 bg-white/[0.04] border border-white/[0.07] rounded-lg py-2 pl-8 pr-3 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg text-xs font-medium text-neutral-500">
            <span className="text-white">{guilds.length}</span> guild{guilds.length !== 1 && "s"}
          </div>
        </div>
      </div>

      {/* Error state */}
      {botError ? (
        <div className="rounded-[6px] border border-red-500/20 bg-red-500/5 p-10 text-center">
          <ShieldCheck className="h-10 w-10 text-red-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-white mb-1">Connection Error</h3>
          <p className="text-sm text-neutral-400 mb-6">{botError}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : guilds.length === 0 ? (
        <div className="rounded-[6px] border border-dashed border-white/[0.07] bg-white/[0.015] p-16 text-center">
          <div className="h-14 w-14 rounded-[6px] bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-5">
            <Server className="h-6 w-6 text-neutral-600" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {query ? "No matching servers" : "No Servers Found"}
          </h3>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto">
            {query ? "Try a different search term." : "The bot hasn't joined any servers yet."}
          </p>
        </div>
      ) : (
        <>
          {userDiscordError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
              <p className="text-xs text-neutral-400">
                Could not verify Discord permissions — showing all guilds the bot is in.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {guilds.map((guild: any, i: number) => (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                className="group relative flex flex-col overflow-hidden rounded-[6px] border border-white/[0.07] bg-[#131313] hover:border-amber-500/35 hover:-translate-y-1 hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.35)] transition-all duration-300"
              >
                {/* top glow line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative shrink-0">
                      {guild.icon_url ? (
                        <Image
                          src={guild.icon_url}
                          alt={guild.name}
                          width={52}
                          height={52}
                          className="rounded-xl border border-white/10 group-hover:border-amber-400/30 transition-colors"
                        />
                      ) : (
                        <div className="h-[52px] w-[52px] rounded-xl border border-white/10 group-hover:border-amber-400/30 transition-colors bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center font-bold text-xl text-amber-300">
                          {guild.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#131313] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    </div>

                    <span className="text-[9px] font-mono font-semibold tracking-widest uppercase text-amber-400/50 bg-amber-500/[0.08] border border-amber-500/15 px-2 py-1 rounded-md truncate max-w-[110px]">
                      {guild.id}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-semibold text-white/85 group-hover:text-white truncate tracking-tight transition-colors">
                    {guild.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-400/50" />
                    <span className="text-xs text-neutral-500 tabular-nums">
                      {guild.member_count.toLocaleString()} members
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05] bg-white/[0.015] group-hover:bg-amber-500/[0.06] transition-colors duration-300">
                  <Link
                    href={`/dashboard/guild/${guild.id}`}
                    className="flex items-center justify-between w-full text-[11px] font-semibold uppercase tracking-widest text-neutral-500 group-hover:text-amber-300 transition-colors"
                  >
                    <span>Manage Server</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* Invite card */}
            <motion.a
              href={BOT_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: guilds.length * 0.04, duration: 0.4, ease: EASE }}
              className="group flex flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-white/[0.07] bg-white/[0.015] hover:border-amber-500/30 hover:bg-amber-500/[0.04] transition-all duration-300 min-h-[140px] p-6 cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl border border-white/[0.07] group-hover:border-amber-500/30 bg-white/[0.03] flex items-center justify-center transition-colors">
                <Plus className="h-4 w-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs font-semibold text-neutral-600 group-hover:text-neutral-400 transition-colors tracking-wide">
                Add to another server
              </p>
            </motion.a>
          </div>
        </>
      )}
    </div>
  );
}
