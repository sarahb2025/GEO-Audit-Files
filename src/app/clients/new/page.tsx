"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    intake_token: string;
    report_slug: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create client.");
        setSubmitting(false);
        return;
      }

      setResult(data.client);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function copyLink() {
    if (!result) return;
    const link = `${window.location.origin}/intake/${result.intake_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const intakeLink = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/intake/${result.intake_token}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/clients")}
            className="text-gray-500 hover:text-gray-700"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Add New Client</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Client Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL *
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. acmecorp.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </section>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !name || !url}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Generate Intake Link"}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <section className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Client Added Successfully
              </h2>
              <p className="text-green-700 mb-4">
                Share this link with <strong>{name}</strong> to start their AI
                visibility audit:
              </p>

              <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 p-3">
                <code className="flex-1 text-sm text-gray-800 break-all">
                  {intakeLink}
                </code>
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </section>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setName("");
                  setUrl("");
                }}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push("/clients")}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                View All Clients
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
