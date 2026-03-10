"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Client {
  id: string;
  name: string;
  url: string;
  email: string | null;
  status: string;
  intake_token: string;
  report_slug: string;
  audit_id: string | null;
  intake_completed_at: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending_intake: "bg-yellow-100 text-yellow-800",
  intake_completed: "bg-blue-100 text-blue-800",
  auditing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending_intake: "Awaiting Intake",
  intake_completed: "Intake Done",
  auditing: "Auditing",
  completed: "Completed",
  failed: "Failed",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function copyIntakeLink(token: string) {
    const link = `${window.location.origin}/intake/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">GEO Audit</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/audits")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Audits
            </button>
            <button
              onClick={() => router.push("/clients/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              + Add Client
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Clients</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add a client to generate their AI visibility audit intake link.
            </p>
            <button
              onClick={() => router.push("/clients/new")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Intake Link
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                    Report
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-500">{client.url}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[client.status] || "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[client.status] || client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => copyIntakeLink(client.intake_token)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {copied === client.intake_token
                          ? "Copied!"
                          : "Copy Link"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {client.status === "completed" ? (
                        <a
                          href={`/report/${client.report_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          View Report
                        </a>
                      ) : client.status === "auditing" ? (
                        <span className="text-sm text-purple-500">
                          In progress...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {formatDate(client.created_at)}
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
