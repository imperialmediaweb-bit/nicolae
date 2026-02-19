"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HappyLogo from "@/components/HappyLogo";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/seed", { method: "POST" }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Eroare la autentificare");
      }
    } catch {
      setError("Eroare de conexiune");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      alert(data.message + (data.accounts ? "\n\n" + data.accounts.join("\n") : ""));
    } catch {
      alert("Eroare la populare");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 via-pink-50 to-white px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HappyLogo size={140} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Casa Nicolae</h1>
          <p className="text-sm text-gray-500 mt-1">Hub Intern HAPPY</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-purple-400 transition text-gray-900 text-base placeholder:text-gray-400"
                placeholder="Utilizator"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-purple-400 transition text-gray-900 text-base placeholder:text-gray-400"
                placeholder="Parola"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-2xl font-semibold text-base disabled:opacity-50 active:scale-[0.98] transition-all shadow-md"
            >
              {loading ? "Se autentifica..." : "Intra in cont"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="text-xs text-gray-400 active:text-purple-500 transition"
          >
            {seeding ? "Se populeaza..." : "Initializare date demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
