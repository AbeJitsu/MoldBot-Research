"use client";

import { useEffect, useState, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  status: "pending" | "needs_testing" | "completed";
  createdAt: string;
}

// ============================================
// TASK PANEL — Left sidebar (Pending)
// ============================================

export function LeftTaskPanel() {
  const { tasks, addTask, advanceTask, deleteTask } = useTasks();
  const [newTitle, setNewTitle] = useState("");

  const pending = tasks.filter((t) => t.status === "pending");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTask(newTitle.trim());
    setNewTitle("");
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700 w-[250px] flex-shrink-0">
      <div className="px-3 py-2 border-b border-gray-700">
        <h2 className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Pending</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {pending.map((task) => (
          <TaskItem key={task.id} task={task} onAdvance={advanceTask} onDelete={deleteTask} />
        ))}
        {pending.length === 0 && (
          <p className="text-xs text-gray-500 px-2 py-4 text-center">No pending tasks</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="p-2 border-t border-gray-700">
        <div className="flex gap-1">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add task..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="bg-emerald-600 text-white px-2 py-1.5 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            +
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================
// TASK PANEL — Right sidebar (Needs Testing + Completed)
// ============================================

export function RightTaskPanel() {
  const { tasks, advanceTask, deleteTask } = useTasks();

  const needsTesting = tasks.filter((t) => t.status === "needs_testing");
  const completed = tasks.filter((t) => t.status === "completed");
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-[250px] flex-shrink-0">
      {/* Needs Testing */}
      <div className="px-3 py-2 border-b border-gray-700">
        <h2 className="text-xs uppercase tracking-wide text-yellow-400 font-semibold">Needs Testing</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {needsTesting.map((task) => (
          <TaskItem key={task.id} task={task} onAdvance={advanceTask} onDelete={deleteTask} />
        ))}
        {needsTesting.length === 0 && (
          <p className="text-xs text-gray-500 px-2 py-4 text-center">Nothing to test</p>
        )}
      </div>

      {/* Completed */}
      <div className="border-t border-gray-700">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <h2 className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            Completed ({completed.length})
          </h2>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-gray-500 transition-transform ${showCompleted ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {showCompleted && (
          <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
            {completed.map((task) => (
              <TaskItem key={task.id} task={task} onAdvance={advanceTask} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TASK ITEM
// ============================================

function TaskItem({
  task,
  onAdvance,
  onDelete,
}: {
  task: Task;
  onAdvance: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusIcon = {
    pending: "text-gray-500",
    needs_testing: "text-yellow-400",
    completed: "text-emerald-400",
  };

  const statusSymbol = {
    pending: "\u25A1",       // empty square
    needs_testing: "\u25CF", // filled circle
    completed: "\u2713",     // checkmark
  };

  const advanceTitle = {
    pending: "Move to Needs Testing",
    needs_testing: "Mark Completed",
    completed: "Done",
  };

  return (
    <div className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
      <button
        onClick={() => onAdvance(task.id)}
        className={`mt-0.5 text-sm flex-shrink-0 ${statusIcon[task.status]} hover:text-emerald-400 transition-colors`}
        title={advanceTitle[task.status]}
      >
        {statusSymbol[task.status]}
      </button>
      <span
        className={`text-sm flex-1 ${
          task.status === "completed" ? "text-gray-500 line-through" : "text-gray-200"
        }`}
      >
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-xs"
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

// ============================================
// SHARED TASK HOOK
// ============================================

let globalTasks: Task[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

function useTasks() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.push(listener);

    // Load on first subscriber
    if (listeners.length === 1) {
      fetch("/api/tasks")
        .then((r) => r.json())
        .then((data) => {
          globalTasks = data;
          notify();
        })
        .catch(() => {});
    }

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const addTask = useCallback(async (title: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const task = await res.json();
      globalTasks = [...globalTasks, task];
      notify();
    } catch {}
  }, []);

  const advanceTask = useCallback(async (id: string) => {
    const task = globalTasks.find((t) => t.id === id);
    if (!task) return;

    const nextStatus: Record<string, string> = {
      pending: "needs_testing",
      needs_testing: "completed",
      completed: "completed",
    };
    const newStatus = nextStatus[task.status];
    if (newStatus === task.status) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      globalTasks = globalTasks.map((t) => (t.id === id ? updated : t));
      notify();
    } catch {}
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      globalTasks = globalTasks.filter((t) => t.id !== id);
      notify();
    } catch {}
  }, []);

  return { tasks: globalTasks, addTask, advanceTask, deleteTask };
}
