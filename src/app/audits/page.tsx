"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Audit {
  id: string;
  brand_name: string;
  brand_url: string;
  status: string;
  visibility_rate: number | null;
  total_queries: number | null;
  total_mentioned: number | null;
  engines: string[];
  created_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAudits();
  }, []);

  async function fetchAudits() {
    const res = await fetch("/api/geo-audits");
    const data = await res.json();
    setAudits(data.audits || []);
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    console.log("a")
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">GEO Audit</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/clients")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clients
            </button>
            <button
              onClick={() => router.push("/audits/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              + New Audit
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Audits</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : audits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No audits yet
            </h3>
            <p className="text-gray-500 mb-6">
              Run your first AI visibility audit to see how your brand appears
              across AI search engines.
            </p>
            <button
              onClick={() => router.push("/audits/new")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create Your First Audit
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Brand
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">
                    Visibility
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">
                    Engines
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">
                    Duration
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/audits/${audit.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {audit.brand_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {audit.brand_url}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[audit.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {audit.visibility_rate != null ? (
                        <span className="text-lg font-bold text-gray-900">
                          {audit.visibility_rate}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {audit.engines?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {formatDuration(audit.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {formatDate(audit.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
