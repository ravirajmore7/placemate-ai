"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/auth-store";

type AuthResponse = {
  user: User;
  accessToken: string;
};

function destination(role: Role) {
  if (role === "STUDENT") return "/student/dashboard";
  if (role === "TPO_ADMIN") return "/tpo/dashboard";
  return "/admin/overview";
}

const proofPoints = [
  "Role-based dashboards for students, TPOs, and admins",
  "Readiness scoring across resume, skills, projects, and academics",
  "Drive eligibility and applications kept in one clean workflow"
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role>("STUDENT");
  const isLogin = mode === "login";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = isLogin
      ? { email: form.get("email"), password: form.get("password") }
      : { name: form.get("name"), email: form.get("email"), password: form.get("password"), role };

    try {
      const response = await apiFetch<AuthResponse>(`/auth/${mode}`, { method: "POST", body });
      setSession(response.user, response.accessToken);
      toast({ title: "Welcome to PlaceMate AI", description: "Your workspace is ready." });
      router.push(destination(response.user.role));
    } catch (error) {
      toast({ title: "Authentication failed", description: error instanceof Error ? error.message : "Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-surface min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span>PlaceMate AI</span>
        </Link>
        <ThemeToggle />
      </div>
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 py-10 lg:grid-cols-[1fr_440px]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Investor-demo ready placement intelligence
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-semibold tracking-tight">
                One polished workspace for modern campus placements.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                PlaceMate AI helps colleges verify skills, manage drives, and understand student readiness before hiring season peaks.
              </p>
            </div>
            <div className="grid gap-3">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 rounded-xl border bg-background/60 p-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
        >
          <Card className="soft-shadow overflow-hidden border-primary/10">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{isLogin ? "Welcome back" : "Create your workspace"}</CardTitle>
                <CardDescription className="mt-2">
                  {isLogin ? "Sign in to continue tracking placement readiness." : "Start with a student or TPO admin account."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <form className="grid gap-4" onSubmit={onSubmit}>
                {!isLogin ? (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" required placeholder="Aarav Sharma" />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required placeholder="student1@placemate.ai" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} placeholder="Password@123" />
                </div>
                {!isLogin ? (
                  <div className="grid gap-2">
                    <Label>Workspace role</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TPO_ADMIN">TPO Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <Button disabled={loading} className="mt-1">
                  {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
                  {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                </Button>
              </form>
              <div className="rounded-xl border bg-muted/30 p-3 text-xs leading-6 text-muted-foreground">
                Demo password: <span className="font-mono text-foreground">Password@123</span>
                <br />
                Accounts: <span className="font-mono text-foreground">student1@placemate.ai</span>,{" "}
                <span className="font-mono text-foreground">tpo@placemate.ai</span>,{" "}
                <span className="font-mono text-foreground">admin@placemate.ai</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Need an account?" : "Already registered?"}{" "}
                <Link href={isLogin ? "/register" : "/login"} className="font-medium text-primary hover:underline">
                  {isLogin ? "Create one" : "Sign in"}
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
