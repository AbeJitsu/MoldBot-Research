"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track the in-progress assistant message being streamed
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

    ws.onopen = () => {
      setStatus("connected");
    };

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

    ws.onerror = () => {
      setStatus("disconnected");
    };
  }, []);

  // Connect on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  // ============================================
  // EVENT HANDLING — parse NDJSON from server
  // ============================================

  const handleServerEvent = useCallback((data: any) => {
    const type = data.type;

    if (type === "system" && data.subtype === "init") {
      // Store session ID and model info
      if (data.session_id) setSessionId(data.session_id);
      if (data.model) setCurrentModel(data.model);
      return;
    }

    // Stream events (with --include-partial-messages)
    if (type === "stream_event") {
      const event = data.event;
      if (!event) return;

      if (event.type === "message_start") {
        // Start a new assistant message
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
          // New tool use block starting
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
          // Append text to current message
          updateStreamingMessage((msg) => ({
            ...msg,
            content: msg.content + delta.text,
          }));
        } else if (delta?.type === "input_json_delta" && delta.partial_json) {
          // Tool input streaming — accumulate JSON string
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
        // Finalize the last tool use input if it was partial
        updateStreamingMessage((msg) => {
          const tools = [...(msg.toolUses || [])];
          if (tools.length > 0) {
            const last = { ...tools[tools.length - 1] };
            if (last.input._partial) {
              try {
                last.input = JSON.parse(last.input._partial as string);
              } catch {
                // Keep partial as-is
              }
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

    // Full assistant message (without --include-partial-messages)
    if (type === "assistant") {
      const msg = data.message;
      if (!msg) return;

      const content = msg.content
        ?.filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("") || "";

      const toolUses: ToolUse[] = msg.content
        ?.filter((c: any) => c.type === "tool_use")
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          input: c.input,
          isComplete: false,
        })) || [];

      const newMsg: ChatMessage = {
        id: msg.id || crypto.randomUUID(),
        role: "assistant",
        content,
        toolUses,
        model: msg.model,
      };

      // Replace streaming message or add new
      setMessages((prev) => {
        const existing = prev.findIndex((m) => m.id === newMsg.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });
      return;
    }

    // Tool results
    if (type === "tool_result" || (type === "system" && data.subtype === "tool_result")) {
      const toolUseId = data.tool_use_id;
      const result = typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content, null, 2);

      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.toolUses?.some((t) => t.id === toolUseId)) return msg;
          return {
            ...msg,
            toolUses: msg.toolUses?.map((t) =>
              t.id === toolUseId ? { ...t, result, isComplete: true } : t
            ),
          };
        })
      );
      return;
    }

    // Result event — cost and duration
    if (type === "result") {
      setStatus("connected");
      streamingMessageRef.current = null;
      if (data.session_id) setSessionId(data.session_id);

      // Attach cost info to last assistant message
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            cost: data.total_cost_usd,
            duration: data.duration_ms,
          },
        ];
      });
      return;
    }
  }, []);

  // Helper to update the currently streaming message
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
  // SEND MESSAGE
  // ============================================

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (status === "streaming") return;

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: "message",
      text,
      sessionId,
    }));

    setStatus("streaming");
  }, [input, status, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  // ============================================
  // RENDER
  // ============================================

  const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
    disconnected: { color: "bg-gray-400", label: "Disconnected" },
    connecting: { color: "bg-yellow-400 animate-pulse", label: "Connecting..." },
    connected: { color: "bg-emerald-400", label: currentModel || "Ready" },
    streaming: { color: "bg-emerald-400 animate-pulse", label: "Thinking..." },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-200 text-xs">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-gray-500">{label}</span>
        {sessionId && (
          <span className="ml-auto text-gray-400 font-mono text-[10px]">
            {sessionId.slice(0, 8)}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Start a conversation with Claude
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={status === "disconnected" || status === "connecting"}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || status === "streaming" || status === "disconnected"}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-500/25"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MESSAGE BUBBLE
// ============================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 text-sm ${
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {/* Text content */}
        {message.content && (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {/* Tool uses */}
        {message.toolUses && message.toolUses.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolUses.map((tool) => (
              <ToolUseCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Cost info */}
        {message.cost !== undefined && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex gap-3">
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
// TOOL USE CARD
// ============================================

function ToolUseCard({ tool }: { tool: ToolUse }) {
  const [expanded, setExpanded] = useState(false);

  // Friendly tool name display
  const displayName = tool.name.replace(/_/g, " ").replace(/^mcp__\w+__/, "");

  // Summarize the tool input for the collapsed view
  const summary = getToolSummary(tool);

  return (
    <div className="rounded-md border border-gray-200 bg-white text-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${tool.isComplete ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"}`} />
        <span className="font-medium">{displayName}</span>
        <span className="text-gray-400 truncate flex-1 text-left">{summary}</span>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-3 py-2 text-xs">
          {/* Input */}
          <div className="mb-2">
            <span className="font-medium text-gray-500">Input:</span>
            <pre className="mt-1 bg-gray-50 rounded p-2 overflow-x-auto text-[11px] max-h-40 overflow-y-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>

          {/* Result */}
          {tool.result && (
            <div>
              <span className="font-medium text-gray-500">Result:</span>
              <pre className="mt-1 bg-gray-50 rounded p-2 overflow-x-auto text-[11px] max-h-60 overflow-y-auto">
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

function getToolSummary(tool: ToolUse): string {
  const input = tool.input;
  if (!input || typeof input !== "object") return "";

  // Common tool patterns
  if (tool.name === "Read" && input.file_path) return String(input.file_path);
  if (tool.name === "Write" && input.file_path) return String(input.file_path);
  if (tool.name === "Edit" && input.file_path) return String(input.file_path);
  if (tool.name === "Bash" && input.command) return String(input.command).slice(0, 60);
  if (tool.name === "Glob" && input.pattern) return String(input.pattern);
  if (tool.name === "Grep" && input.pattern) return String(input.pattern);
  if (tool.name === "WebFetch" && input.url) return String(input.url).slice(0, 60);
  if (tool.name === "WebSearch" && input.query) return String(input.query).slice(0, 60);

  return "";
}
