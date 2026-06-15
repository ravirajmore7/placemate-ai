import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, Briefcase, CheckCircle2, Database, Gauge, Lock, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { title: "Student readiness", icon: BrainCircuit, body: "Profile, resume, projects, skills, coding profiles, and rule-based scoring." },
  { title: "Drive management", icon: Briefcase, body: "TPOs create drives with branch, CGPA, backlog, skill, and date criteria." },
  { title: "Application tracker", icon: Users, body: "Students apply and track status while TPOs shortlist and update progress." },
  { title: "Analytics", icon: BarChart3, body: "Dashboards show branch, drive, readiness, application, and selection metrics." },
  { title: "RBAC security", icon: Lock, body: "JWT auth with Student, TPO Admin, and Super Admin access controls." },
  { title: "AI-ready data", icon: Database, body: "Clean relational data and an AI-service placeholder for Stage 2 integrations." }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="premium-grid border-b">
          <div className="container py-16">
            <PageHeader
              eyebrow="Features"
              badge="Stage 1 ready"
              title="A placement OS, not a spreadsheet clone."
              description="Stage 1 focuses on the durable product surface: profiles, drives, eligibility, applications, dashboards, and analytics."
              actions={
                <Button asChild>
                  <Link href="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              }
            />
          </div>
        </section>
        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="soft-shadow transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-muted-foreground">{item.body}</CardContent>
                </Card>
              );
            })}
          </div>
        </section>
        <section className="border-y bg-muted/25">
          <div className="container grid gap-8 py-16 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3">
              <Badge variant="outline">Workflow depth</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Designed for the real placement season.</h2>
              <p className="leading-7 text-muted-foreground">
                The interface keeps high-frequency actions close: profile updates, eligibility checks, drive review, shortlists, and reporting.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Clean dashboards", "Readable dark mode", "Responsive tables", "Designed empty states"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border bg-background/70 p-4">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="container py-16">
          <Card className="soft-shadow border-primary/15">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-primary">
                  <Gauge className="h-4 w-4" />
                  SkillProof AI foundation
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Ready for Stage 2 AI matching and proof verification.</h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/login">Open demo</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
