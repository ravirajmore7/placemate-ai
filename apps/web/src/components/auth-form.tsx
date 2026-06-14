"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role>("STUDENT");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body =
      mode === "login"
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
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <CardTitle>{mode === "login" ? "Login" : "Create your account"}</CardTitle>
          <CardDescription>
            Demo passwords use <span className="font-mono">Password@123</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            {mode === "register" ? (
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
            {mode === "register" ? (
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TPO_ADMIN">TPO Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Button disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}</Button>
          </form>
          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Demo: <span className="font-mono">student1@placemate.ai</span>, <span className="font-mono">tpo@placemate.ai</span>,{" "}
            <span className="font-mono">admin@placemate.ai</span>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
            <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-primary">
              {mode === "login" ? "Register" : "Login"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
