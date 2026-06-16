"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CreditCard,
  Eye,
  FileText,
  IndianRupee,
  ListChecks,
  Mail,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserCog,
  Users
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { BillingOverview, CandidateSummary, Organization, Paginated, Plan, RecruiterJob, Subscription, UsageSummary } from "@/lib/types";
import { formatCurrency, formatDate, toTitle } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { SiteHeader } from "@/components/site-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Items<T> = { items: T[] };

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function rupees(amount: number) {
  if (!amount) return "Contact sales";
  return formatCurrency(amount / 100);
}

function Field({ label, name, defaultValue, placeholder, type = "text" }: { label: string; name: string; defaultValue?: string | number | null; placeholder?: string; type?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} />
    </div>
  );
}

function UsageMeters({ usage }: { usage?: UsageSummary }) {
  const items = usage?.items ?? [];
  if (!items.length) return <EmptyState icon={BarChart3} title="No usage yet" message="Usage counters appear as your team works." className="min-h-40" />;
  return (
    <div className="grid gap-3">
      {items.slice(0, 6).map((item) => {
        const percent = item.limit ? Math.min(100, (item.used / item.limit) * 100) : 18;
        return (
          <div key={item.featureKey} className="rounded-xl border bg-muted/25 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{toTitle(item.featureKey)}</span>
              <span className="text-muted-foreground">{item.used}{item.limit ? ` / ${item.limit}` : " used"}</span>
            </div>
            <Progress value={percent} />
          </div>
        );
      })}
    </div>
  );
}

function PlanCard({ plan, cta = "Select plan", onSelect }: { plan: Plan; cta?: string; onSelect?: (plan: Plan) => void }) {
  return (
    <Card className="soft-shadow flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription className="mt-2">{plan.description}</CardDescription>
          </div>
          <Badge variant="outline">{plan.audience}</Badge>
        </div>
        <div className="text-3xl font-semibold tracking-tight">{rupees(plan.priceMonthly)}<span className="text-sm font-normal text-muted-foreground"> / month</span></div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-2">
          {list(plan.featuresJson).slice(0, 6).map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {feature}
            </div>
          ))}
        </div>
        <Button className="mt-auto w-full" variant={plan.priceMonthly ? "default" : "outline"} onClick={() => onSelect?.(plan)}>
          {plan.priceMonthly ? cta : "Contact sales"}
        </Button>
      </CardContent>
    </Card>
  );
}

async function loadRazorpay() {
  if (window.Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BillingDashboard({ title = "Billing" }: { title?: string }) {
  const queryClient = useQueryClient();
  const billing = useQuery({ queryKey: ["billing-current"], queryFn: () => apiFetch<BillingOverview>("/billing/current") });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => apiFetch<Plan[]>("/plans") });
  const checkout = useMutation({
    mutationFn: (plan: Plan) => apiFetch<Record<string, any>>("/billing/create-subscription", { method: "POST", body: { planCode: plan.code, billingCycle: "monthly" } }),
    onSuccess: async (payload) => {
      if (!payload.configured) {
        toast({ title: "Payments are not configured", description: String(payload.message ?? "Add Razorpay keys to enable checkout.") });
        queryClient.invalidateQueries({ queryKey: ["billing-current"] });
        return;
      }
      const ready = await loadRazorpay();
      if (!ready || !window.Razorpay) {
        toast({ title: "Could not load Razorpay", variant: "destructive" });
        return;
      }
      const options = payload.checkout;
      const instance = new window.Razorpay({
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description,
        order_id: options.orderId,
        prefill: options.prefill,
        handler: async (response: Record<string, unknown>) => {
          await apiFetch("/payments/razorpay/verify", { method: "POST", body: response });
          toast({ title: "Payment verified", description: "Subscription is active." });
          queryClient.invalidateQueries({ queryKey: ["billing-current"] });
        }
      });
      instance.open();
    }
  });
  const current = billing.data?.subscription;

  if (billing.isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="SaaS billing" title={title} description="Manage subscription, usage, invoices, and payment status." />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="soft-shadow">
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{billing.data?.paymentsConfigured ? "Razorpay checkout is configured." : "Payments are not configured in this environment."}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-xl border bg-muted/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-semibold">{current?.plan?.name ?? "No active plan"}</div>
                  <p className="text-sm text-muted-foreground">{current?.currentPeriodEnd ? `Renews ${formatDate(current.currentPeriodEnd)}` : "Choose a plan to start billing."}</p>
                </div>
                <StatusBadge status={current?.status ?? "not_started"} label={toTitle(current?.status ?? "not started")} />
              </div>
            </div>
            <UsageMeters usage={billing.data?.usage} />
          </CardContent>
        </Card>
        <Card className="soft-shadow">
          <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {(billing.data?.payments ?? []).length ? billing.data?.payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/25 p-3 text-sm">
                <div>
                  <p className="font-medium">{rupees(payment.amount)}</p>
                  <p className="text-muted-foreground">{payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</p>
                </div>
                <StatusBadge status={payment.status} label={toTitle(payment.status)} />
              </div>
            )) : <EmptyState icon={CreditCard} title="No payments yet" message="Successful Razorpay payments will appear here." className="min-h-40" />}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(plans.data ?? []).map((plan) => <PlanCard key={plan.id} plan={plan} cta={checkout.isPending ? "Opening..." : "Upgrade"} onSelect={(selected) => checkout.mutate(selected)} />)}
      </div>
    </div>
  );
}

