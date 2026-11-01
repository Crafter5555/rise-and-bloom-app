import { useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import { useIron, uid, today, counterValue, Counter } from "../store";
import { Screen, Panel, Bar, tap } from "../ui";
import { cn } from "@/lib/utils";

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values), r = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / r) * 28}`).join(" ");
  return <svg viewBox="0 0 100 32" className="w-full h-8 text-primary" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function CounterCard({ c }: { c: Counter }) {
  const { set } = useIron();
  const [val, setVal] = useState("");
  const v = counterValue(c);
  const log = (value: number) => { tap(); set((st) => ({ ...st, counters: st.counters.map((x) => x.id === c.id ? { ...x, logs: [...x.logs, { date: today(), value }] } : x) })); };
  const period = c.reset === "daily" ? "today" : c.reset === "weekly" ? "this week" : "all time";
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display font-bold">{c.name}</div>
          <div className="text-[11px] text-muted-foreground font-display">{c.mode === "metric" ? `latest${c.unit ? ` · ${c.unit}` : ""}` : period}</div>
        </div>
        <button onClick={() => set((st) => ({ ...st, counters: st.counters.filter((x) => x.id !== c.id) }))} className="p-1 -mr-1 text-muted-foreground" aria-label="Delete"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex items-end justify-between my-3">
        <span className="font-display text-5xl font-extrabold tabular leading-none">{v}</span>
        {c.target ? <span className="text-sm text-muted-foreground tabular">/ {c.target}{c.unit ? ` ${c.unit}` : ""}</span> : null}
      </div>
      {c.target && c.mode === "tap" ? <div className="mb-3"><Bar value={(v / c.target) * 100} /></div> : null}
      {c.mode === "metric" && <div className="mb-3"><Spark values={c.logs.slice(-20).map((l) => l.value)} /></div>}
      {c.mode === "tap" ? (
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button disabled={v <= 0} onClick={() => log(-1)} className="h-14 rounded-md bg-secondary flex items-center justify-center disabled:opacity-30" aria-label="Minus"><Minus className="w-6 h-6" /></button>
          <button onClick={() => log(1)} className="h-14 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="Plus"><Plus className="w-7 h-7" /></button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); const n = parseFloat(val.replace(",", ".")); if (isNaN(n)) return; log(n); setVal(""); }} className="flex gap-2">
          <input inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Log value" className="flex-1 bg-input rounded-md h-12 px-3 outline-none tabular" />
          <button className="h-12 px-4 rounded-md bg-primary text-primary-foreground font-display font-bold">Log</button>
        </form>
      )}
    </Panel>
  );
}

export default function Board() {
  const { s, set } = useIron();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", mode: "tap" as Counter["mode"], unit: "", target: "", reset: "never" as Counter["reset"] });
  const create = (e: React.FormEvent) => {
    e.preventDefault(); if (!f.name.trim()) return;
    set((st) => ({ ...st, counters: [...st.counters, { id: uid(), name: f.name.trim(), mode: f.mode, unit: f.unit || undefined, target: f.target ? Number(f.target) : undefined, reset: f.mode === "metric" ? "never" : f.reset, logs: [] }] }));
    setF({ name: "", mode: "tap", unit: "", target: "", reset: "never" }); setOpen(false);
  };
  const seg = (on: boolean) => cn("flex-1 h-10 rounded-sm font-display text-xs", on ? "bg-card text-foreground" : "text-muted-foreground");

  return (
    <Screen title="Board" sub="Counters & trackers"
      action={<button onClick={() => setOpen(!open)} className="h-11 w-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="New counter">{open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</button>}>
      {open && (
        <Panel className="p-4">
          <form onSubmit={create} className="space-y-3">
            <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="What do you track?" className="w-full bg-input rounded-md h-12 px-3 outline-none" />
            <div className="flex bg-muted rounded-md p-1">
              <button type="button" onClick={() => setF({ ...f, mode: "tap" })} className={seg(f.mode === "tap")}>Tap counter</button>
              <button type="button" onClick={() => setF({ ...f, mode: "metric" })} className={seg(f.mode === "metric")}>Metric</button>
            </div>
            {f.mode === "tap" && (
              <div className="flex bg-muted rounded-md p-1">
                {(["daily", "weekly", "never"] as const).map((r) => <button type="button" key={r} onClick={() => setF({ ...f, reset: r })} className={seg(f.reset === r)}>{r === "never" ? "All-time" : r}</button>)}
              </div>
            )}
            <div className="flex gap-2">
              <input inputMode="decimal" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} placeholder="Target (optional)" className="flex-1 bg-input rounded-md h-12 px-3 outline-none" />
              <input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="Unit" className="w-24 bg-input rounded-md h-12 px-3 outline-none" />
            </div>
            <button className="w-full h-12 rounded-md bg-primary text-primary-foreground font-display font-bold">Add to board</button>
          </form>
        </Panel>
      )}
      {s.counters.length === 0 && <p className="text-sm text-muted-foreground">Add your first counter.</p>}
      <div className="space-y-3">{s.counters.map((c) => <CounterCard key={c.id} c={c} />)}</div>
    </Screen>
  );
}
