import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const tiers = [
  { name: "Student", price: "Free", status: "OPEN", features: ["Profile builder", "Readiness score", "Drive applications", "Application tracker"] },
  { name: "College", price: "Coming soon", status: "PARTIALLY_READY", features: ["TPO dashboard", "Drive management", "Analytics", "Shortlists"] },
  { name: "Enterprise", price: "Stage 2", status: "DRAFT", features: ["Recruiter portal", "AI matching", "Advanced integrations", "Tenant controls"] }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="premium-grid border-b">
          <div className="container py-16">
            <PageHeader
              eyebrow="Pricing"
              badge="Placeholder"
              title="Stage 1 ships without payments."
              description="Subscriptions and college onboarding can arrive in Stage 2. For now, the product focuses on a complete demo-ready placement workflow."
              actions={
                <Button asChild>
                  <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              }
            />
          </div>
        </section>
        <section className="container py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <Card key={tier.name} className="soft-shadow relative overflow-hidden">
                {tier.name === "College" ? (
                  <div className="absolute right-4 top-4">
                    <Badge variant="default" className="gap-1"><Sparkles className="h-3 w-3" /> Planned</Badge>
                  </div>
                ) : null}
                <CardHeader className="space-y-4">
                  <div>
                    <CardTitle>{tier.name}</CardTitle>
                    <div className="mt-3 text-3xl font-semibold tracking-tight">{tier.price}</div>
                  </div>
                  <StatusBadge status={tier.status} label={tier.name === "Student" ? "Available" : tier.name === "College" ? "Planned" : "Future"} />
                </CardHeader>
                <CardContent className="space-y-3">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={tier.name === "Student" ? "default" : "outline"} disabled={tier.name !== "Student"} asChild={tier.name === "Student"}>
                    {tier.name === "Student" ? <Link href="/register">Select plan</Link> : <span>Preview only</span>}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
