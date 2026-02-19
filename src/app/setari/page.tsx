"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

interface ConfigItem {
  configured: boolean;
  masked: string;
}

const KEY_INFO: Record<string, { label: string; description: string; placeholder: string; group: string }> = {
  ANTHROPIC_API_KEY: { label: "Anthropic (Claude)", description: "Recomandat - cel mai bun pentru profile si chat", placeholder: "sk-ant-api03-...", group: "ai" },
  OPENAI_API_KEY: { label: "OpenAI (GPT)", description: "Alternativa - se foloseste daca Anthropic nu e setat", placeholder: "sk-...", group: "ai" },
  TWILIO_ACCOUNT_SID: { label: "Twilio Account SID", description: "Pentru trimitere SMS la alerte critice", placeholder: "ACxxxxxxxxx", group: "sms" },
  TWILIO_AUTH_TOKEN: { label: "Twilio Auth Token", description: "Token-ul de autentificare Twilio", placeholder: "your_auth_token", group: "sms" },
  TWILIO_PHONE_NUMBER: { label: "Numar Twilio (de pe care se trimite)", description: "Numarul tau Twilio in format international", placeholder: "+40xxxxxxxxxx", group: "sms" },
  NOTIFICATION_PHONES: { label: "Numere notificare (destinatari)", description: "Numerele care primesc SMS, separate prin virgula", placeholder: "+40712345678, +40723456789", group: "sms" },
};

export default function SetariPage() {
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({});
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/setari")
      .then((r) => {
        if (r.status === 403) throw new Error("forbidden");
        return r.json();
      })
      .then(setConfigs)
      .catch((err) => {
        if (err.message === "forbidden") setError("Doar administratorii pot accesa setarile.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveKey(key: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/setari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: editValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfigs((prev) => ({
          ...prev,
          [key]: {
            configured: data.action === "saved",
            masked: data.masked || "",
          },
        }));
        setEditKey(null);
        setEditValue("");
      }
    } catch {
      // Ignore
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <AppLayout title="Setari" backHref="/dashboard">
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Setari" backHref="/dashboard">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Chei API Inteligenta Artificiala</h2>
                <p className="text-xs text-gray-400">Necesare pentru chat AI, profile si analiza farmacie</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(KEY_INFO).filter(([, v]) => v.group === "ai").map(([key, info]) => {
                const config = configs[key];
                const isEditing = editKey === key;

                return (
                  <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{info.label}</h3>
                      {config?.configured ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activ</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Nesetat</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{info.description}</p>

                    {config?.configured && !isEditing && (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600 flex-1">{config.masked}</code>
                        <button onClick={() => { setEditKey(key); setEditValue(""); }}
                          className="text-xs text-indigo-600 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg">
                          Schimba
                        </button>
                      </div>
                    )}

                    {(!config?.configured || isEditing) && (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={isEditing ? editValue : ""}
                          onChange={(e) => { setEditKey(key); setEditValue(e.target.value); }}
                          placeholder={info.placeholder}
                          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={() => saveKey(key)} disabled={saving || !editValue}
                          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                          {saving ? "..." : "Salveaza"}
                        </button>
                        {isEditing && (
                          <button onClick={() => { setEditKey(null); setEditValue(""); }}
                            className="text-sm text-gray-400 px-2">
                            Anuleaza
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SMS Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Notificari SMS (Twilio)</h2>
                <p className="text-xs text-gray-400">Optional - trimite SMS la alerte critice farmacie</p>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(KEY_INFO).filter(([, v]) => v.group === "sms").map(([key, info]) => {
                const config = configs[key];
                const isEditing = editKey === key;
                const isSensitive = key.includes("TOKEN") || key.includes("SID");

                return (
                  <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{info.label}</h3>
                      {config?.configured ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Setat</span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Nesetat</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{info.description}</p>

                    {config?.configured && !isEditing && (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600 flex-1">{config.masked}</code>
                        <button onClick={() => { setEditKey(key); setEditValue(""); }}
                          className="text-xs text-indigo-600 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg">
                          Schimba
                        </button>
                      </div>
                    )}

                    {(!config?.configured || isEditing) && (
                      <div className="flex gap-2">
                        <input
                          type={isSensitive ? "password" : "text"}
                          value={isEditing ? editValue : ""}
                          onChange={(e) => { setEditKey(key); setEditValue(e.target.value); }}
                          placeholder={info.placeholder}
                          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button onClick={() => saveKey(key)} disabled={saving || !editValue}
                          className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
                          {saving ? "..." : "Salveaza"}
                        </button>
                        {isEditing && (
                          <button onClick={() => { setEditKey(null); setEditValue(""); }}
                            className="text-sm text-gray-400 px-2">
                            Anuleaza
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-700 font-medium mb-1">Cum obtii cheia API?</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>Anthropic: console.anthropic.com &rarr; API Keys</li>
              <li>OpenAI: platform.openai.com &rarr; API Keys</li>
              <li>Twilio: twilio.com &rarr; Console &rarr; Account SID &amp; Auth Token</li>
            </ul>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
