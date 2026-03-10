import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, AuthError } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getAuthContext();
    const { id } = await params;
    const supabase = await createClient();

    const { data: client, error } = await supabase
      .from("geo_clients")
      .select("*")
      .eq("id", id)
      .eq("created_by", ctx.userId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    let audit = null;
    if (client.audit_id) {
      const { data } = await supabase
        .from("geo_audits")
        .select(
          "id, status, visibility_rate, total_queries, total_mentioned, dashboard_url, summary_json, engines, completed_at, duration_seconds"
        )
        .eq("id", client.audit_id)
        .single();
      audit = data;
    }

    return NextResponse.json({ client, audit });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
