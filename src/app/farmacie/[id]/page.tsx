"use client";

import { useEffect, useState, use } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface LogEntry {
  id: string;
  action: string;
  quantity: number;
  reason: string | null;
  date: string;
  user: { name: string };
}

interface MedDetail {
  id: string;
  name: string;
  description: string | null;
  dosage: string | null;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: string | null;
  notes: string | null;
  category: { name: string; color: string };
  logs: LogEntry[];
}

export default function MedicamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<MedDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/farmacie/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <AppLayout title="Detalii medicament" backHref="/farmacie"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div></AppLayout>;
  }

  if (!data) {
    return <AppLayout title="Detalii medicament" backHref="/farmacie"><p className="text-gray-500">Medicamentul nu a fost gasit.</p></AppLayout>;
  }

  const actionLabels: Record<string, string> = {
    adaugare: "Adaugare",
    eliberare: "Eliberare",
    ajustare: "Ajustare",
  };

  return (
    <AppLayout title="Detalii medicament" backHref="/farmacie">
      <div className="max-w-3xl mx-auto">
        <Link href="/farmacie" className="text-sm text-indigo-600 hover:underline">&larr; Inapoi la farmacie</Link>

        <div className="mt-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${data.category.color}20`, color: data.category.color }}>
              {data.category.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className={`bg-white rounded-xl shadow-sm border p-6 ${data.stock <= data.minStock ? "border-red-200" : "border-gray-100"}`}>
            <p className="text-sm text-gray-500">Stoc curent</p>
            <p className={`text-3xl font-bold ${data.stock <= data.minStock ? "text-red-600" : "text-green-600"}`}>{data.stock}</p>
            <p className="text-sm text-gray-500">{data.unit}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Stoc minim</p>
            <p className="text-3xl font-bold text-gray-900">{data.minStock}</p>
            <p className="text-sm text-gray-500">{data.unit}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Expira</p>
            <p className="text-xl font-bold text-gray-900">{data.expiryDate ? new Date(data.expiryDate).toLocaleDateString("ro-RO") : "-"}</p>
          </div>
        </div>

        {(data.description || data.dosage || data.notes) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Detalii</h2>
            <div className="space-y-2 text-sm">
              {data.dosage && <div><span className="text-gray-500">Dozaj:</span> <span className="text-gray-900">{data.dosage}</span></div>}
              {data.description && <div><span className="text-gray-500">Descriere:</span> <span className="text-gray-900">{data.description}</span></div>}
              {data.notes && <div><span className="text-gray-500">Note:</span> <span className="text-gray-900">{data.notes}</span></div>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Istoric operatiuni</h2>
          {data.logs.length === 0 ? (
            <p className="text-gray-500 text-sm">Nicio operatiune inregistrata.</p>
          ) : (
            <div className="space-y-3">
              {data.logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      log.action === "adaugare" ? "bg-green-100 text-green-700" :
                      log.action === "eliberare" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                    <span className="ml-2 text-sm text-gray-900">{log.quantity} {data.unit}</span>
                    {log.reason && <span className="ml-2 text-xs text-gray-500">- {log.reason}</span>}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div>{new Date(log.date).toLocaleDateString("ro-RO")}</div>
                    <div>{log.user.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
