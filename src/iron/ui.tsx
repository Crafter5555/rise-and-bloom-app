import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const tap = () => { Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); };

export function Screen({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-28 max-w-md mx-auto">
      <header className="flex items-end justify-between mb-5">
        <div>
          {sub && <p className="text-xs text-muted-foreground font-display">{sub}</p>}
          <h1 className="text-3xl font-display font-extrabold text-foreground leading-none mt-1">{title}</h1>
        </div>
        {action}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Section({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-display font-bold text-muted-foreground">{label}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Panel({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-card border border-border rounded-md", className)} {...p}>{children}</div>;
}

export function Check({ on, onClick, label, meta }: { on: boolean; onClick: () => void; label: string; meta?: ReactNode }) {
  return (
    <button onClick={() => { tap(); onClick(); }}
      className="w-full flex items-center gap-3 px-3 min-h-[52px] text-left active:bg-muted transition-colors">
      <span className={cn("w-6 h-6 shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors",
        on ? "bg-primary border-primary" : "border-border")}>
        {on && <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12l5 5L20 7" /></svg>}
      </span>
      <span className={cn("flex-1 font-medium", on ? "text-muted-foreground line-through" : "text-foreground")}>{label}</span>
      {meta}
    </button>
  );
}

export function Bar({ value }: { value: number }) {
  return <div className="h-1.5 bg-muted rounded-sm overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Panel className="p-3">
      <div className="text-2xl font-display font-extrabold text-foreground tabular">{value}</div>
      <div className="text-[11px] font-display text-muted-foreground mt-0.5">{label}</div>
    </Panel>
  );
}
