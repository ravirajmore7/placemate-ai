import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block">PlaceMate AI</span>
            <span className="hidden text-xs font-normal text-muted-foreground sm:block">SkillProof placement OS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button className="hidden sm:inline-flex" asChild>
            <Link href="/register">Get started</Link>
          </Button>
          <Button size="sm" className="sm:hidden" asChild>
            <Link href="/login">Demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