export function PricingSaasPage() {
  const [audience, setAudience] = React.useState("ALL");
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => apiFetch<Plan[]>("/plans") });
  const visible = (plans.data ?? []).filter((plan) => audience === "ALL" || plan.audience === audience);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="premium-grid border-b">
          <div className="container py-16">
            <PageHeader
              eyebrow="SaaS pricing"
              badge="Stage 3"
              title="Plans for students, colleges, and recruiters."
              description="Launch with Indian billing through Razorpay, usage limits, subscriptions, and contact-sales enterprise paths."
              actions={<Button asChild><Link href="/contact-sales">Contact sales <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {["ALL", "STUDENT", "COLLEGE", "RECRUITER"].map((item) => (
                <Button key={item} variant={audience === item ? "default" : "outline"} onClick={() => setAudience(item)}>{toTitle(item)}</Button>
              ))}
            </div>
          </div>
        </section>
        <section className="container py-14">
          {plans.isLoading ? <LoadingSkeleton rows={5} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visible.map((plan) => <PlanCard key={plan.id} plan={plan} cta="Start checkout" />)}</div>}
        </section>
      </main>
    </div>
  );
}

export function ContactSalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16">
        <PageHeader eyebrow="Contact sales" title="Build your verified placement network." description="Tell us about your college or hiring team and we will help configure the right Stage 3 plan." />
        <Card className="soft-shadow max-w-3xl">
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Field label="Name" name="name" />
            <Field label="Work email" name="email" />
            <Field label="Organization" name="organization" />
            <Field label="Phone" name="phone" />
            <div className="md:col-span-2"><Label>Message</Label><Textarea className="mt-2" rows={5} placeholder="Tell us about your students, hiring volume, or onboarding needs." /></div>
            <Button className="md:col-span-2">Send inquiry</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16">
        <PageHeader eyebrow="Demo" title="Stage 3 demo accounts" description="Use seeded accounts to explore recruiter, company admin, college admin, and super admin SaaS flows." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["Student", "student1@placemate.ai", "/student/dashboard"],
            ["TPO", "tpo@placemate.ai", "/tpo/dashboard"],
            ["College Admin", "college@placemate.ai", "/college/settings"],
            ["Recruiter", "recruiter@placemate.ai", "/recruiter/dashboard"],
            ["Company Admin", "company@placemate.ai", "/recruiter/dashboard"],
            ["Super Admin", "admin@placemate.ai", "/admin/saas-dashboard"]
          ].map(([role, email, href]) => (
            <Card key={email} className="soft-shadow">
              <CardHeader><CardTitle>{role}</CardTitle><CardDescription>{email}</CardDescription></CardHeader>
              <CardContent><Button asChild><Link href={href}>Open workspace</Link></Button></CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export function RecruiterDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["recruiter-dashboard"], queryFn: () => apiFetch<Record<string, any>>("/recruiter/dashboard") });
  if (isLoading) return <LoadingSkeleton rows={5} />;
  const cards = data?.cards ?? {};
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Recruiter portal" title="Hiring command center" description="Post jobs, discover SkillProof candidates, manage shortlists, and watch plan usage." actions={<Button asChild><Link href="/recruiter/jobs/create"><Plus className="mr-2 h-4 w-4" /> Post job</Link></Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Jobs" value={cards.activeJobs ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Applications" value={cards.totalApplications ?? 0} icon={Users} />
        <StatCard title="Shortlisted" value={cards.shortlistedCandidates ?? 0} icon={ListChecks} />
        <StatCard title="Interviews" value={cards.interviewsScheduled ?? 0} icon={Target} />
        <StatCard title="Candidate Views" value={cards.candidateViewsUsed ?? 0} icon={Eye} />
        <StatCard title="Job Posts Used" value={cards.jobPostsUsed ?? 0} icon={Sparkles} />
        <StatCard title="Current Plan" value={cards.currentPlan ?? "None"} icon={CreditCard} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow"><CardHeader><CardTitle>Usage limits</CardTitle></CardHeader><CardContent><UsageMeters usage={data?.usage} /></CardContent></Card>
        <Card className="soft-shadow"><CardHeader><CardTitle>Recommended candidates</CardTitle></CardHeader><CardContent className="grid gap-3">{(data?.recommendedCandidates ?? []).map((candidate: CandidateSummary) => <CandidateRow key={candidate.id} candidate={candidate} />)}</CardContent></Card>
      </div>
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: CandidateSummary }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{candidate.name}</p>
          <p className="text-sm text-muted-foreground">{candidate.collegeName} - {candidate.branch} - {candidate.location}</p>
        </div>
        <Badge>{candidate.skillProofScore}/100</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{candidate.skills.slice(0, 5).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" asChild><Link href={`/recruiter/candidates/${candidate.id}`}>View profile</Link></Button>
      </div>
    </div>
  );
}

