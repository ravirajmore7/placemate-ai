import { AppShell } from "@/components/app-shell";

const recruiterRoles = ["RECRUITER", "COMPANY_ADMIN"] as const;

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="RECRUITER" allowedRoles={[...recruiterRoles]}>
      {children}
    </AppShell>
  );
}
