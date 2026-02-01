"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: ToolUse[];
  cost?: number;
  duration?: number;
  model?: string;
}

interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isComplete: boolean;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "streaming";

// ============================================
// CHAT SESSION COMPONENT
// ============================================

export default function ChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>("");
  const [cwd, setCwd] = useState<string>("");
  const [showDirPicker, setShowDirPicker] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageRef = useRef<ChatMessage | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => setStatus("connected");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerEvent(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => setStatus("disconnected");
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => { wsRef.current?.close(); };
  }, [connectWebSocket]);

  // ============================================
  // EVENT HANDLING
  // ============================================

  const handleServerEvent = useCallback((data: any) => {
    const type = data.type;

    if (type === "state") {
      if (data.cwd) setCwd(data.cwd);
      return;
    }

    if (type === "system" && data.subtype === "init") {
      if (data.session_id) setSessionId(data.session_id);
      if (data.model) setCurrentModel(data.model);
      return;
    }

    if (type === "stream_event") {
      const event = data.event;
      if (!event) return;

      if (event.type === "message_start") {
        const newMsg: ChatMessage = {
          id: event.message?.id || crypto.randomUUID(),
          role: "assistant",
          content: "",
          toolUses: [],
        };
        streamingMessageRef.current = newMsg;
        setMessages((prev) => [...prev, newMsg]);
        setStatus("streaming");
        return;
      }

      if (event.type === "content_block_start") {
        const block = event.content_block;
        if (block?.type === "tool_use") {
          const toolUse: ToolUse = {
            id: block.id,
            name: block.name,
            input: {},
            isComplete: false,
          };
          updateStreamingMessage((msg) => ({
            ...msg,
            toolUses: [...(msg.toolUses || []), toolUse],
          }));
        }
        return;
      }

      if (event.type === "content_block_delta") {
        const delta = event.delta;
        if (delta?.type === "text_delta" && delta.text) {
          updateStreamingMessage((msg) => ({
            ...msg,
            content: msg.content + delta.text,
          }));
        } else if (delta?.type === "input_json_delta" && delta.partial_json) {
          updateStreamingMessage((msg) => {
            const tools = [...(msg.toolUses || [])];
            if (tools.length > 0) {
              const last = { ...tools[tools.length - 1] };
              last.input = { ...last.input, _partial: ((last.input._partial as string) || "") + delta.partial_json };
              tools[tools.length - 1] = last;
            }
            return { ...msg, toolUses: tools };
          });
        }
        return;
      }

      if (event.type === "content_block_stop") {
        updateStreamingMessage((msg) => {
          const tools = [...(msg.toolUses || [])];
          if (tools.length > 0) {
            const last = { ...tools[tools.length - 1] };
            if (last.input._partial) {
              try { last.input = JSON.parse(last.input._partial as string); } catch {}
            }
            tools[tools.length - 1] = last;
          }
          return { ...msg, toolUses: tools };
        });
        return;
      }

      if (event.type === "message_stop") {
        setStatus("connected");
        streamingMessageRef.current = null;
        return;
      }
      return;
    }

    if (type === "assistant") {
      const msg = data.message;
      if (!msg) return;
      const content = msg.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join("") || "";
      const toolUses: ToolUse[] = msg.content?.filter((c: any) => c.type === "tool_use").map((c: any) => ({
        id: c.id, name: c.name, input: c.input, isComplete: false,
      })) || [];
      const newMsg: ChatMessage = { id: msg.id || crypto.randomUUID(), role: "assistant", content, toolUses, model: msg.model };
      setMessages((prev) => {
        const existing = prev.findIndex((m) => m.id === newMsg.id);
        if (existing >= 0) { const updated = [...prev]; updated[existing] = newMsg; return updated; }
        return [...prev, newMsg];
      });
      return;
    }

    if (type === "tool_result" || (type === "system" && data.subtype === "tool_result")) {
      const toolUseId = data.tool_use_id;
      const result = typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2);
      setMessages((prev) => prev.map((msg) => {
        if (!msg.toolUses?.some((t) => t.id === toolUseId)) return msg;
        return { ...msg, toolUses: msg.toolUses?.map((t) => t.id === toolUseId ? { ...t, result, isComplete: true } : t) };
      }));
      return;
    }

    if (type === "result") {
      setStatus("connected");
      streamingMessageRef.current = null;
      if (data.session_id) setSessionId(data.session_id);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        return [...prev.slice(0, -1), { ...last, cost: data.total_cost_usd, duration: data.duration_ms }];
      });
      return;
    }
  }, []);

  function updateStreamingMessage(updater: (msg: ChatMessage) => ChatMessage) {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;
      const updated = updater(last);
      streamingMessageRef.current = updated;
      return [...prev.slice(0, -1), updated];
    });
  }

  // ============================================
  // ACTIONS
  // ============================================

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (status === "streaming") return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    wsRef.current.send(JSON.stringify({ type: "message", text, sessionId }));
    setStatus("streaming");
  }, [input, status, sessionId]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    streamingMessageRef.current = null;
    setStatus("connected");
    inputRef.current?.focus();
  }, []);

  const changeCwd = useCallback((newCwd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "set_cwd", cwd: newCwd }));
    // Also start a new chat since context changes
    setMessages([]);
    setSessionId(null);
    streamingMessageRef.current = null;
    setShowDirPicker(false);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  // ============================================
  // RENDER
  // ============================================

  const isReady = status === "connected" || status === "streaming";

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-white border-b border-gray-200 text-xs">
        <StatusDot status={status} />
        <span className="text-gray-500">
          {status === "disconnected" && "Disconnected"}
          {status === "connecting" && "Connecting..."}
          {status === "connected" && (currentModel ? formatModel(currentModel) : "Ready")}
          {status === "streaming" && "Responding..."}
        </span>

        {/* Working directory */}
        {cwd && (
          <button
            onClick={() => setShowDirPicker(!showDirPicker)}
            className="ml-2 flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors font-mono text-[11px] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 hover:border-gray-300"
            title="Change working directory"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {shortenPath(cwd)}
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {sessionId && (
            <span className="text-gray-400 font-mono text-[10px]">
              {sessionId.slice(0, 8)}
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={startNewChat}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="New chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Directory picker dropdown */}
      {showDirPicker && (
        <DirectoryPicker
          currentPath={cwd}
          onSelect={changeCwd}
          onClose={() => setShowDirPicker(false)}
        />
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isStreaming={status === "streaming" && msg === messages[messages.length - 1] && msg.role === "assistant"} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isReady ? "Message Claude..." : "Connecting..."}
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-colors placeholder:text-gray-400"
                disabled={!isReady || status === "streaming"}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || status === "streaming" || !isReady}
                className="absolute right-2 bottom-1.5 rounded-lg bg-emerald-600 text-white p-1.5 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-500/25"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400 text-center">
            Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Chat with Claude</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Ask questions, write code, explore ideas. Powered by your Claude Max subscription.
      </p>
    </div>
  );
}

// ============================================
// STATUS DOT
// ============================================

function StatusDot({ status }: { status: ConnectionStatus }) {
  const colors: Record<ConnectionStatus, string> = {
    disconnected: "bg-gray-400",
    connecting: "bg-yellow-400 animate-pulse",
    connected: "bg-emerald-400",
    streaming: "bg-emerald-400 animate-pulse",
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
}

// ============================================
// MESSAGE BUBBLE
// ============================================

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${isUser ? "max-w-lg" : "max-w-full w-full"}`}>
        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isUser
              ? "bg-emerald-600 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-800 shadow-sm rounded-bl-md"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <>
              {message.content && (
                <div className="markdown-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
              {isStreaming && !message.content && (
                <TypingIndicator />
              )}
            </>
          )}

          {/* Tool uses */}
          {message.toolUses && message.toolUses.length > 0 && (
            <div className={`mt-3 space-y-2 ${isUser ? "" : ""}`}>
              {message.toolUses.map((tool) => (
                <ToolUseCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>

        {/* Metadata below the bubble */}
        {!isUser && message.cost !== undefined && (
          <div className="mt-1 px-1 flex items-center gap-2 text-[11px] text-gray-400">
            <span>${message.cost.toFixed(4)}</span>
            {message.duration && (
              <span>{(message.duration / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// TYPING INDICATOR
// ============================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

// ============================================
// TOOL USE CARD
// ============================================

function ToolUseCard({ tool }: { tool: ToolUse }) {
  const [expanded, setExpanded] = useState(false);

  const displayName = tool.name.replace(/_/g, " ").replace(/^mcp__\w+__/, "");
  const summary = getToolSummary(tool);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 text-gray-700 overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tool.isComplete ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"}`} />
        <span className="font-semibold text-gray-600">{displayName}</span>
        <span className="text-gray-400 truncate flex-1 text-left font-mono">{summary}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-3 py-2 space-y-2">
          <div>
            <span className="font-semibold text-gray-500">Input</span>
            <pre className="mt-1 bg-white rounded-md border border-gray-200 p-2 overflow-x-auto text-[11px] max-h-40 overflow-y-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {tool.result && (
            <div>
              <span className="font-semibold text-gray-500">Result</span>
              <pre className="mt-1 bg-white rounded-md border border-gray-200 p-2 overflow-x-auto text-[11px] max-h-60 overflow-y-auto">
                {tool.result.length > 2000 ? tool.result.slice(0, 2000) + "\n..." : tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function shortenPath(path: string): string {
  const home = "/Users/" + (path.split("/")[2] || "");
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}

// ============================================
// DIRECTORY PICKER
// ============================================

function DirectoryPicker({
  currentPath,
  onSelect,
  onClose,
}: {
  currentPath: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [browsePath, setBrowsePath] = useState(currentPath);
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [customPath, setCustomPath] = useState(currentPath);

  useEffect(() => {
    loadDirs(browsePath);
  }, [browsePath]);

  async function loadDirs(path: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/directories?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setDirs(data.dirs || []);
    } catch {
      setDirs([]);
    }
    setLoading(false);
  }

  function goUp() {
    const parent = browsePath.split("/").slice(0, -1).join("/") || "/";
    setBrowsePath(parent);
    setCustomPath(parent);
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Path input + Use button */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSelect(customPath);
              }
            }}
            className="flex-1 font-mono text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter path..."
          />
          <button
            onClick={() => onSelect(customPath)}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors font-medium"
          >
            Use
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Breadcrumb + up button */}
        <div className="flex items-center gap-1 mb-2 text-xs text-gray-500">
          <button onClick={goUp} className="hover:text-gray-700 p-0.5" title="Go up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <span className="font-mono truncate">{shortenPath(browsePath)}</span>
        </div>

        {/* Directory list */}
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
          ) : dirs.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No subdirectories</div>
          ) : (
            dirs.map((dir) => (
              <div key={dir.path} className="flex items-center text-xs">
                <button
                  onClick={() => {
                    setBrowsePath(dir.path);
                    setCustomPath(dir.path);
                  }}
                  className="flex-1 text-left px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 flex-shrink-0">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {dir.name}
                </button>
                <button
                  onClick={() => onSelect(dir.path)}
                  className="px-2 py-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  Select
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatModel(model: string): string {
  // "claude-opus-4-5-20251101" -> "Opus 4.5"
  const match = model.match(/claude-(\w+)-(\d+)-(\d+)/);
  if (match) {
    const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    return `${name} ${match[2]}.${match[3]}`;
  }
  return model;
}

function getToolSummary(tool: ToolUse): string {
  const input = tool.input;
  if (!input || typeof input !== "object") return "";

  if (tool.name === "Read" && input.file_path) return String(input.file_path);
  if (tool.name === "Write" && input.file_path) return String(input.file_path);
  if (tool.name === "Edit" && input.file_path) return String(input.file_path);
  if (tool.name === "Bash" && input.command) return String(input.command).slice(0, 80);
  if (tool.name === "Glob" && input.pattern) return String(input.pattern);
  if (tool.name === "Grep" && input.pattern) return String(input.pattern);
  if (tool.name === "WebFetch" && input.url) return String(input.url).slice(0, 80);
  if (tool.name === "WebSearch" && input.query) return String(input.query).slice(0, 80);
  if (tool.name === "Task" && input.description) return String(input.description);

  return "";
}
