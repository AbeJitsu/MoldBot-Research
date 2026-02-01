"use client";

import { useState } from "react";
import ChatSession from "@/components/ChatSession";
import Terminal from "@/components/Terminal";
import MemoryEditor from "@/components/MemoryEditor";
import Automations from "@/components/Automations";
import { LeftTaskPanel, RightTaskPanel } from "@/components/TaskPanel";

type Tab = "chat" | "terminal" | "memory" | "automations";

const TABS: { id: Tab; label: string; activeClass: string }[] = [
  { id: "chat", label: "Chat", activeClass: "bg-emerald-900/50 text-emerald-400" },
  { id: "terminal", label: "Terminal", activeClass: "bg-gray-700 text-gray-200" },
  { id: "memory", label: "Memory", activeClass: "bg-blue-900/50 text-blue-400" },
  { id: "automations", label: "Automations", activeClass: "bg-purple-900/50 text-purple-400" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-700 bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-100">
          Bridgette
        </h1>
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.activeClass
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden flex">
        {activeTab === "chat" && (
          <>
            <LeftTaskPanel />
            <div className="flex-1 overflow-hidden">
              <ChatSession />
            </div>
            <RightTaskPanel />
          </>
        )}
        {activeTab === "terminal" && <Terminal />}
        {activeTab === "memory" && <MemoryEditor />}
        {activeTab === "automations" && <Automations />}
      </main>
    </div>
  );
}
