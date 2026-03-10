import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, AuthError } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

const WORKER_URL = process.env.GEO_WORKER_URL;
const WORKER_API_KEY = process.env.GEO_WORKER_API_KEY;

// GET /api/geo-audits — list audits for the user's org
export async function GET() {
  try {
    const ctx = await getAuthContext();
    const supabase = await createClient();

    const query = supabase
      .from("geo_audits")
      .select(
        "id, brand_name, brand_url, status, visibility_rate, total_queries, total_mentioned, engines, created_at, completed_at, duration_seconds"
      )
      .order("created_at", { ascending: false });

    query.eq("created_by", ctx.userId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ audits: data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

// POST /api/geo-audits — create a new audit and trigger the worker
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = await req.json();

    const {
      brand_name,
      brand_url,
      competitors,
      engines,
      prompts,
    }: {
      brand_name: string;
      brand_url: string;
      competitors: string[];
      engines: string[];
      prompts: { prompt_id: number; category: string; prompt_text: string }[];
    } = body;

    // Validate
    if (!brand_name || !brand_url || !prompts?.length || !engines?.length) {
      return NextResponse.json(
        { error: "brand_name, brand_url, prompts, and engines are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Create the audit row
    const { data: audit, error: auditErr } = await supabase
      .from("geo_audits")
      .insert({
        created_by: ctx.userId,
        brand_name,
        brand_url,
        competitors: competitors || [],
        engines,
        status: "pending",
        progress_total: prompts.length * engines.length,
      })
      .select("id")
      .single();

    if (auditErr || !audit) {
      return NextResponse.json(
        { error: auditErr?.message || "Failed to create audit." },
        { status: 500 }
      );
    }

    // 2. Insert prompts
    const promptRows = prompts.map((p) => ({
      audit_id: audit.id,
      prompt_id: p.prompt_id,
      category: p.category,
      prompt_text: p.prompt_text,
    }));

    const { error: promptErr } = await supabase
      .from("geo_audit_prompts")
      .insert(promptRows);

    if (promptErr) {
      return NextResponse.json(
        { error: promptErr.message },
        { status: 500 }
      );
    }

    // 3. Trigger the Python worker
    if (WORKER_URL && WORKER_API_KEY) {
      try {
        await fetch(`${WORKER_URL}/api/audits/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WORKER_API_KEY}`,
          },
          body: JSON.stringify({ audit_id: audit.id }),
        });
      } catch (workerErr) {
        // Worker trigger failed — mark audit as failed
        await supabase
          .from("geo_audits")
          .update({
            status: "failed",
            error_message: "Failed to reach audit worker. Please try again.",
          })
          .eq("id", audit.id);

        return NextResponse.json(
          { error: "Failed to start audit worker." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ audit_id: audit.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
