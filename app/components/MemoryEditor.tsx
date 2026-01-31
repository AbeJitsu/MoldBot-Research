"use client";

import { useEffect, useState, useCallback } from "react";

interface MemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export default function MemoryEditor() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Load file list
  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load file content when selected
  const loadFile = useCallback(async (path: string) => {
    setSelectedFile(path);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/memory/${path}`);
      const data = await res.json();
      setContent(data.content);
      setOriginalContent(data.content);
    } catch {
      setContent("Failed to load file");
    }
  }, []);

  // Save file
  const saveFile = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/memory/${selectedFile}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setOriginalContent(content);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
    setSaving(false);
  }, [selectedFile, content]);

  // Keyboard shortcut: Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile]);

  const hasChanges = content !== originalContent;

  // Group files by directory
  const grouped = files.reduce<Record<string, MemoryFile[]>>((acc, file) => {
    const dir = file.path.includes("/") ? file.path.split("/")[0] : "root";
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(file);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading memory files...
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — file list */}
      <div className="w-64 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Memory Files
          </h2>
        </div>
        <nav className="py-2">
          {Object.entries(grouped).map(([dir, dirFiles]) => (
            <div key={dir}>
              {dir !== "root" && (
                <div className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase">
                  {dir}/
                </div>
              )}
              {dirFiles.map((file) => (
                <button
                  key={file.path}
                  onClick={() => loadFile(file.path)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedFile === file.path
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="truncate">
                    {dir !== "root" ? file.name : file.path}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(file.modified).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile}
                </span>
                {hasChanges && (
                  <span className="text-xs text-amber-600 font-medium">
                    unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {saveStatus === "saved" && (
                  <span className="text-xs text-emerald-600">Saved</span>
                )}
                {saveStatus === "error" && (
                  <span className="text-xs text-red-600">Save failed</span>
                )}
                <button
                  onClick={saveFile}
                  disabled={saving || !hasChanges}
                  className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                    hasChanges
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 p-4 font-mono text-sm text-gray-800 bg-gray-50 resize-none focus:outline-none"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  );
}
