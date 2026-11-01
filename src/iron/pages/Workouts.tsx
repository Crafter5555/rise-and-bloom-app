import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, Plus, X, ChevronLeft, Trash2 } from "lucide-react";
import { useIron, uid, today, Workout } from "../store";
import { Screen, Section, Panel, Check, tap } from "../ui";

const GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Conditioning"];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Runner({ w, onClose }: { w: Workout; onClose: () => void }) {
  const { s, set } = useIron();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [start] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState(0);
  useEffect(() => { const t = setInterval(() => { setNow(Date.now()); setRest((r) => Math.max(0, r - 1)); }, 1000); return () => clearInterval(t); }, []);
  const name = (id: string) => s.exercises.find((e) => e.id === id)?.name ?? "Exercise";
  const total = w.items.reduce((a, i) => a + i.sets, 0);

  const finish = () => {
    let volume = 0;
    w.items.forEach((it, i) => { for (let k = 0; k < it.sets; k++) if (done.has(`${i}-${k}`)) volume += it.reps * (it.weight ?? 0); });
    set((st) => ({ ...st, workoutLogs: [...st.workoutLogs, { id: uid(), workoutId: w.id, name: w.name, date: today(), durationSec: Math.round((now - start) / 1000), setsDone: done.size, volume }] }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-36">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground" aria-label="Close"><X className="w-6 h-6" /></button>
          <span className="font-display text-2xl font-extrabold tabular">{fmt(Math.round((now - start) / 1000))}</span>
          <span className="font-display text-sm text-muted-foreground tabular">{done.size}/{total}</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold mb-5">{w.name}</h1>
        <div className="space-y-4">
          {w.items.map((it, i) => (
            <Section key={i} label={name(it.exerciseId)}>
              <Panel className="divide-y divide-border overflow-hidden">
                {Array.from({ length: it.sets }).map((_, k) => {
                  const key = `${i}-${k}`;
                  return <Check key={k} on={done.has(key)} label={`Set ${k + 1} — ${it.reps} reps${it.weight ? ` @ ${it.weight}kg` : ""}`}
                    onClick={() => { const n = new Set(done); if (n.has(key)) n.delete(key); else { n.add(key); setRest(90); } setDone(n); }} />;
                })}
              </Panel>
            </Section>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 bg-card border-t border-border pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 px-4">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-display text-muted-foreground">Rest</div>
            <div className="font-display text-xl font-extrabold tabular">{fmt(rest)}</div>
          </div>
          <button onClick={() => { tap(); setRest((r) => r + 30); }} className="h-12 px-3 rounded-md bg-secondary font-display">+30</button>
          <button onClick={() => setRest(0)} className="h-12 px-3 rounded-md bg-secondary font-display">Skip</button>
          <button onClick={finish} className="h-12 px-4 rounded-md bg-primary text-primary-foreground font-display font-bold">Finish</button>
        </div>
      </div>
    </div>
  );
}

function Builder({ w, onClose }: { w: Workout; onClose: () => void }) {
  const { s, set } = useIron();
  const save = (fn: (w: Workout) => Workout) => set((st) => ({ ...st, workouts: st.workouts.map((x) => x.id === w.id ? fn(x) : x) }));
  const cur = s.workouts.find((x) => x.id === w.id) ?? w;
  const [pick, setPick] = useState("");
  const num = "w-14 bg-input rounded-sm h-10 text-center tabular outline-none";
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-md mx-auto px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-16 space-y-4">
        <button onClick={onClose} className="flex items-center gap-1 text-muted-foreground font-display text-sm min-h-[44px]"><ChevronLeft className="w-5 h-5" />Back</button>
        <input value={cur.name} onChange={(e) => save((x) => ({ ...x, name: e.target.value }))}
          className="w-full bg-transparent font-display text-3xl font-extrabold outline-none border-b border-border pb-2" />
        <Panel className="divide-y divide-border">
          {cur.items.map((it, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{s.exercises.find((e) => e.id === it.exerciseId)?.name}</span>
                <button onClick={() => save((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-display">
                {(["sets", "reps", "weight"] as const).map((f) => (
                  <label key={f} className="flex items-center gap-1">{f === "weight" ? "kg" : f}
                    <input inputMode="numeric" className={num} value={it[f] ?? ""} onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Number(e.target.value);
                      save((x) => ({ ...x, items: x.items.map((y, j) => j === i ? { ...y, [f]: f === "weight" ? v : Math.max(1, v ?? 1) } : y) }));
                    }} />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex p-2 gap-2">
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 bg-input rounded-sm h-11 px-2 outline-none">
              <option value="">Add exercise…</option>
              {GROUPS.map((g) => <optgroup key={g} label={g}>{s.exercises.filter((e) => e.group === g).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</optgroup>)}
            </select>
            <button disabled={!pick} onClick={() => { save((x) => ({ ...x, items: [...x.items, { exerciseId: pick, sets: 3, reps: 10 }] })); setPick(""); }}
              className="h-11 w-11 rounded-sm bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40"><Plus className="w-5 h-5" /></button>
          </div>
        </Panel>
        <button onClick={() => { set((st) => ({ ...st, workouts: st.workouts.filter((x) => x.id !== w.id) })); onClose(); }}
          className="flex items-center gap-2 text-destructive text-sm font-display min-h-[44px]"><Trash2 className="w-4 h-4" />Delete workout</button>
      </div>
    </div>
  );
}

export default function Workouts() {
  const { s, set } = useIron();
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState<Workout | null>(null);
  const [build, setBuild] = useState<Workout | null>(null);
  const [tab, setTab] = useState<"plans" | "exercises">("plans");
  const [exName, setExName] = useState(""); const [exGroup, setExGroup] = useState("Chest");

  useEffect(() => {
    const id = params.get("start"); if (!id) return;
    const w = s.workouts.find((x) => x.id === id); if (w) setRun(w);
    setParams({}, { replace: true });
  }, [params, s.workouts, setParams]);

  const recent = useMemo(() => [...s.workoutLogs].reverse().slice(0, 5), [s.workoutLogs]);
  const newWorkout = () => { const w = { id: uid(), name: "New workout", items: [] }; set((st) => ({ ...st, workouts: [...st.workouts, w] })); setBuild(w); };

  return (
    <Screen title="Training" sub="Workouts & exercises"
      action={tab === "plans" ? <button onClick={newWorkout} className="h-11 w-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="New workout"><Plus className="w-5 h-5" /></button> : undefined}>
      <div className="grid grid-cols-2 bg-muted rounded-md p-1">
        {(["plans", "exercises"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`h-10 rounded-sm font-display text-sm ${tab === t ? "bg-card text-foreground" : "text-muted-foreground"}`}>{t === "plans" ? "Workouts" : "Exercises"}</button>
        ))}
      </div>

      {tab === "plans" ? (
        <>
          <div className="space-y-2">
            {s.workouts.map((w) => (
              <Panel key={w.id} className="flex items-center">
                <button onClick={() => setBuild(w)} className="flex-1 text-left p-4">
                  <div className="font-display text-lg font-bold">{w.name}</div>
                  <div className="text-xs text-muted-foreground">{w.items.length} exercises · {w.items.reduce((a, i) => a + i.sets, 0)} sets</div>
                </button>
                <button disabled={!w.items.length} onClick={() => setRun(w)} className="m-3 h-12 w-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30" aria-label="Start"><Play className="w-5 h-5" /></button>
              </Panel>
            ))}
          </div>
          <Section label="Recent sessions">
            <Panel className="divide-y divide-border">
              {recent.length === 0 && <p className="p-4 text-sm text-muted-foreground">No sessions logged yet.</p>}
              {recent.map((l) => (
                <div key={l.id} className="flex justify-between p-3 text-sm">
                  <span>{l.name}<span className="text-muted-foreground"> · {l.date}</span></span>
                  <span className="tabular text-muted-foreground">{l.setsDone} sets · {fmt(l.durationSec)}</span>
                </div>
              ))}
            </Panel>
          </Section>
        </>
      ) : (
        <>
          <form onSubmit={(e) => { e.preventDefault(); if (!exName.trim()) return; set((st) => ({ ...st, exercises: [...st.exercises, { id: uid(), name: exName.trim(), group: exGroup }] })); setExName(""); }}
            className="flex gap-2">
            <input value={exName} onChange={(e) => setExName(e.target.value)} placeholder="New exercise" className="flex-1 bg-input rounded-md h-11 px-3 outline-none" />
            <select value={exGroup} onChange={(e) => setExGroup(e.target.value)} className="bg-input rounded-md h-11 px-2 outline-none">{GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
            <button className="h-11 w-11 rounded-md bg-primary text-primary-foreground flex items-center justify-center"><Plus className="w-5 h-5" /></button>
          </form>
          {GROUPS.map((g) => {
            const list = s.exercises.filter((e) => e.group === g); if (!list.length) return null;
            return (
              <Section key={g} label={g}>
                <Panel className="divide-y divide-border">
                  {list.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-3 min-h-[48px]">
                      <span>{e.name}</span>
                      <button onClick={() => set((st) => ({ ...st, exercises: st.exercises.filter((x) => x.id !== e.id) }))} className="p-2 text-muted-foreground" aria-label="Delete"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </Panel>
              </Section>
            );
          })}
        </>
      )}
      {run && <Runner w={run} onClose={() => setRun(null)} />}
      {build && <Builder w={build} onClose={() => setBuild(null)} />}
    </Screen>
  );
}