export function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["company-profile"], queryFn: () => apiFetch<Record<string, any>>("/company/profile") });
  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch("/company/profile", { method: "PUT", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      toast({ title: "Company profile updated" });
    }
  });
  const data = profile.data;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Company profile" title="Recruiter company profile" description="This profile is visible on recruiter job pages and candidate invitations." />
      {profile.isLoading ? <LoadingSkeleton rows={5} /> : (
        <Card className="soft-shadow">
          <CardContent className="pt-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
              event.preventDefault();
              update.mutate(Object.fromEntries(new FormData(event.currentTarget)));
            }}>
              <Field label="Company name" name="name" defaultValue={data?.name} />
              <Field label="Website" name="website" defaultValue={data?.website} />
              <Field label="Industry" name="industry" defaultValue={data?.industry} />
              <Field label="Company size" name="size" defaultValue={data?.size} />
              <Field label="Headquarters" name="location" defaultValue={data?.location} />
              <Field label="Contact email" name="contactEmail" defaultValue={String(data?.metadataJson?.contactEmail ?? "")} />
              <div className="md:col-span-2"><Label>Description</Label><Textarea className="mt-2" name="description" defaultValue={data?.description ?? ""} /></div>
              <Button className="md:col-span-2 w-fit" disabled={update.isPending}>Save company profile</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function RecruiterJobsPage() {
  const jobs = useQuery({ queryKey: ["recruiter-jobs"], queryFn: () => apiFetch<Paginated<RecruiterJob>>("/recruiter/jobs") });
  if (jobs.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Jobs" title="Recruiter job posts" description="Create and manage external recruiter jobs." actions={<Button asChild><Link href="/recruiter/jobs/create"><Plus className="mr-2 h-4 w-4" /> Create job</Link></Button>} />
      <div className="grid gap-4">
        {(jobs.data?.items ?? []).map((job) => <JobCard key={job.id} job={job} href={`/recruiter/jobs/${job.id}`} />)}
      </div>
    </div>
  );
}

function JobCard({ job, href }: { job: RecruiterJob; href: string }) {
  return (
    <Card className="soft-shadow">
      <CardContent className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_auto] md:items-center">
        <div>
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm text-muted-foreground">{job.location} - {job.workMode} - closes {formatDate(job.deadline)}</p>
          <div className="mt-2 flex flex-wrap gap-2">{list(job.requiredSkillsJson).slice(0, 5).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div>
        </div>
        <div className="grid gap-1 text-sm">
          <span>{job.openings} openings</span>
          <StatusBadge status={job.status} label={toTitle(job.status)} />
        </div>
        <Button variant="outline" asChild><Link href={href}>Open</Link></Button>
      </CardContent>
    </Card>
  );
}

