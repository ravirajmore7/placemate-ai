import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  FileSearch,
  GraduationCap,
  ShieldCheck
} from "lucide-react";
import { MotionReveal } from "@/components/motion";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "Readiness Score", icon: BrainCircuit, body: "Rule-based Stage 1 scoring across profile, resume, skills, projects, coding proof, CGPA, and backlogs." },
  { title: "Drive Eligibility", icon: BriefcaseBusiness, body: "Students see clear eligibility reasons before applying to company drives." },
  { title: "TPO Analytics", icon: BarChart3, body: "Branch-wise counts, drive-wise applications, shortlist views, and readiness distribution." },
  { title: "Skill Proof Ready", icon: FileSearch, body: "Architecture is prepared for GitHub, LeetCode, HackerRank, resume AI, and JD matching in Stage 2." }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="premium-grid border-b">
          <div className="container grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <MotionReveal className="space-y-8">
              <Badge variant="secondary" className="gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Stage 1 SaaS foundation for placement teams
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  PlaceMate AI turns placement readiness into a live operating system.
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Track student profiles, skill proof, company drives, eligibility, applications, and analytics from one polished dashboard.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Use demo login</Link>
                </Button>
              </div>
            </MotionReveal>
            <MotionReveal className="glass-panel rounded-lg border p-5 shadow-2xl">
              <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Placement Readiness</p>
                    <p className="text-4xl font-semibold">84</p>
                  </div>
                  <BadgeCheck className="h-10 w-10 text-primary" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Profile 92%", "Resume 15/15", "Projects 2", "Applications 4"].map((item) => (
                    <div key={item} className="rounded-md border bg-background/60 p-4 text-sm font-medium">
                      {item}
                    </div>
                  ))}
                </div>
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-base">Eligibility preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Amazon SDE Intern: academically eligible, missing AWS and System Design.</p>
                    <p>TCS Ninja: eligible for application.</p>
                  </CardContent>
                </Card>
              </div>
            </MotionReveal>
          </div>
        </section>
        <section className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge variant="outline">MVP modules</Badge>
              <h2 className="mt-3 text-3xl font-semibold">Built for students, TPOs, and Stage 2 AI.</h2>
            </div>
            <GraduationCap className="hidden h-10 w-10 text-primary sm:block" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{feature.body}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
