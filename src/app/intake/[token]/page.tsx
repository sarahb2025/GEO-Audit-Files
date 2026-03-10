"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ClientInfo {
  name: string;
  url: string;
}

export default function IntakePage() {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [pageState, setPageState] = useState<
    "loading" | "form" | "submitting" | "success" | "error" | "already_done"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [reportSlug, setReportSlug] = useState("");

  // Form fields
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch(`/api/intake/${token}`);
        const data = await res.json();
        if (res.status === 409) {
          setPageState("already_done");
          return;
        }
        if (!res.ok) {
          setErrorMsg(data.error || "Invalid link.");
          setPageState("error");
          return;
        }
        setClient(data.client);
        setPageState("form");
      } catch {
        setErrorMsg("Could not load form. Please try again.");
        setPageState("error");
      }
    }
    loadClient();
  }, [token]);

  function addItem(
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) {
    const item = input.trim();
    if (item && !list.includes(item)) {
      setList([...list, item]);
      setInput("");
    }
  }

  function removeItem(
    item: string,
    list: string[],
    setList: (v: string[]) => void
  ) {
    setList(list.filter((i) => i !== item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (services.length === 0) {
      setErrorMsg("Please add at least one service.");
      return;
    }
    setPageState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: contactName,
          email,
          contact_phone: contactPhone,
          competitors,
          services,
          keywords,
          location,
          industry,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit.");
        setPageState("form");
        return;
      }
      setReportSlug(data.report_slug);
      setPageState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPageState("form");
    }
  }

  // Tag input component
  function TagInput({
    label,
    description,
    placeholder,
    input,
    setInput,
    items,
    setItems,
    required,
  }: {
    label: string;
    description?: string;
    placeholder: string;
    input: string;
    setInput: (v: string) => void;
    items: string[];
    setItems: (v: string[]) => void;
    required?: boolean;
  }) {
    return (
      <div>
        <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
          {label} {required && <span className="text-orange-400">*</span>}
        </label>
        {description && (
          <p className="text-sm text-gray-400 mb-2">{description}</p>
        )}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem(input, setInput, items, setItems);
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <button
            type="button"
            onClick={() => addItem(input, setInput, items, setItems)}
            className="px-4 py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-orange-400 border border-gray-700 rounded-full text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item, items, setItems)}
                className="text-gray-500 hover:text-red-400 ml-1"
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Branded header
  const header = (
    <header className="bg-black text-white py-8 border-b-4 border-orange-500">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1
          className="text-4xl font-bold tracking-widest uppercase"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          BALMER AGENCY
        </h1>
        <div className="w-16 h-1 bg-orange-500 mx-auto my-3" />
        <p className="text-gray-400 text-sm uppercase tracking-wider">
          AI Visibility Audit
        </p>
      </div>
    </header>
  );

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gray-950">
        {header}
        <div className="text-center py-20 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gray-950">
        {header}
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Link Not Found</h2>
          <p className="text-gray-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (pageState === "already_done") {
    return (
      <div className="min-h-screen bg-gray-950">
        {header}
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Already Submitted
          </h2>
          <p className="text-gray-400">
            This intake form has already been completed. Your audit is in
            progress.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    const reportUrl = `${window.location.origin}/report/${reportSlug}`;
    return (
      <div className="min-h-screen bg-gray-950">
        {header}
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Audit Started
            </h2>
            <p className="text-gray-400 mb-6">
              We&apos;re analysing <strong className="text-white">{client?.name}</strong>&apos;s
              visibility across 7 AI search engines. This typically takes 5-10
              minutes.
            </p>
            <a
              href={reportUrl}
              className="inline-block px-8 py-4 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors uppercase tracking-wider"
            >
              View Your Report
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gray-950">
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
        rel="stylesheet"
      />
      {header}

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2
            className="text-3xl font-bold text-white uppercase tracking-wider"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {client?.name}
          </h2>
          <p className="text-gray-400 mt-2">
            Complete the details below to start your AI visibility audit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Details */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3
              className="text-lg font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Contact Details
            </h3>
            <div>
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
                Your Name <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Email <span className="text-orange-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3
              className="text-lg font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Your Business
            </h3>
            <TagInput
              label="Main Services / Products"
              description="What does your company offer? We'll check if AI engines mention you for these."
              placeholder="e.g. managed IT services"
              input={serviceInput}
              setInput={setServiceInput}
              items={services}
              setItems={setServices}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Information Technology"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sydney, Australia"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </section>

          {/* Competitors */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3
              className="text-lg font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Competitors
            </h3>
            <TagInput
              label="Top Competitors"
              description="Who are your main competitors? We'll compare your AI visibility against theirs."
              placeholder="e.g. Acme Corp"
              input={competitorInput}
              setInput={setCompetitorInput}
              items={competitors}
              setItems={setCompetitors}
            />
          </section>

          {/* What do you want to be found for */}
          <section className="bg-gray-900 border-2 border-orange-500 rounded-xl p-6 space-y-4">
            <h3
              className="text-lg font-bold text-white uppercase tracking-wider border-b border-gray-800 pb-3"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              What Do You Want To Be Found For?
            </h3>
            <TagInput
              label="Search Queries"
              description="Type the exact questions or phrases you want AI engines like ChatGPT, Claude, and Gemini to recommend you for."
              placeholder="e.g. best digital marketing agency in Sydney"
              input={keywordInput}
              setInput={setKeywordInput}
              items={keywords}
              setItems={setKeywords}
            />
            {client?.url && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/extract-keywords?url=${encodeURIComponent(client.url)}`
                    );
                    const data = await res.json();
                    if (data.keywords?.length) {
                      setKeywords((prev) => [...new Set([...prev, ...data.keywords])]);
                    }
                  } catch {
                    /* ignore */
                  }
                }}
                className="text-sm text-orange-400 hover:text-orange-300 underline"
              >
                Auto-extract keywords from website
              </button>
            )}
          </section>

          {errorMsg && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-900 rounded-lg p-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={
              pageState === "submitting" ||
              !contactName ||
              !email ||
              services.length === 0
            }
            className="w-full px-8 py-4 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg uppercase tracking-wider"
          >
            {pageState === "submitting"
              ? "Starting Audit..."
              : "Start My AI Visibility Audit"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Your audit will analyse visibility across ChatGPT, Claude, Gemini,
            Perplexity, Grok, and Google AI.
          </p>
        </form>
      </main>

      <footer className="bg-black border-t border-gray-800 py-6 mt-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <a href="https://aieconomy.ai" className="text-orange-400 hover:underline">
              AI Economy
            </a>{" "}
            &middot; Balmer Agency
          </p>
        </div>
      </footer>
    </div>
  );
}
