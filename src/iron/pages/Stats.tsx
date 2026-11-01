import { useNavigate } from "react-router-dom";
import { Settings as Gear } from "lucide-react";
import { useIron, today, streak, counterValue } from "../store";
import { Screen, Section, Panel, Stat } from "../ui";
import { cn } from "@/lib/utils";

export default function Stats() {
  const { s } = useIron();
  const nav = useNavigate();
  const days = Array.from({ length: 28 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return today(d); });
  const ratio = (d: string) => s.routine.length ? (s.routineChecks[d]?.length ?? 0) / s.routine.length : 0;
  const fullDays = Object.keys(s.routineChecks).filter((d) => ratio(d) >= 1);
  const last7 = days.slice(-7);
  const consistency = Math.round((last7.reduce((a, d) => a + ratio(d), 0) / 7) * 100);
  const wk = s.workoutLogs.filter((l) => last7.includes(l.date));
  const missions = s.todos.filter((t) => t.kind === "mission" && t.done).length;
  const recharge = s.todos.filter((t) => t.kind === "recharge" && t.done).length;
  const challengeDays = s.challenges.reduce((a, c) => a + c.checks.length, 0);

  const badges = [
    { label: "First session", on: s.workoutLogs.length >= 1 },
    { label: "10 sessions", on: s.workoutLogs.length >= 10 },
    { label: "50 sessions", on: s.workoutLogs.length >= 50 },
    { label: "7-day protocol", on: streak(fullDays) >= 7 },
    { label: "25 missions", on: missions >= 25 },
    { label: "30 challenge days", on: challengeDays >= 30 },
  ];

  return (
    <Screen title="Stats" sub="Proof of work"
      action={<button onClick={() => nav("/settings")} className="h-11 w-11 rounded-md bg-secondary flex items-center justify-center text-muted-foreground" aria-label="Settings"><Gear className="w-5 h-5" /></button>}>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Protocol streak" value={`${streak(fullDays)}d`} />
        <Stat label="7-day consistency" value={`${consistency}%`} />
        <Stat label="Sessions this week" value={wk.length} />
        <Stat label="Volume this week" value={`${Math.round(wk.reduce((a, l) => a + l.volume, 0))}kg`} />
        <Stat label="Missions done" value={missions} />
        <Stat label="Recharge done" value={recharge} />
      </div>

      <Section label="Last 28 days">
        <Panel className="p-3">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const r = ratio(d); const trained = s.workoutLogs.some((l) => l.date === d);
              return <div key={d} title={d} className={cn("aspect-square rounded-[2px] relative", r >= 1 ? "bg-primary" : r >= 0.5 ? "bg-primary/50" : r > 0 ? "bg-primary/20" : "bg-muted")}>
                {trained && <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-foreground" />}
              </div>;
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Shade = routine completed · dot = training session</p>
        </Panel>
      </Section>

      <Section label="Board totals">
        <Panel className="divide-y divide-border">
          {s.counters.map((c) => (
            <div key={c.id} className="flex justify-between px-3 min-h-[44px] items-center text-sm">
              <span>{c.name}</span><span className="tabular font-display font-bold">{counterValue(c)}{c.unit ? ` ${c.unit}` : ""}</span>
            </div>
          ))}
          {s.counters.length === 0 && <p className="p-3 text-sm text-muted-foreground">No counters yet.</p>}
        </Panel>
      </Section>

      <Section label="Insignia">
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <Panel key={b.label} className={cn("p-3 text-center", !b.on && "opacity-40")}>
              <div className={cn("mx-auto w-9 h-9 rotate-45 border-2 mb-2", b.on ? "border-primary bg-primary/15" : "border-border")} />
              <div className="text-[11px] font-display leading-tight">{b.label}</div>
            </Panel>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
