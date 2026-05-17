/**
 * User Seed Script — creates/updates the two required system users.
 *
 * Usage: bun run scripts/seed-users.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in env (not the anon key).
 * Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY=...
 */

export {}; // Tells TypeScript this is a module with isolated scope

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.",
  );
  process.exit(1);
}

const USERS = [
  {
    email: "admin@sky.eg",
    password: "SkyAdmin2026!",
    role: "super_admin",
    label: "Super Admin",
  },
  {
    email: "ali.elkasaby@sky.eg",
    password: "AD123ad123",
    role: "operation",
    label: "Operations Admin",
  },
];

async function adminFetch(path: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function listUsers(): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
  });
  const data = await res.json();
  return data.users || [];
}

async function updateUser(userId: string, role: string, password?: string) {
  const payload: any = { user_metadata: { role } };
  if (password) {
    payload.password = password;
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function main() {
  console.log("🌱  Seeding users...\n");

  const existingUsers = await listUsers();

  for (const u of USERS) {
    const existing = existingUsers.find(
      (eu) => eu.email.toLowerCase() === u.email.toLowerCase(),
    );

    if (existing) {
      console.log(
        `↩️   User ${u.email} already exists — updating role and password...`,
      );
      const updated = await updateUser(existing.id, u.role, u.password);
      if (updated.id) {
        console.log(`✅  Updated: ${u.email} (${u.label})\n`);
      } else {
        console.error(`❌  Failed to update ${u.email}:`, updated);
      }
    } else {
      console.log(`➕  Creating ${u.email} (${u.label})...`);
      const result = await adminFetch("/users", {
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { role: u.role },
      });

      if (result.id) {
        console.log(`✅  Created: ${u.email} → role: ${u.role}\n`);
      } else {
        console.error(`❌  Failed to create ${u.email}:`, result);
      }
    }
  }

  console.log("Done ✓");
}

main();
