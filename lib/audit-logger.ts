import { createClient } from "@/lib/supabase/client";

export type AuditAction =
  | "login"
  | "logout"
  | "rule_created"
  | "rule_updated"
  | "rule_deleted"
  | "company_created"
  | "company_updated"
  | "company_deleted"
  | "car_created"
  | "car_updated"
  | "car_deleted";

interface LogParams {
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Client-side audit logger — call this from components after mutations.
 */
export async function logAction(params: LogParams) {
  try {
    const supabase = createClient();
    await supabase.from("audit_logs").insert({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    // Never throw — audit logging must not break core flows
    console.warn("Audit log failed:", err);
  }
}

/**
 * Logs a login event. Call from the login page after successful auth.
 */
export async function logLogin(userId: string, userEmail: string) {
  return logAction({ userId, userEmail, action: "login" });
}

/**
 * Logs a logout event.
 */
export async function logLogout(userId: string, userEmail: string) {
  return logAction({ userId, userEmail, action: "logout" });
}
