"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize the Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function getUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return { error: error.message };
  }
  return { users: data.users };
}

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !role) {
    return { error: "Email, password, and role are required." };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (error) {
    console.error("Error creating user:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, user: data.user };
}

export async function updateUser(id: string, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  const updates: any = {
    user_metadata: { role },
  };

  if (email) updates.email = email;
  if (password) updates.password = password;

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updates);

  if (error) {
    console.error("Error updating user:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true, user: data.user };
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    console.error("Error deleting user:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
