import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  FileSearch,
  Gauge,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { MotionReveal } from "@/components/motion";
import { ReadinessRing } from "@/components/readiness-ring";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const featureCards = [
  { title: "Readiness scoring", icon: BrainCircuit, body: "Profile, resume, skills, projects, coding proof, CGPA, and backlog signals in one score." },
  { title: "Company drive OS", icon: BriefcaseBusiness, body: "Create drives, define eligibility, publish deadlines, and monitor application volume." },
  { title: "SkillProof profile", icon: FileSearch, body: "Store GitHub, LeetCode, HackerRank, resume, projects, and education proof for Stage 2 AI." },
  { title: "TPO analytics", icon: BarChart3, body: "Track branch distribution, readiness buckets, drive performance, shortlists, and selected students." }
];

const benefits = [
  { title: "Students", icon: GraduationCap, body: "Know what to improve before applying, keep proof updated, and track every application status." },
  { title: "TPO teams", icon: Building2, body: "Replace scattered sheets with role-aware dashboards, drive filters, shortlists, and reporting." },
  { title: "Recruiter-ready", icon: Users, body: "Prepare verified student snapshots and company-wise fit signals for future recruiter workflows." }
];

const workflow = [
  "Students build a complete placement profile",
  "TPO teams publish company drives and criteria",
  "PlaceMate AI checks readiness and eligibility",
  "Applications, status changes, and reports stay synced"
];

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="premium-grid overflow-hidden border-b">
          <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr]">
            <MotionReveal className="space-y-8">
              <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Stage 1 SaaS foundation for modern colleges
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  AI-Powered Placement Intelligence for Modern Colleges
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Track students, manage drives, verify skills, analyze resumes, and generate company-wise placement readiness scores from one powerful platform.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">View Demo</Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {["GitHub", "LeetCode", "HackerRank", "Resume AI ready"].map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full">{item}</Badge>
                ))}
              </div>
            </MotionReveal>

            <MotionReveal className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-background/80 p-4 shadow-xl backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Company fit</p>
                      <p className="mt-1 text-2xl font-semibold">92%</p>
                    </div>
                    <StatusBadge status="ELIGIBLE" />
                  </div>
                </div>
                <div className="rounded-xl border bg-background/80 p-4 shadow-xl backdrop-blur">
                  <p className="text-xs text-muted-foreground">Applications</p>
                  <p className="mt-1 text-2xl font-semibold">428</p>
                  <p className="text-xs text-muted-foreground">across 12 open drives</p>
                </div>
              </div>
              <Card className="glass-panel soft-shadow overflow-hidden border-primary/15">
                <CardHeader className="border-b bg-muted/25">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Placement command center</CardTitle>
                      <CardDescription>Live readiness and drive intelligence</CardDescription>
                    </div>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-5 p-5">
                  <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                    <ReadinessRing score={84} level="Highly Ready" />
                    <div className="grid gap-3">
                      <PreviewMetric label="Profile completion" value="92%" />
                      <PreviewMetric label="Open drives" value="18" />
                      <PreviewMetric label="Shortlisted students" value="64" />
                    </div>
                  </div>
                  <div className="rounded-xl border bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Amazon SDE Intern</p>
                        <p className="text-sm text-muted-foreground">Company-wise readiness preview</p>
                      </div>
                      <StatusBadge status="PARTIALLY_READY" label="Partially Ready" />
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>DSA and coding proof</span>
                          <span>78%</span>
                        </div>
                        <Progress value={78} />
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>Resume and projects</span>
                          <span>88%</span>
                        </div>
                        <Progress value={88} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionReveal>
          </div>
        </section>

        <section className="container grid gap-6 py-16 md:grid-cols-2">
          <Card className="soft-shadow">
            <CardHeader>
              <Badge variant="outline" className="w-fit">The problem</Badge>
              <CardTitle className="text-2xl">Placement data is usually split across forms, sheets, resumes, and chat groups.</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              Students do not know why they are not ready, TPO teams spend hours reconciling drive eligibility, and leadership gets delayed reporting.
            </CardContent>
          </Card>
          <Card className="soft-shadow border-primary/20">
            <CardHeader>
              <Badge variant="default" className="w-fit">The solution</Badge>
              <CardTitle className="text-2xl">A single placement intelligence layer for every role.</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              PlaceMate AI combines student proof, drive criteria, readiness scoring, applications, and analytics into a clean SaaS workflow.
            </CardContent>
          </Card>
        </section>

        <section className="container py-16">
          <div className="mb-8 max-w-2xl">
            <Badge variant="outline">Key features</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Everything Stage 1 needs to feel operational on day one.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="soft-shadow transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">{feature.body}</CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y bg-muted/25">
          <div className="container grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">SkillProof AI</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Turn skill claims into a readiness narrative.</h2>
              <p className="leading-7 text-muted-foreground">
                Stage 1 stores the core proof layer. Stage 2 can add resume AI, GitHub analysis, coding platform snapshots, JD matching, and recruiter-ready verification.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Resume signal", "15/15"],
                ["Project proof", "2 strong"],
                ["Coding links", "3 connected"],
                ["Company fit", "High"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-background/70 p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title}>
                  <CardHeader>
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle>{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">{benefit.body}</CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="container grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="outline">How it works</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">A clear workflow from profile to placement outcome.</h2>
          </div>
          <div className="grid gap-3">
            {workflow.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-xl border bg-card p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-semibold text-primary">{index + 1}</span>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="container py-16">
          <Card className="soft-shadow overflow-hidden border-primary/15">
            <CardContent className="grid gap-8 p-6 lg:grid-cols-[1fr_360px] lg:p-8">
              <div className="space-y-4">
                <Badge variant="outline">Pricing preview</Badge>
                <h2 className="text-3xl font-semibold tracking-tight">Start with the free Stage 1 workspace.</h2>
                <p className="leading-7 text-muted-foreground">
                  Student and college SaaS plans can layer in later without changing the core placement workflow.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/25 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Stage 1 MVP</p>
                    <p className="text-sm text-muted-foreground">No payments configured</p>
                  </div>
                  <Badge variant="success">Ready</Badge>
                </div>
                <Button className="mt-5 w-full" asChild>
                  <Link href="/pricing">View pricing placeholder</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="border-t bg-foreground text-background">
          <div className="container grid gap-8 py-16 text-center">
            <div className="mx-auto max-w-2xl space-y-4">
              <Gauge className="mx-auto h-9 w-9" />
              <h2 className="text-3xl font-semibold tracking-tight">Ready to demo a premium placement platform?</h2>
              <p className="text-background/70">
                Launch the dashboard, use the demo credentials, and walk colleges through a polished readiness workflow.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground" asChild>
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>PlaceMate AI / SkillProof AI</p>
          <div className="flex gap-4">
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/login" className="hover:text-foreground">Demo login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
