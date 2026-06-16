import { AppShell } from "@/components/app-shell";

const collegeRoles = ["COLLEGE_ADMIN", "SUPER_ADMIN"] as const;

export default function CollegeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="COLLEGE_ADMIN" allowedRoles={[...collegeRoles]}>
      {children}
    </AppShell>
  );
}