export function RecruiterJobCreatePage() {
  const [visibility, setVisibility] = React.useState("public");
  const [status, setStatus] = React.useState("open");
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiFetch<RecruiterJob>("/recruiter/jobs", { method: "POST", body }),
    onSuccess: (job) => {
      toast({ title: "Job created", description: job.title });
      window.location.href = `/recruiter/jobs/${job.id}`;
    },
    onError: (error) => toast({ title: "Could not create job", description: error instanceof Error ? error.message : "Upgrade may be required.", variant: "destructive" })
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Job posting" title="Create recruiter job" description="Plan limits are checked on the backend before a job is created." />
      <Card className="soft-shadow">
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            create.mutate(Object.fromEntries(new FormData(event.currentTarget)));
          }}>
            <Field label="Job title" name="title" placeholder="Backend Developer Intern" />
            <Field label="Role category" name="roleCategory" placeholder="Backend" />
            <Field label="Job type" name="jobType" placeholder="Internship / Full-time" />
            <Field label="Work mode" name="workMode" placeholder="Remote / On-site / Hybrid" />
            <Field label="Location" name="location" placeholder="Bengaluru" />
            <Field label="CTC" name="ctc" type="number" />
            <Field label="Stipend" name="stipend" type="number" />
            <Field label="Minimum CGPA" name="minimumCgpa" type="number" />
            <Field label="Max backlogs" name="maxBacklogs" type="number" />
            <Field label="Openings" name="openings" type="number" defaultValue={1} />
            <Field label="Deadline" name="deadline" type="date" />
            <Field label="Required skills" name="requiredSkills" placeholder="Java, SQL, React" />
            <Field label="Preferred skills" name="preferredSkills" placeholder="AWS, Docker" />
            <Field label="Allowed branches" name="allowedBranches" placeholder="CSE, IT" />
            <Field label="Hiring rounds" name="hiringRounds" placeholder="OA, Technical, HR" />
            <input type="hidden" name="visibility" value={visibility} />
            <input type="hidden" name="status" value={status} />
            <div className="grid gap-2"><Label>Visibility</Label><Select value={visibility} onValueChange={setVisibility}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="specific_colleges">Specific colleges</SelectItem><SelectItem value="private">Private invite only</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="paused">Paused</SelectItem></SelectContent></Select></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea className="mt-2" name="description" rows={6} /></div>
            <Button className="md:col-span-2 w-fit" disabled={create.isPending}>Create job</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function RecruiterJobDetailPage({ id }: { id: string }) {
  const job = useQuery({ queryKey: ["recruiter-job", id], queryFn: () => apiFetch<RecruiterJob & { applicationsCount?: number }>(`/recruiter/jobs/${id}`) });
  const apps = useQuery({ queryKey: ["recruiter-job-applications", id], queryFn: () => apiFetch<Items<Record<string, any>>>(`/recruiter/jobs/${id}/applications`) });
  if (job.isLoading) return <LoadingSkeleton rows={5} />;
  const data = job.data;
  if (!data) return <EmptyState title="Job not found" message="This job may have been removed." />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Recruiter job" title={data.title} description={data.description} badge={toTitle(data.status)} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Applications" value={data.applicationsCount ?? 0} icon={Users} />
        <StatCard title="Openings" value={data.openings} icon={BriefcaseBusiness} />
        <StatCard title="Minimum CGPA" value={data.minimumCgpa} icon={ShieldCheck} />
        <StatCard title="Deadline" value={formatDate(data.deadline)} icon={Target} />
      </div>
      <Card className="soft-shadow"><CardHeader><CardTitle>Applications</CardTitle></CardHeader><CardContent className="grid gap-3">{(apps.data?.items ?? []).map((app) => <ApplicationRow key={String(app.id)} item={app} />)}</CardContent></Card>
    </div>
  );
}

function ApplicationRow({ item }: { item: Record<string, any> }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/25 p-4 text-sm">
      <div>
        <p className="font-medium">{item.student?.user?.name ?? item.student?.user?.email ?? "Candidate"}</p>
        <p className="text-muted-foreground">Match {item.matchScore ?? 0}%</p>
      </div>
      <StatusBadge status={String(item.status)} label={toTitle(String(item.status))} />
    </div>
  );
}

export function CandidateSearchPage() {
  const [skills, setSkills] = React.useState("");
  const candidates = useQuery({ queryKey: ["recruiter-candidates", skills], queryFn: () => apiFetch<Paginated<CandidateSummary>>(`/recruiter/candidates?limit=20${skills ? `&skills=${encodeURIComponent(skills)}` : ""}`) });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Candidate discovery" title="Search verified student talent" description="Only students who opted into recruiter visibility appear here." />
      <Card className="soft-shadow"><CardContent className="grid gap-3 pt-5 md:grid-cols-[1fr_auto]"><Input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Filter skills: Java, SQL, React" /><Button><Search className="mr-2 h-4 w-4" /> Search</Button></CardContent></Card>
      {candidates.isLoading ? <LoadingSkeleton rows={5} /> : <div className="grid gap-4 md:grid-cols-2">{(candidates.data?.items ?? []).map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} />)}</div>}
    </div>
  );
}

