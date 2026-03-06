"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

interface Parent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscription: { plan: { displayName: string }; status: string } | null;
}

interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  error: string | null;
  createdAt: string;
  parent: { firstName: string; lastName: string } | null;
}

const templateLabels: Record<string, string> = {
  promotional: "Promotional",
  reminder: "Reminder",
  progress_update: "Actualizare Progres",
  welcome: "Bun venit",
  expiry_warning: "Expirare (warning)",
  expired: "Expirat",
};

export default function AdminEmailPage() {
  const [tab, setTab] = useState<"compose" | "logs">("compose");
  const [parents, setParents] = useState<Parent[]>([]);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [template, setTemplate] = useState("promotional");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/parinti").then((r) => r.json()),
      fetch("/api/email/logs").then((r) => r.json()),
    ])
      .then(([p, l]) => {
        setParents(Array.isArray(p) ? p : []);
        setLogs(Array.isArray(l) ? l : []);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleAll() {
    if (selectedIds.size === parents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parents.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleSend() {
    if (selectedIds.size === 0) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentIds: Array.from(selectedIds),
          template,
          subject,
          message,
          ctaText,
        }),
      });
      const data = await res.json();
      setResult(data);

      // Refresh logs
      const newLogs = await fetch("/api/email/logs").then((r) => r.json());
      setLogs(Array.isArray(newLogs) ? newLogs : []);
    } finally {
      setSending(false);
    }
  }

  async function triggerAutoNotify() {
    setSending(true);
    try {
      const res = await fetch("/api/email/auto-notify");
      const data = await res.json();
      alert(`Notificari automate: ${data.sent} trimise, ${data.failed} esuate. (${data.expiringSoon} expira curand, ${data.justExpired} tocmai expirate)`);
      // Refresh logs
      const newLogs = await fetch("/api/email/logs").then((r) => r.json());
      setLogs(Array.isArray(newLogs) ? newLogs : []);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout title="Email Marketing" backHref="/dashboard">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button onClick={() => setTab("compose")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === "compose" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Compune Email
            </button>
            <button onClick={() => setTab("logs")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${tab === "logs" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
              Istoric ({logs.length})
            </button>
          </div>

          {/* Auto-notify button */}
          <button onClick={triggerAutoNotify} disabled={sending}
            className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200 disabled:opacity-50">
            ⚡ Trimite notificari automate (expirari abonamente)
          </button>

          {/* COMPOSE TAB */}
          {tab === "compose" && (
            <div className="space-y-4">
              {/* Template selection */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Tip email</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["promotional", "reminder", "progress_update"].map((t) => (
                    <button key={t} onClick={() => setTemplate(t)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition ${template === t ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                      {templateLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject & message */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Subiect</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subiectul emailului..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mesaj (accepta HTML)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Scrie mesajul aici..."
                    rows={6}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Text buton CTA (optional)</label>
                  <input value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ex: Vezi detalii"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900" />
                </div>
              </div>

              {/* Select recipients */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">Destinatari ({selectedIds.size}/{parents.length})</h3>
                  <button onClick={toggleAll} className="text-xs text-indigo-600 font-medium">
                    {selectedIds.size === parents.length ? "Deselecteaza tot" : "Selecteaza tot"}
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {parents.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 text-indigo-600 rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{p.email}</p>
                      </div>
                      {p.subscription && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {p.subscription.plan.displayName}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Send button */}
              <button onClick={handleSend}
                disabled={sending || selectedIds.size === 0 || (!subject && !message)}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold disabled:opacity-50 active:scale-[0.98] transition">
                {sending ? "Se trimite..." : `Trimite la ${selectedIds.size} parinti`}
              </button>

              {/* Result */}
              {result && (
                <div className={`rounded-2xl p-4 text-center ${result.failed > 0 ? "bg-yellow-50 border border-yellow-100" : "bg-green-50 border border-green-100"}`}>
                  <p className="font-semibold text-gray-900">
                    ✅ {result.sent} trimise {result.failed > 0 ? `| ❌ ${result.failed} esuate` : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LOGS TAB */}
          {tab === "logs" && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="text-gray-500 text-sm">Niciun email trimis inca.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {log.status === "sent" ? "Trimis" : "Esuat"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.createdAt).toLocaleDateString("ro-RO")} {new Date(log.createdAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{log.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 truncate">{log.to}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
                        {templateLabels[log.template] || log.template}
                      </span>
                    </div>
                    {log.error && (
                      <p className="text-xs text-red-500 mt-1 truncate">{log.error}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
