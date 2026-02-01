import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TASKS_FILE = path.join(process.cwd(), "..", "tasks.json");

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
}

function readTasks(): Task[] {
  try {
    const data = fs.readFileSync(TASKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export async function GET() {
  return NextResponse.json(readTasks());
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const tasks = readTasks();
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeTasks(tasks);

  return NextResponse.json(task, { status: 201 });
}