export function CandidateProfilePage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const candidate = useQuery({ queryKey: ["candidate", id], queryFn: () => apiFetch<Record<string, any>>(`/recruiter/candidates/${id}`) });
  const view = useMutation({ mutationFn: () => apiFetch(`/recruiter/candidates/${id}/view`, { method: "POST", body: {} }) });
  const shortlist = useMutation({ mutationFn: () => apiFetch(`/recruiter/candidates/${id}/shortlist`, { method: "POST", body: { status: "shortlisted" } }), onSuccess: () => toast({ title: "Candidate shortlisted" }) });
  const contact = useMutation({ mutationFn: () => apiFetch(`/recruiter/candidates/${id}/contact-request`, { method: "POST", body: { message: "We would like to discuss an opportunity." } }), onSuccess: () => toast({ title: "Contact request sent" }) });
  React.useEffect(() => { if (candidate.data) view.mutate(); }, [candidate.data?.id]);
  if (candidate.isLoading) return <LoadingSkeleton rows={5} />;
  const data = candidate.data;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Candidate profile" title={data?.name ?? "Candidate"} description={`${data?.collegeName ?? ""} ${data?.branch ?? ""}`} actions={<><Button variant="outline" onClick={() => contact.mutate()}>Contact request</Button><Button onClick={() => shortlist.mutate()}>Shortlist</Button></>} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="SkillProof" value={data?.skillProofScore ?? 0} icon={Sparkles} />
        <StatCard title="Resume" value={data?.resumeScore ?? 0} icon={FileText} />
        <StatCard title="GitHub" value={data?.githubScore ?? 0} icon={ShieldCheck} />
        <StatCard title="LeetCode" value={data?.leetcodeScore ?? 0} icon={Target} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="soft-shadow"><CardHeader><CardTitle>Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{list(data?.skills).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</CardContent></Card>
        <Card className="soft-shadow"><CardHeader><CardTitle>Contact access</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{data?.showContact ? `Email: ${data?.email ?? "Hidden"}` : "Contact details are hidden until the student accepts your request."}</p></CardContent></Card>
      </div>
    </div>
  );
}

export function RecruiterShortlistsPage() {
  const query = useQuery({ queryKey: ["shortlists"], queryFn: () => apiFetch<Items<Record<string, any>>>("/recruiter/shortlists") });
  return <SimpleItemsPage title="Shortlisting pipeline" eyebrow="Pipeline" description="Saved, invited, shortlisted, assessment, interview, offered, hired, and rejected candidates." loading={query.isLoading} items={query.data?.items ?? []} />;
}

export function RecruiterApplicationsPage() {
  const query = useQuery({ queryKey: ["recruiter-applications"], queryFn: () => apiFetch<Items<Record<string, any>>>("/recruiter/applications") });
  return <SimpleItemsPage title="Recruiter applications" eyebrow="Applications" description="Student applications across your recruiter jobs." loading={query.isLoading} items={query.data?.items ?? []} />;
}

function SimpleItemsPage({ title, eyebrow, description, loading, items }: { title: string; eyebrow: string; description: string; loading: boolean; items: Record<string, any>[] }) {
  if (loading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-3">{items.length ? items.map((item) => <ApplicationRow key={String(item.id)} item={item} />) : <EmptyState title="Nothing here yet" message="Activity will appear as recruiters and students use the workflow." />}</div>
    </div>
  );
}

export function RecruiterInterviewsPage() {
  return <RecruiterShortlistsPage />;
}

