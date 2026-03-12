"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Loader2, Eye, EyeOff, Codepen } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("sales");
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
      // Check if it's invalid credentials
      if (error.message.includes("Invalid login credentials")) {
        // As a fallback for the demo, try to create the user if it doesn't exist yet
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role: selectedRole },
            },
          });

        if (signUpError) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // If sign up worked and auto-logged in
        if (signUpData.session) {
          router.push(
            selectedRole === "operation" ? "/operations/cars" : "/sales",
          );
          router.refresh();
        } else {
          setError("Invalid credentials. Please try again.");
        }
      } else {
        setError(error.message);
      }
    } else {
      const userRole = data.user?.user_metadata?.role || "sales";

      // Enforce selected role matches actual DB role
      if (userRole !== selectedRole) {
        await supabase.auth.signOut();
        setError(
          `This user does not have '${selectedRole}' privileges. Please select the correct role.`,
        );
        setLoading(false);
        return;
      }

      router.push(userRole === "operation" ? "/operations/cars" : "/sales");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/50">
            <Codepen className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-syne text-white">
            Sky Insurance
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-syne font-semibold text-white mb-6">
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
              <label className="text-sm font-medium text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium text-slate-300 ">
                Sign in as
              </label>
              <RadioGroup
                value={selectedRole}
                onValueChange={setSelectedRole}
                className="flex flex-row pt-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="sales" id="role-sales" />
                  <label
                    htmlFor="role-sales"
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    Sales Agent
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="operation" id="role-operation" />
                  <label
                    htmlFor="role-operation"
                    className="text-sm text-slate-300 cursor-pointer"
                  >
                    Operations Manager
                  </label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
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
