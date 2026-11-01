import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useIron, uid, today, Todo } from "../store";
import { Screen, Section, Panel, Check, tap } from "../ui";
import { cn } from "@/lib/utils";

function dayIndex(start: string, d = today()) {
  return Math.floor((new Date(d + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime()) / 86400000);
}

export default function Actions() {
  const { s, set } = useIron();
  const [tab, setTab] = useState<"todo" | "challenges">("todo");
  const [kind, setKind] = useState<Todo["kind"]>("mission");
  const [title, setTitle] = useState("");
  const [cTitle, setCTitle] = useState(""); const [cDays, setCDays] = useState(30);

  const list = s.todos.filter((t) => t.kind === kind);
  const open = list.filter((t) => !t.done); const closed = list.filter((t) => t.done).slice(-5).reverse();
  const toggle = (id: string) => set((st) => ({ ...st, todos: st.todos.map((t) => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? today() : undefined } : t) }));
  const del = (id: string) => set((st) => ({ ...st, todos: st.todos.filter((t) => t.id !== id) }));

  return (
    <Screen title="Actions" sub="Missions, recharge & challenges">
      <div className="grid grid-cols-2 bg-muted rounded-md p-1">
        {(["todo", "challenges"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("h-10 rounded-sm font-display text-sm", tab === t ? "bg-card text-foreground" : "text-muted-foreground")}>{t === "todo" ? "Things to do" : "Challenges"}</button>
        ))}
      </div>

      {tab === "todo" ? (
        <>
          <div className="flex gap-2">
            {(["mission", "recharge"] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={cn("flex-1 h-11 rounded-md border font-display text-sm", kind === k ? "border-primary text-primary" : "border-border text-muted-foreground")}>
                {k === "mission" ? "Mission · productive" : "Recharge · fun"}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; set((st) => ({ ...st, todos: [...st.todos, { id: uid(), title: title.trim(), kind, done: false, createdAt: today() }] })); setTitle(""); }} className="flex gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "mission" ? "New mission" : "Something worth doing"} className="flex-1 bg-input rounded-md h-12 px-3 outline-none" />
            <button className="h-12 w-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="Add"><Plus className="w-5 h-5" /></button>
          </form>
          <Panel className="divide-y divide-border overflow-hidden">
            {open.length === 0 && <p className="p-4 text-sm text-muted-foreground">All clear.</p>}
            {open.map((t) => (
              <div key={t.id} className="flex items-center">
                <div className="flex-1"><Check on={false} onClick={() => toggle(t.id)} label={t.title} /></div>
                <button onClick={() => del(t.id)} className="p-3 text-muted-foreground" aria-label="Delete"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </Panel>
          {closed.length > 0 && (
            <Section label="Recently done">
              <Panel className="divide-y divide-border overflow-hidden">{closed.map((t) => <Check key={t.id} on onClick={() => toggle(t.id)} label={t.title} />)}</Panel>
            </Section>
          )}
        </>
      ) : (
        <>
          <form onSubmit={(e) => { e.preventDefault(); if (!cTitle.trim()) return; set((st) => ({ ...st, challenges: [...st.challenges, { id: uid(), title: cTitle.trim(), days: cDays, startDate: today(), checks: [] }] })); setCTitle(""); }} className="flex gap-2">
            <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="New challenge" className="flex-1 bg-input rounded-md h-12 px-3 outline-none" />
            <select value={cDays} onChange={(e) => setCDays(Number(e.target.value))} className="bg-input rounded-md h-12 px-2 outline-none">{[7, 14, 30, 75].map((d) => <option key={d} value={d}>{d}d</option>)}</select>
            <button className="h-12 w-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="Add"><Plus className="w-5 h-5" /></button>
          </form>
          {s.challenges.length === 0 && <p className="text-sm text-muted-foreground">No challenges. Start one.</p>}
          {s.challenges.map((c) => {
            const idx = dayIndex(c.startDate); const doneToday = c.checks.includes(today());
            return (
              <Panel key={c.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-display text-lg font-bold">{c.title}</div>
                    <div className="text-xs text-muted-foreground tabular">Day {Math.min(idx + 1, c.days)} of {c.days} · {c.checks.length} done</div>
                  </div>
                  <button onClick={() => set((st) => ({ ...st, challenges: st.challenges.filter((x) => x.id !== c.id) }))} className="p-1 text-muted-foreground" aria-label="Delete"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-10 gap-1 mb-3">
                  {Array.from({ length: c.days }).map((_, i) => {
                    const d = new Date(c.startDate + "T00:00:00"); d.setDate(d.getDate() + i);
                    const on = c.checks.includes(today(d));
                    return <div key={i} className={cn("aspect-square rounded-[2px]", on ? "bg-primary" : i < idx ? "bg-destructive/30" : i === idx ? "border border-primary" : "bg-muted")} />;
                  })}
                </div>
                {idx < c.days && (
                  <button onClick={() => { tap(); set((st) => ({ ...st, challenges: st.challenges.map((x) => x.id === c.id ? { ...x, checks: doneToday ? x.checks.filter((d) => d !== today()) : [...x.checks, today()] } : x) })); }}
                    className={cn("w-full h-12 rounded-md font-display font-bold", doneToday ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground")}>
                    {doneToday ? "Done today ✓" : "Mark today complete"}
                  </button>
                )}
              </Panel>
            );
          })}
        </>
      )}
    </Screen>
  );
}
