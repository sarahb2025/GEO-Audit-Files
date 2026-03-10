"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AVAILABLE_ENGINES = [
  { id: "openai", label: "ChatGPT", description: "GPT-4o" },
  { id: "anthropic", label: "Claude", description: "Claude Sonnet" },
  { id: "google", label: "Gemini", description: "Gemini 2.5 Flash" },
  { id: "perplexity", label: "Perplexity", description: "Sonar Pro" },
  { id: "xai", label: "Grok", description: "Grok 3" },
  { id: "google_ai_mode", label: "AI Mode", description: "Google AI Mode (SerpApi)" },
  { id: "google_ai_overview", label: "AI Overview", description: "Google AI Overview (SerpApi)" },
];

const DEFAULT_CATEGORIES = [
  "Managed IT Services",
  "Systems Integrator",
  "Competitive Landscape",
];

interface PromptRow {
  prompt_id: number;
  category: string;
  prompt_text: string;
}

export default function NewAuditPage() {
  const router = useRouter();
  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [selectedEngines, setSelectedEngines] = useState<string[]>(
    AVAILABLE_ENGINES.map((e) => e.id)
  );
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [newPromptText, setNewPromptText] = useState("");
  const [newPromptCategory, setNewPromptCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addCompetitor() {
    const comp = competitorInput.trim();
    if (comp && !competitors.includes(comp)) {
      setCompetitors([...competitors, comp]);
      setCompetitorInput("");
    }
  }

  function removeCompetitor(comp: string) {
    setCompetitors(competitors.filter((c) => c !== comp));
  }

  function addPrompt() {
    if (!newPromptText.trim()) return;
    const nextId = prompts.length > 0 ? Math.max(...prompts.map((p) => p.prompt_id)) + 1 : 1;
    setPrompts([
      ...prompts,
      {
        prompt_id: nextId,
        category: newPromptCategory,
        prompt_text: newPromptText.trim(),
      },
    ]);
    setNewPromptText("");
  }

  function removePrompt(id: number) {
    setPrompts(prompts.filter((p) => p.prompt_id !== id));
  }

  function toggleEngine(engineId: string) {
    setSelectedEngines((prev) =>
      prev.includes(engineId)
        ? prev.filter((e) => e !== engineId)
        : [...prev, engineId]
    );
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    // Skip header
    const parsed: PromptRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 3) {
        parsed.push({
          prompt_id: parseInt(parts[0]) || i,
          category: parts[1].trim(),
          prompt_text: parts.slice(2).join(",").trim(),
        });
      }
    }
    if (parsed.length > 0) {
      setPrompts(parsed);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (prompts.length === 0) {
      setError("Add at least one prompt.");
      return;
    }
    if (selectedEngines.length === 0) {
      setError("Select at least one engine.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/geo-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName,
          brand_url: brandUrl,
          competitors,
          engines: selectedEngines,
          prompts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create audit.");
        setSubmitting(false);
        return;
      }

      router.push(`/audits/${data.audit_id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const estimatedMinutes = Math.ceil(
    (prompts.length * selectedEngines.length * 2) / 60
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/audits")}
            className="text-gray-500 hover:text-gray-700"
          >
            &larr; Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">New GEO Audit</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Brand Info */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Brand Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
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
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  placeholder="e.g. acmecorp.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </section>

          {/* Competitors */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Competitors
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCompetitor();
                  }
                }}
                placeholder="Add a competitor name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addCompetitor}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {competitors.map((comp) => (
                <span
                  key={comp}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {comp}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(comp)}
                    className="text-blue-400 hover:text-blue-600 ml-1"
                  >
                    x
                  </button>
                </span>
              ))}
              {competitors.length === 0 && (
                <p className="text-sm text-gray-400">
                  No competitors added yet.
                </p>
              )}
            </div>
          </section>

          {/* Engines */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              AI Engines
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {AVAILABLE_ENGINES.map((engine) => (
                <label
                  key={engine.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEngines.includes(engine.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEngines.includes(engine.id)}
                    onChange={() => toggleEngine(engine.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {engine.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {engine.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Prompts */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Prompts ({prompts.length})
              </h2>
              <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm">
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Add prompt */}
            <div className="flex gap-2 mb-4">
              <select
                value={newPromptCategory}
                onChange={(e) => setNewPromptCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPrompt();
                  }
                }}
                placeholder="Type a prompt..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addPrompt}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>

            {/* Prompt list */}
            {prompts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prompts.map((p) => (
                  <div
                    key={p.prompt_id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-xs font-mono text-gray-400 w-6">
                      #{p.prompt_id}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {p.category}
                    </span>
                    <span className="flex-1 text-sm text-gray-800">
                      {p.prompt_text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePrompt(p.prompt_id)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Add prompts manually or upload a CSV file
                (prompt_id, category, prompt_text).
              </p>
            )}
          </section>

          {/* Submit */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {prompts.length > 0 && selectedEngines.length > 0 && (
                <>
                  {prompts.length * selectedEngines.length} total API calls
                  {" "}&middot;{" "}
                  ~{estimatedMinutes} min estimated
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !brandName || !brandUrl || prompts.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Starting Audit..." : "Start Audit"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