export function RecruiterTeamPage() {
  const queryClient = useQueryClient();
  const [role, setRole] = React.useState("RECRUITER");
  const team = useQuery({ queryKey: ["company-team"], queryFn: () => apiFetch<Record<string, any>>("/company/team") });
  const invite = useMutation({ mutationFn: (body: Record<string, unknown>) => apiFetch("/company/team/invite", { method: "POST", body }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["company-team"] }); toast({ title: "Invitation created" }); } });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Team" title="Company team" description="Company admins can invite recruiters and manage hiring team access." />
      <Card className="soft-shadow"><CardContent className="pt-5"><form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={(event) => { event.preventDefault(); invite.mutate(Object.fromEntries(new FormData(event.currentTarget))); }}><Input name="email" placeholder="recruiter@company.com" /><input type="hidden" name="role" value={role} /><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RECRUITER">Recruiter</SelectItem><SelectItem value="COMPANY_ADMIN">Company Admin</SelectItem></SelectContent></Select><Button>Invite</Button></form></CardContent></Card>
      {team.isLoading ? <LoadingSkeleton rows={4} /> : <div className="grid gap-3">{(team.data?.members ?? []).map((member: Record<string, any>) => <div key={String(member.id)} className="flex items-center justify-between rounded-xl border bg-muted/25 p-4 text-sm"><span>{member.user?.name ?? member.userId}</span><StatusBadge status={member.role} label={toTitle(member.role)} /></div>)}</div>}
    </div>
  );
}

export function RecruiterBillingPage() {
  return <BillingDashboard title="Recruiter billing" />;
}

export function RecruiterSettingsPage() {
  return <CompanyProfilePage />;
}

export function StudentRecruiterJobsPage() {
  const jobs = useQuery({ queryKey: ["student-recruiter-jobs"], queryFn: () => apiFetch<Paginated<RecruiterJob>>("/student/recruiter-jobs") });
  if (jobs.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Recruiter jobs" title="External recruiter jobs" description="Apply to public jobs from verified recruiter companies." />
      <div className="grid gap-4">{(jobs.data?.items ?? []).map((job) => <JobCard key={job.id} job={job} href={`/student/recruiter-jobs/${job.id}`} />)}</div>
    </div>
  );
}

export function StudentRecruiterJobDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const job = useQuery({ queryKey: ["student-recruiter-job", id], queryFn: () => apiFetch<RecruiterJob & { applied?: boolean }>(`/student/recruiter-jobs/${id}`) });
  const apply = useMutation({ mutationFn: () => apiFetch(`/student/recruiter-jobs/${id}/apply`, { method: "POST" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["student-recruiter-job", id] }); toast({ title: "Application submitted" }); } });
  if (job.isLoading) return <LoadingSkeleton rows={5} />;
  const data = job.data;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Recruiter job" title={data?.title ?? "Job"} description={data?.description ?? ""} actions={<Button disabled={apply.isPending || data?.applied} onClick={() => apply.mutate()}>{data?.applied ? "Applied" : "Apply now"}</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Company" value={data?.organization?.name ?? "Recruiter"} icon={Building2} />
        <StatCard title="Location" value={data?.location ?? "-"} icon={Target} />
        <StatCard title="Deadline" value={data?.deadline ? formatDate(data.deadline) : "-"} icon={ListChecks} />
      </div>
      <Card className="soft-shadow"><CardHeader><CardTitle>Required skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{list(data?.requiredSkillsJson).map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</CardContent></Card>
    </div>
  );
}

export function StudentInvitesPage() {
  const query = useQuery({ queryKey: ["student-invites"], queryFn: () => apiFetch<Items<Record<string, any>>>("/student/recruiter-invites") });
  return <ContactRequestsList title="Recruiter invites" query={query} />;
}

export function StudentContactRequestsPage() {
  const query = useQuery({ queryKey: ["student-contact-requests"], queryFn: () => apiFetch<Items<Record<string, any>>>("/student/contact-requests") });
  return <ContactRequestsList title="Contact requests" query={query} />;
}

