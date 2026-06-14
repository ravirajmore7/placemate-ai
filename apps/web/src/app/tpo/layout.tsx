import { AppShell } from "@/components/app-shell";

export default function TpoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="TPO_ADMIN">{children}</AppShell>;
}
