import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Camera, History } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/escanear", label: "Escanear", icon: Camera, highlight: true },
  { to: "/historial", label: "Historial", icon: History },
] as const;

export function PhoneShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-accent/40 py-0 sm:py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background sm:min-h-[calc(100vh-4rem)] sm:rounded-4xl sm:shadow-[var(--shadow-soft)]">
        <main className="flex-1 px-5 pb-28 pt-8">{children}</main>

        <nav className="sticky bottom-0 z-10 rounded-t-3xl border-t border-border bg-background/95 px-3 py-2 backdrop-blur sm:rounded-b-4xl">
          <ul className="flex items-end justify-around">
            {items.map(({ to, label, icon: Icon, ...rest }) => {
              const active = pathname === to;
              const highlight = "highlight" in rest && rest.highlight;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      "flex w-20 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-full transition-colors",
                        highlight
                          ? "-mt-6 size-14 bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                          : "size-9",
                        !highlight && active && "bg-mint text-mint-foreground",
                      )}
                    >
                      <Icon className={highlight ? "size-7" : "size-5"} />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
