"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "./Card";

export interface Task {
  id: string;
  label: string;
  done: boolean;
}

// Default (student) seed — real action items depend on booking/notification data
// that doesn't exist yet (no backend). Local-only state; not persisted. Other
// roles pass their own seed via the `tasks` prop (see dashboard/page.tsx).
const DEFAULT_TASKS: Task[] = [
  { id: "1", label: "Add a topic to Friday's meeting with Dr. Chen", done: false },
  { id: "2", label: "Confirm attendance for Prof. Reyes' slot", done: false },
  { id: "3", label: "Rate last week's session with Dr. Nair", done: true },
];

export function TaskList({ tasks: initialTasks = DEFAULT_TASKS }: { tasks?: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  function toggle(id: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <Card className="flex flex-col gap-1">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => toggle(task.id)}
          className="flex items-start gap-2.5 py-1.5 text-left"
        >
          {task.done ? (
            <CheckCircle2 className="w-[18px] h-[18px] mt-0.5 text-[var(--brand-500)] shrink-0" strokeWidth={2} />
          ) : (
            <Circle className="w-[18px] h-[18px] mt-0.5 text-[var(--ink-300)] shrink-0" strokeWidth={2} />
          )}
          <span
            className={`text-[13px] leading-snug ${task.done ? "text-[var(--ink-400)] line-through" : "text-[var(--ink-800)]"}`}
          >
            {task.label}
          </span>
        </button>
      ))}
    </Card>
  );
}
