"use client";

import { useState } from "react";
import ChatSession from "@/components/ChatSession";
import Terminal from "@/components/Terminal";
import MemoryEditor from "@/components/MemoryEditor";
import Automations from "@/components/Automations";

type Tab = "chat" | "terminal" | "memory" | "automations";

const TABS: { id: Tab; label: string; activeClass: string }[] = [
  { id: "chat", label: "Chat", activeClass: "bg-emerald-100 text-emerald-700" },
  { id: "terminal", label: "Terminal", activeClass: "bg-gray-200 text-gray-700" },
  { id: "memory", label: "Memory", activeClass: "bg-blue-100 text-blue-700" },
  { id: "automations", label: "Automations", activeClass: "bg-purple-100 text-purple-700" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">
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
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "chat" && <ChatSession />}
        {activeTab === "terminal" && <Terminal />}
        {activeTab === "memory" && <MemoryEditor />}
        {activeTab === "automations" && <Automations />}
      </main>
    </div>
  );
}
