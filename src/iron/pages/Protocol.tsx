import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Dumbbell } from "lucide-react";
import { useIron, today, uid, Block } from "../store";
import { Screen, Section, Panel, Check, Bar } from "../ui";

const BLOCKS: { id: Block; label: string }[] = [
  { id: "morning", label: "Morning" }, { id: "midday", label: "Midday" }, { id: "evening", label: "Evening" },
];

export default function Protocol() {
  const { s, set } = useIron();
  const nav = useNavigate();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<Block, string>>({ morning: "", midday: "", evening: "" });
  const d = today();
  const checks = s.routineChecks[d] ?? [];
  const missions = s.todos.filter((t) => t.kind === "mission" && !t.done).slice(0, 3);
  const done = checks.length;
  const pct = s.routine.length ? Math.round((done / s.routine.length) * 100) : 0;

  const toggle = (id: string) => set((st) => {
    const cur = st.routineChecks[d] ?? [];
    return { ...st, routineChecks: { ...st.routineChecks, [d]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
  });
  const add = (b: Block) => {
    const t = draft[b].trim(); if (!t) return;
    set((st) => ({ ...st, routine: [...st.routine, { id: uid(), title: t, block: b }] }));
    setDraft({ ...draft, [b]: "" });
  };
  const remove = (id: string) => set((st) => ({ ...st, routine: st.routine.filter((r) => r.id !== id) }));
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

  return (
    <Screen title="Protocol" sub={date}
      action={<button onClick={() => setEdit(!edit)} className="text-xs font-display text-primary min-h-[44px] px-2">{edit ? "Done" : "Edit"}</button>}>
      <Panel className="p-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display text-sm text-muted-foreground">Routine executed</span>
          <span className="font-display text-2xl font-extrabold tabular">{done}/{s.routine.length}</span>
        </div>
        <Bar value={pct} />
      </Panel>

      {BLOCKS.map((b) => {
        const steps = s.routine.filter((r) => r.block === b.id);
        return (
          <Section key={b.id} label={b.label}>
            <Panel className="divide-y divide-border overflow-hidden">
              {steps.length === 0 && !edit && <p className="px-3 py-4 text-sm text-muted-foreground">Nothing set. Tap Edit to add.</p>}
              {steps.map((r) => {
                const w = r.workoutId && s.workouts.find((x) => x.id === r.workoutId);
                return (
                  <div key={r.id} className="flex items-center">
                    <div className="flex-1"><Check on={checks.includes(r.id)} onClick={() => toggle(r.id)} label={w ? `${r.title}: ${w.name}` : r.title}
                      meta={w && !edit ? <span onClick={(e) => { e.stopPropagation(); nav(`/workouts?start=${w.id}`); }} className="p-2 text-primary"><Dumbbell className="w-5 h-5" /></span> : undefined} /></div>
                    {edit && <button onClick={() => remove(r.id)} className="p-3 text-muted-foreground" aria-label="Remove"><X className="w-5 h-5" /></button>}
                  </div>
                );
              })}
              {edit && (
                <form onSubmit={(e) => { e.preventDefault(); add(b.id); }} className="flex items-center">
                  <input value={draft[b.id]} onChange={(e) => setDraft({ ...draft, [b.id]: e.target.value })} placeholder="Add step"
                    className="flex-1 bg-transparent px-3 min-h-[52px] outline-none placeholder:text-muted-foreground" />
                  <button className="p-3 text-primary" aria-label="Add"><Plus className="w-5 h-5" /></button>
                </form>
              )}
            </Panel>
          </Section>
        );
      })}

      <Section label="Top missions" right={<button onClick={() => nav("/actions")} className="text-xs font-display text-primary">All</button>}>
        <Panel className="divide-y divide-border overflow-hidden">
          {missions.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">No open missions.</p>}
          {missions.map((t) => (
            <Check key={t.id} on={false} label={t.title}
              onClick={() => set((st) => ({ ...st, todos: st.todos.map((x) => x.id === t.id ? { ...x, done: true, doneAt: today() } : x) }))} />
          ))}
        </Panel>
      </Section>
    </Screen>
  );
}