function ContactRequestsList({ title, query }: { title: string; query: ReturnType<typeof useQuery<Items<Record<string, any>>>> }) {
  const queryClient = useQueryClient();
  const respond = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/student/contact-requests/${id}/respond`, { method: "PUT", body: { status } }), onSuccess: () => queryClient.invalidateQueries() });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Student privacy" title={title} description="Accept or reject recruiter contact access." />
      <div className="grid gap-3">{(query.data?.items ?? []).map((item) => <div key={String(item.id)} className="rounded-xl border bg-muted/25 p-4"><div className="flex items-center justify-between"><div><p className="font-medium">{item.organization?.name ?? "Recruiter"}</p><p className="text-sm text-muted-foreground">{item.message}</p></div><StatusBadge status={String(item.status)} label={toTitle(String(item.status))} /></div><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => respond.mutate({ id: String(item.id), status: "accepted" })}>Accept</Button><Button size="sm" variant="outline" onClick={() => respond.mutate({ id: String(item.id), status: "rejected" })}>Reject</Button></div></div>)}</div>
    </div>
  );
}

export function ProfileVisibilityPage() {
  const queryClient = useQueryClient();
  const [visibilityValue, setVisibilityValue] = React.useState("private");
  const visibility = useQuery({ queryKey: ["student-visibility"], queryFn: () => apiFetch<Record<string, any>>("/student/visibility") });
  const update = useMutation({ mutationFn: (body: Record<string, unknown>) => apiFetch("/student/visibility", { method: "PUT", body }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["student-visibility"] }); toast({ title: "Visibility updated" }); } });
  const data = visibility.data;
  React.useEffect(() => {
    if (data?.visibility) setVisibilityValue(String(data.visibility));
  }, [data?.visibility]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Profile visibility" title="Recruiter privacy controls" description="Default is private. Enable recruiter visibility only with consent." />
      {visibility.isLoading ? <LoadingSkeleton rows={5} /> : (
        <Card className="soft-shadow"><CardContent className="pt-6"><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); update.mutate({ visibility: form.get("visibility"), allowRecruiterContact: form.get("allowRecruiterContact") === "on", showEmail: form.get("showEmail") === "on", showPhone: form.get("showPhone") === "on", showResume: form.get("showResume") === "on", availabilityStatus: form.get("availabilityStatus") }); }}><div className="rounded-xl border bg-muted/25 p-4 text-sm">I consent to PlaceMate AI showing my selected profile fields to verified recruiters according to the visibility option below.</div><input type="hidden" name="visibility" value={visibilityValue} /><Select value={visibilityValue} onValueChange={setVisibilityValue}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="private">Private</SelectItem><SelectItem value="college_only">Visible to college only</SelectItem><SelectItem value="verified_recruiters">Visible to verified recruiters</SelectItem><SelectItem value="public">Public talent profile</SelectItem></SelectContent></Select><Input name="availabilityStatus" defaultValue={data?.availabilityStatus ?? "available"} /><label className="text-sm"><input type="checkbox" name="allowRecruiterContact" defaultChecked={Boolean(data?.allowRecruiterContact)} className="mr-2" />Allow recruiter contact requests</label><label className="text-sm"><input type="checkbox" name="showEmail" defaultChecked={Boolean(data?.showEmail)} className="mr-2" />Show email after accepted request</label><label className="text-sm"><input type="checkbox" name="showPhone" defaultChecked={Boolean(data?.showPhone)} className="mr-2" />Show phone after accepted request</label><label className="text-sm"><input type="checkbox" name="showResume" defaultChecked={Boolean(data?.showResume)} className="mr-2" />Allow resume preview</label><Button className="w-fit">Save visibility</Button></form></CardContent></Card>
      )}
    </div>
  );
}

export function CollegeOnboardingPage() {
  const submit = useMutation({ mutationFn: (body: Record<string, unknown>) => apiFetch("/college/onboarding", { method: "POST", body }), onSuccess: () => toast({ title: "College onboarded" }) });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-16">
        <PageHeader eyebrow="College onboarding" title="Set up a college tenant" description="Create a college organization, assign admin ownership, and start a trial plan." />
        <Card className="soft-shadow max-w-5xl"><CardContent className="grid gap-4 pt-6 md:grid-cols-2"><form className="contents" onSubmit={(event) => { event.preventDefault(); submit.mutate(Object.fromEntries(new FormData(event.currentTarget))); }}><Field label="College name" name="collegeName" /><Field label="Official email" name="officialEmail" /><Field label="Website" name="website" /><Field label="City" name="city" /><Field label="State" name="state" /><Field label="Departments" name="departments" placeholder="CSE, IT, ECE" /><Field label="Approx student count" name="approxStudentCount" type="number" /><Field label="TPO contact name" name="tpoContactName" /><Field label="TPO contact email" name="tpoContactEmail" /><Field label="Phone" name="phone" /><Field label="Plan code" name="planSelected" defaultValue="college-pro" /><Button className="md:col-span-2 w-fit">Create college</Button></form></CardContent></Card>
      </main>
    </div>
  );
}

export function CollegeSettingsPage() {
  const query = useQuery({ queryKey: ["college-settings"], queryFn: () => apiFetch<Organization>("/college/settings") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return <div className="grid gap-6"><PageHeader eyebrow="College admin" title={query.data?.name ?? "College settings"} description="Manage tenant profile, subscription, and placement office setup." /><Card className="soft-shadow"><CardContent className="grid gap-3 pt-5"><p>Status: <StatusBadge status={query.data?.status ?? "active"} /></p><p className="text-sm text-muted-foreground">{query.data?.website}</p></CardContent></Card></div>;
}

export function CollegeTeamPage() {
  const query = useQuery({ queryKey: ["college-team"], queryFn: () => apiFetch<Record<string, any>>("/college/team") });
  return <SimpleItemsPage title="College team" eyebrow="College admin" description="Invite and manage TPO admins." loading={query.isLoading} items={query.data?.members ?? []} />;
}

export function CollegeBillingPage() {
  return <BillingDashboard title="College billing" />;
}

export function CollegeSubscriptionPage() {
  return <BillingDashboard title="College subscription" />;
}

export function AdminSaasDashboardPage() {
  const query = useQuery({ queryKey: ["admin-saas-dashboard"], queryFn: () => apiFetch<Record<string, any>>("/admin/saas-dashboard") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  const cards = query.data?.cards ?? {};
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="SaaS admin" title="Revenue and subscription dashboard" description="Commercial operating metrics across colleges, companies, recruiters, and payments." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Revenue" value={rupees(cards.totalRevenue ?? 0)} icon={IndianRupee} />
        <StatCard title="MRR Placeholder" value={rupees(cards.monthlyRecurringRevenue ?? 0)} icon={BarChart3} />
        <StatCard title="Active Subs" value={cards.activeSubscriptions ?? 0} icon={CreditCard} />
        <StatCard title="Trials" value={cards.trialUsers ?? 0} icon={Sparkles} />
        <StatCard title="Colleges" value={cards.totalColleges ?? 0} icon={Building2} />
        <StatCard title="Companies" value={cards.totalCompanies ?? 0} icon={BriefcaseBusiness} />
        <StatCard title="Recruiters" value={cards.totalRecruiters ?? 0} icon={Users} />
        <StatCard title="Failed Payments" value={cards.failedPayments ?? 0} icon={CreditCard} />
      </div>
    </div>
  );
}

export function AdminOrganizationsPage() {
  const query = useQuery({ queryKey: ["admin-organizations"], queryFn: () => apiFetch<Items<Organization>>("/admin/organizations") });
  return <SimpleItemsPage title="Organizations" eyebrow="Super admin" description="Colleges and companies on the platform." loading={query.isLoading} items={query.data?.items ?? []} />;
}

export function AdminOrganizationPage({ id }: { id: string }) {
  const query = useQuery({ queryKey: ["admin-organization", id], queryFn: () => apiFetch<Record<string, any>>(`/admin/organizations/${id}`) });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return <div className="grid gap-6"><PageHeader eyebrow="Organization" title={query.data?.organization?.name ?? "Organization"} description="Subscription, members, payments, and account logs." /><SimpleItemsPage title="Members" eyebrow="Access" description="Organization members." loading={false} items={query.data?.members ?? []} /></div>;
}

export function AdminSubscriptionsPage() {
  const query = useQuery({ queryKey: ["admin-subscriptions"], queryFn: () => apiFetch<Items<Subscription & { plan?: Plan; organization?: Organization }>>("/admin/subscriptions") });
  return <SimpleItemsPage title="Subscriptions" eyebrow="Super admin" description="All SaaS subscriptions." loading={query.isLoading} items={query.data?.items ?? []} />;
}

export function AdminPaymentsPage() {
  const query = useQuery({ queryKey: ["admin-payments"], queryFn: () => apiFetch<Items<Record<string, any>>>("/admin/payments") });
  return <SimpleItemsPage title="Payments" eyebrow="Super admin" description="Razorpay payment history and statuses." loading={query.isLoading} items={query.data?.items ?? []} />;
}

export function AdminRevenuePage() {
  const query = useQuery({ queryKey: ["admin-revenue"], queryFn: () => apiFetch<Record<string, any>>("/admin/revenue") });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  return <div className="grid gap-6"><PageHeader eyebrow="Revenue" title={rupees(query.data?.totalRevenue ?? 0)} description="Revenue by month and recent payment records." /><SimpleItemsPage title="Recent payments" eyebrow="Payments" description="Latest paid transactions." loading={false} items={query.data?.recentPayments ?? []} /></div>;
}

export function AdminAccountLogsPage() {
  const query = useQuery({ queryKey: ["admin-account-logs"], queryFn: () => apiFetch<Items<Record<string, any>>>("/admin/account-logs") });
  return <SimpleItemsPage title="Account logs" eyebrow="Audit" description="Suspension, activation, and billing override actions." loading={query.isLoading} items={query.data?.items ?? []} />;
}
