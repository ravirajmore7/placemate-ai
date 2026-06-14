import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const tiers = [
  { name: "Student", price: "Free", features: ["Profile builder", "Readiness score", "Drive applications"] },
  { name: "College", price: "Coming soon", features: ["TPO dashboard", "Analytics", "Shortlists"] },
  { name: "Enterprise", price: "Stage 2", features: ["Recruiter portal", "AI matching", "Advanced integrations"] }
];

export default function PricingPage() {
  return (
    <div>
      <SiteHeader />
      <main className="container py-16">
        <Badge variant="outline">Pricing placeholder</Badge>
        <h1 className="mt-3 text-4xl font-semibold">Stage 1 ships without payments.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Razorpay subscriptions and college onboarding are reserved for Stage 2. The architecture already leaves room for it.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name}>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <div className="text-3xl font-semibold">{tier.price}</div>
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
                <Button className="w-full" variant={tier.name === "Student" ? "default" : "outline"}>Select</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
