import { createClient } from "@/lib/supabase/server";

export interface AuthContext {
  userId: string;
  email: string;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError("Unauthorized");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
  };
}
