"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BottomNav } from "@/components/layout/BottomNav";

interface GarminStatus {
  configured: boolean;
  connected: boolean;
  tokenExpiresAt: number | null;
  activityCount: number;
  matchedCount: number;
  lastSync: string | null;
  webhookUrl: string;
}

export function GarminConnectPanel({
  initialMessage,
}: {
  initialMessage?: string | null;
}) {
  const [status, setStatus] = useState<GarminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(initialMessage ?? "");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/garmin/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDisconnect() {
    await fetch("/api/garmin/disconnect", { method: "POST" });
    setMessage("Compte Garmin déconnecté.");
    refresh();
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Intégrations
          </p>
          <h1 className="text-lg font-bold text-white mt-0.5">Garmin Connect</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-4">
        {message && (
          <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-sm text-indigo-200">
            {message}
          </div>
        )}

        <GlassCard variant="strong" className="p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Statut</h2>
          {loading || !status ? (
            <p className="text-sm text-slate-500">Chargement…</p>
          ) : (
            <div className="space-y-2 text-sm">
              <StatusRow
                label="API configurée"
                ok={status.configured}
              />
              <StatusRow label="Compte connecté" ok={status.connected} />
              <p className="text-slate-400">
                Activités reçues :{" "}
                <span className="text-white tabular-nums">{status.activityCount}</span>
              </p>
              <p className="text-slate-400">
                Séances matchées :{" "}
                <span className="text-emerald-300 tabular-nums">
                  {status.matchedCount}
                </span>
              </p>
              {status.lastSync && (
                <p className="text-xs text-slate-500">
                  Dernière sync :{" "}
                  {new Date(status.lastSync).toLocaleString("fr-FR")}
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {status?.connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-slate-300 hover:bg-white/15"
              >
                Déconnecter
              </button>
            ) : (
              <a
                href="/api/garmin/auth"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Connecter Garmin
              </a>
            )}
            <button
              type="button"
              onClick={refresh}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10"
            >
              Actualiser
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Configuration (étape par étape)
          </h2>
          <ol className="text-sm text-slate-400 space-y-3 list-decimal list-inside leading-relaxed">
            <li>
              Demande l&apos;accès au{" "}
              <a
                href="https://developer.garmin.com/gc-developer-program/activity-api/"
                className="text-indigo-300 underline"
                target="_blank"
                rel="noreferrer"
              >
                Garmin Connect Developer Program — Activity API
              </a>
              .
            </li>
            <li>
              Crée une app <strong className="text-slate-300">Evaluation</strong>{" "}
              sur le portail développeur Garmin.
            </li>
            <li>
              Copie <code className="text-xs bg-white/10 px-1 rounded">.env.example</code>{" "}
              vers <code className="text-xs bg-white/10 px-1 rounded">.env.local</code>{" "}
              et renseigne Client ID / Secret.
            </li>
            <li>
              Redirect URI :{" "}
              <code className="text-xs bg-white/10 px-1 rounded break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/garmin/callback`
                  : "/api/garmin/callback"}
              </code>
            </li>
            <li>
              Webhook Push (API Tools) :{" "}
              <code className="text-xs bg-white/10 px-1 rounded break-all">
                {status?.webhookUrl ?? "…/api/garmin/webhook"}
              </code>
            </li>
            <li>
              Sur Vercel, configure{" "}
              <code className="text-xs bg-white/10 px-1 rounded">UPSTASH_REDIS</code>{" "}
              pour persister tokens et activités.
            </li>
            <li>
              Sync ta montre avec Garmin Connect — les activités valident
              automatiquement les séances correspondantes.
            </li>
          </ol>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-white mb-2">Comment ça marche</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>OAuth 2.0 + PKCE pour connecter ton compte Garmin.</li>
            <li>Webhook Push : Garmin envoie les activités après chaque sync montre.</li>
            <li>Matching auto par date + sport (vélo, course, natation, brick).</li>
            <li>Les séances matchées sont validées et créditent les points.</li>
          </ul>
        </GlassCard>
      </main>

      <BottomNav />
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <p className="flex items-center gap-2 text-slate-400">
      <span
        className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400" : "bg-slate-600"}`}
      />
      {label}
    </p>
  );
}
