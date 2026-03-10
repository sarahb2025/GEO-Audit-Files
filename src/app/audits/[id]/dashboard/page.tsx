"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/geo-audits/${id}`);
      const data = await res.json();
      if (data.audit?.dashboard_url) {
        setDashboardUrl(data.audit.dashboard_url);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Dashboard not available yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => router.push(`/audits/${id}`)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to Audit
        </button>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          Open in New Tab
        </a>
      </div>

      {/* Dashboard iframe */}
      <iframe
        src={dashboardUrl}
        className="w-full border-0"
        style={{ height: "calc(100vh - 48px)" }}
        title="GEO Audit Dashboard"
      />
    </div>
  );
}
