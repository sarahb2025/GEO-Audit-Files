import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, AuthError } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { generateIntakeToken, generateReportSlug } from "@/lib/tokens";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("geo_clients")
      .select(
        "id, name, url, email, status, intake_token, report_slug, audit_id, intake_completed_at, created_at"
      )
      .eq("created_by", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    const body = await req.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "name and url are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const intake_token = generateIntakeToken();
    const report_slug = generateReportSlug(name);

    const { data: client, error } = await supabase
      .from("geo_clients")
      .insert({
        created_by: ctx.userId,
        name,
        url,
        intake_token,
        report_slug,
        status: "pending_intake",
      })
      .select("id, intake_token, report_slug")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
