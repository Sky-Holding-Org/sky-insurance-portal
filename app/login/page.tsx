"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff, Codepen } from "lucide-react";
import { logLogin } from "@/lib/audit-logger";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const userRole = data.user?.user_metadata?.role || "sales";
    const userId = data.user?.id || "";
    const userEmail = data.user?.email || "";

    // Fire-and-forget audit log
    logLogin(userId, userEmail);

    if (userRole === "super_admin") {
      router.push("/admin/audit-logs");
    } else if (userRole === "operation") {
      router.push("/operations/cars");
    } else {
      router.push("/sales");
    }
    router.refresh();

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-600 dark:text-teal-400">
            <Codepen className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-syne text-foreground">
            Sky Insurance
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-syne font-semibold text-foreground mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 h-10 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-lg pl-3 pr-10 py-2 h-10 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2 h-10 rounded-lg transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
