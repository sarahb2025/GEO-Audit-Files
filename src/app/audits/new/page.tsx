"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromptRow {
  prompt_id: number;
  category: string;
  prompt_text: string;
  prompt_type: "intent" | "ranking";
}

export default function NewAuditPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Form State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  
  // Lists
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  
  // Prompts
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Helpers
  function addCompetitor(e?: React.KeyboardEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    const comp = competitorInput.trim();
    if (comp && !competitors.includes(comp)) {
      setCompetitors([...competitors, comp]);
      setCompetitorInput("");
    }
  }

  function removeCompetitor(comp: string) {
    setCompetitors(competitors.filter((c) => c !== comp));
  }

  function addKeyword(e?: React.KeyboardEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw));
  }

  function handlePromptEdit(id: number, newText: string) {
    setPrompts((prev) => 
      prev.map((p) => p.prompt_id === id ? { ...p, prompt_text: newText } : p)
    );
  }

  function addNewPromptManually(type: "intent" | "ranking") {
    const nextId = prompts.length > 0 ? Math.max(...prompts.map((p) => p.prompt_id)) + 1 : 1;
    setPrompts([...prompts, { 
      prompt_id: nextId, 
      category: keywords[0] || "General", 
      prompt_text: "", 
      prompt_type: type 
    }]);
  }

  function removePrompt(id: number) {
    setPrompts((prev) => prev.filter((p) => p.prompt_id !== id));
  }

  async function handleGeneratePrompts() {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brandName,
          brand_url: brandUrl,
          competitors,
          keywords
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prompts.");

      let idCounter = 1;
      const newPrompts: PromptRow[] = [];
      const primaryCat = keywords[0] || "General";

      (data.intent_prompts || []).forEach((text: string) => {
        newPrompts.push({ prompt_id: idCounter++, category: primaryCat, prompt_text: text, prompt_type: "intent" });
      });
      (data.ranking_prompts || []).forEach((text: string) => {
        newPrompts.push({ prompt_id: idCounter++, category: primaryCat, prompt_text: text, prompt_type: "ranking" });
      });

      setPrompts(newPrompts);
      setStep(5); // Go to Intent editing step
    } catch (err: any) {
      setError(err.message || "Failed to generate prompts.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(e: React.MouseEvent) {
    e.preventDefault();
    const validRanking = prompts.filter(p => p.prompt_type === "ranking" && p.prompt_text.trim() !== "");
    if (validRanking.length === 0) {
      setError("Please provide at least one valid ranking prompt to run the audit.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/geo-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName,
          user_email: userEmail,
          brand_name: brandName,
          brand_url: brandUrl,
          competitors,
          keywords,
          prompts: prompts.filter(p => p.prompt_text.trim() !== "") // filter empty ones
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create audit.");
      }

      router.push(`/audits/${data.audit_id}`);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const nextStep = () => {
    setError("");
    if (step === 1 && (!userName.trim() || !userEmail.trim())) {
      setError("Please fill out both Name and Email to continue.");
      return;
    }
    if (step === 2 && (!brandName.trim() || !brandUrl.trim())) {
      setError("Please fill out both Company Name and Website URL to continue.");
      return;
    }
    if (step === 3 && competitors.length === 0) {
      setError("Please add at least one competitor to continue.");
      return;
    }
    if (step === 4) {
      if (keywords.length === 0) {
        setError("Please add at least one keyword to continue.");
        return;
      }
      handleGeneratePrompts();
      return;
    }
    if (step === 5) {
      const validIntents = prompts.filter(p => p.prompt_type === "intent" && p.prompt_text.trim() !== "");
      if (validIntents.length === 0) {
        setError("Please provide at least one valid search intent to continue.");
        return;
      }
    }
    setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);

  const intentPrompts = prompts.filter(p => p.prompt_type === "intent");
  const rankingPrompts = prompts.filter(p => p.prompt_type === "ranking");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/audits")} className="text-gray-500 hover:text-gray-700 font-medium transition-colors">
            &larr; Back to Dashboard
          </button>
          <div className="text-sm font-semibold text-gray-400">Step {step} of 6</div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          
          {/* STEP 1: Name and Email */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's get started.</h2>
                <p className="text-gray-500 text-lg">Who is running this audit?</p>
              </div>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Brand Info */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about the company.</h2>
                <p className="text-gray-500 text-lg">What brand are we auditing?</p>
              </div>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Legal"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={brandUrl}
                    onChange={(e) => setBrandUrl(e.target.value)}
                    placeholder="e.g. acmelegal.com.au"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Competitors */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Who are your main competitors?</h2>
                <p className="text-gray-500 text-lg">Add as many as you'd like. We'll track their visibility against yours.</p>
              </div>
              <div className="pt-4">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor(e)}
                    placeholder="e.g. Smith & Co"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={addCompetitor}
                    className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800"
                  >
                    Add (+)
                  </button>
                </div>
                {competitors.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {competitors.map((comp) => (
                      <li key={comp} className="flex justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="font-medium text-gray-800">{comp}</span>
                        <button onClick={() => removeCompetitor(comp)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Keywords */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What keywords do you want to be found for?</h2>
                <p className="text-gray-500 text-lg">e.g. Criminal Lawyer, Melbourne Lawyer, Family Lawyer</p>
              </div>
              <div className="pt-4">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addKeyword(e)}
                    placeholder="e.g. Family Lawyer"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={addKeyword}
                    className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800"
                  >
                    Add (+)
                  </button>
                </div>
                {keywords.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {keywords.map((kw) => (
                      <li key={kw} className="flex justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="font-medium text-gray-800">{kw}</span>
                        <button onClick={() => removeKeyword(kw)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Search Intents */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">If someone was searching for your business, what would they type in?</h2>
                <p className="text-gray-500 text-lg">We generated these examples based on your keywords. Feel free to edit them.</p>
              </div>
              <div className="pt-6">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
                  {intentPrompts.map((p, idx) => (
                    <div key={p.prompt_id} className="flex gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start justify-center pt-2 w-8 text-gray-400 font-mono font-medium text-sm select-none">
                        {idx + 1}.
                      </div>
                      <textarea
                        value={p.prompt_text}
                        onChange={(e) => handlePromptEdit(p.prompt_id, e.target.value)}
                        rows={2}
                        placeholder="Enter search intent..."
                        className="flex-1 py-1 px-2 border-0 bg-transparent focus:ring-0 resize-none text-gray-800 placeholder-gray-300 leading-relaxed outline-none"
                      />
                      <button 
                        onClick={() => removePrompt(p.prompt_id)} 
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-all"
                        title="Remove prompt"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addNewPromptManually("intent")} className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2">
                  + Add another query
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Ranking Prompts */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">We are going to see how you rank for prompts like these:</h2>
                <p className="text-gray-500 text-lg">Review and adjust the specific ranking queries we will test against the AI engines.</p>
              </div>
              <div className="pt-6 max-h-[600px] overflow-y-auto pr-2 pb-4">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
                  {rankingPrompts.map((p, idx) => (
                    <div key={p.prompt_id} className="flex gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex items-start justify-center pt-2 w-8 text-gray-400 font-mono font-medium text-sm select-none">
                        {idx + 1}.
                      </div>
                      <textarea
                        value={p.prompt_text}
                        onChange={(e) => handlePromptEdit(p.prompt_id, e.target.value)}
                        rows={2}
                        placeholder="Enter ranking search..."
                        className="flex-1 py-1 px-2 border-0 bg-transparent focus:ring-0 resize-none text-gray-800 placeholder-gray-300 leading-relaxed outline-none"
                      />
                      <button 
                        onClick={() => removePrompt(p.prompt_id)} 
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-all"
                        title="Remove ranking prompt"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addNewPromptManually("ranking")} className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2">
                  + Add more ranking prompts
                </button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                 <div className="text-blue-500 text-xl font-bold mt-1">i</div>
                 <p className="text-sm text-blue-900 leading-relaxed">
                   <strong>Ready to run.</strong> When you click the diagnostic button, we will launch our AI agents 
                   to test these {prompts.filter(p => p.prompt_text).length} prompts across all major Generative Engines 
                   (ChatGPT, Claude, Perplexity, Gemini, etc.). This usually takes 2-3 minutes.
                 </p>
              </div>
            </div>
          )}

          {/* FOOTER CONTROLS */}
          <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                disabled={isGenerating || submitting}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 disabled:opacity-50"
              >
                Go Back
              </button>
            ) : <div/>}

            {step < 6 ? (
              <button
                onClick={nextStep}
                disabled={isGenerating || (step === 2 && (!brandName || !brandUrl))}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>Generating Prompts <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full font-bold"></span></>
                ) : "Continue"}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? "Running Audit..." : "Run Diagnostic"}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
