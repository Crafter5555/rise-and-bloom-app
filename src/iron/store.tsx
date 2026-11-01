import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Exercise = { id: string; name: string; group: string };
export type WorkoutItem = { exerciseId: string; sets: number; reps: number; weight?: number };
export type Workout = { id: string; name: string; items: WorkoutItem[] };
export type Block = "morning" | "midday" | "evening";
export type RoutineStep = { id: string; title: string; block: Block; workoutId?: string };
export type Todo = { id: string; title: string; kind: "mission" | "recharge"; done: boolean; doneAt?: string; createdAt: string };
export type Challenge = { id: string; title: string; days: number; startDate: string; checks: string[] };
export type Counter = {
  id: string; name: string; mode: "tap" | "metric"; unit?: string;
  target?: number; reset: "daily" | "weekly" | "never";
  logs: { date: string; value: number }[];
};
export type WorkoutLog = { id: string; workoutId: string; name: string; date: string; durationSec: number; setsDone: number; volume: number };

export type State = {
  exercises: Exercise[]; workouts: Workout[]; routine: RoutineStep[];
  routineChecks: Record<string, string[]>; // date -> step ids
  todos: Todo[]; challenges: Challenge[]; counters: Counter[]; workoutLogs: WorkoutLog[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

const ex = (name: string, group: string): Exercise => ({ id: uid(), name, group });
const seed = (): State => {
  const exercises = [
    ex("Bench Press", "Chest"), ex("Push-Up", "Chest"), ex("Pull-Up", "Back"), ex("Barbell Row", "Back"),
    ex("Back Squat", "Legs"), ex("Deadlift", "Legs"), ex("Overhead Press", "Shoulders"), ex("Dip", "Arms"),
    ex("Plank", "Core"), ex("Hanging Leg Raise", "Core"), ex("Ruck Walk", "Conditioning"), ex("Burpee", "Conditioning"),
  ];
  const by = (n: string) => exercises.find((e) => e.name === n)!.id;
  const workouts: Workout[] = [
    { id: uid(), name: "Heavy Compound", items: [
      { exerciseId: by("Back Squat"), sets: 5, reps: 5, weight: 80 },
      { exerciseId: by("Bench Press"), sets: 5, reps: 5, weight: 70 },
      { exerciseId: by("Barbell Row"), sets: 4, reps: 8, weight: 60 },
    ]},
    { id: uid(), name: "Bodyweight Grind", items: [
      { exerciseId: by("Pull-Up"), sets: 4, reps: 8 },
      { exerciseId: by("Push-Up"), sets: 4, reps: 20 },
      { exerciseId: by("Dip"), sets: 3, reps: 12 },
      { exerciseId: by("Hanging Leg Raise"), sets: 3, reps: 12 },
    ]},
  ];
  return {
    exercises, workouts,
    routine: [
      { id: uid(), title: "Wake 06:00 — no phone", block: "morning" },
      { id: uid(), title: "Cold shower", block: "morning" },
      { id: uid(), title: "Train", block: "midday", workoutId: workouts[0].id },
      { id: uid(), title: "Deep work 90 min", block: "midday" },
      { id: uid(), title: "Read 20 pages", block: "evening" },
      { id: uid(), title: "Plan tomorrow", block: "evening" },
    ],
    routineChecks: {},
    todos: [
      { id: uid(), title: "Review finances", kind: "mission", done: false, createdAt: today() },
      { id: uid(), title: "Trail hike", kind: "recharge", done: false, createdAt: today() },
    ],
    challenges: [{ id: uid(), title: "100 push-ups daily", days: 30, startDate: today(), checks: [] }],
    counters: [
      { id: uid(), name: "Cold showers", mode: "tap", reset: "never", target: 30, logs: [] },
      { id: uid(), name: "Water (glasses)", mode: "tap", reset: "daily", target: 8, logs: [] },
      { id: uid(), name: "Bodyweight", mode: "metric", unit: "kg", reset: "never", logs: [] },
    ],
    workoutLogs: [],
  };
};

const KEY = "iron.v1";
type Ctx = { s: State; set: (fn: (s: State) => State) => void; reset: () => void };
const C = createContext<Ctx | null>(null);

export function IronProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
    return seed();
  });
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  const set = useCallback((fn: (s: State) => State) => setS((p) => fn(p)), []);
  const reset = useCallback(() => setS(seed()), []);
  return <C.Provider value={{ s, set, reset }}>{children}</C.Provider>;
}
export const useIron = () => { const c = useContext(C); if (!c) throw new Error("no IronProvider"); return c; };

// ---- pure helpers (tested) ----
export function weekStart(date: string) {
  const d = new Date(date + "T00:00:00"); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return today(d);
}
/** Tap counter value for the current period. */
export function counterValue(c: Counter, now = today()) {
  const logs = c.logs.filter((l) =>
    c.reset === "daily" ? l.date === now : c.reset === "weekly" ? weekStart(l.date) === weekStart(now) : true);
  if (c.mode === "metric") return c.logs.length ? c.logs[c.logs.length - 1].value : 0;
  return logs.reduce((a, l) => a + l.value, 0);
}
/** Consecutive days ending today (or yesterday) found in a set of dates. */
export function streak(dates: string[], now = today()) {
  const set = new Set(dates); let n = 0; const d = new Date(now + "T00:00:00");
  if (!set.has(today(d))) d.setDate(d.getDate() - 1);
  while (set.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
