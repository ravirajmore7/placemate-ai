import { BarChart3, BrainCircuit, Briefcase, Database, Lock, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { title: "Student readiness", icon: BrainCircuit, body: "Profile, resume, projects, skills, coding profiles, and rule-based scoring." },
  { title: "Drive management", icon: Briefcase, body: "TPOs create drives with branch, CGPA, backlog, skill, and date criteria." },
  { title: "Application tracker", icon: Users, body: "Students apply and track status; TPOs shortlist and update progress." },
  { title: "Analytics", icon: BarChart3, body: "Dashboards show branch, drive, readiness, application, and selection metrics." },
  { title: "RBAC security", icon: Lock, body: "JWT auth with Student, TPO Admin, and Super Admin access controls." },
  { title: "AI-ready data", icon: Database, body: "Clean relational schema and placeholder AI service for Stage 2 integrations." }
];

export default function FeaturesPage() {
  return (
    <div>
      <SiteHeader />
      <main className="container py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold">A placement OS, not a spreadsheet clone.</h1>
          <p className="mt-4 text-muted-foreground">
            Stage 1 focuses on the durable product surface: profiles, drives, eligibility, applications, and dashboards.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
            <Card key={item.title}>
              <CardHeader>
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.body}</CardContent>
            </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
