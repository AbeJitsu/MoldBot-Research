"use client";

import { useEffect, useRef, useState } from "react";

type Status = "connecting" | "connected" | "error" | "disconnected";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      if (!terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        theme: {
          background: "#1a1b26",
          foreground: "#a9b1d6",
          cursor: "#c0caf5",
          selectionBackground: "#33467c",
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(terminalRef.current);
      fitAddon.fit();
      xtermRef.current = term;

      // Connect WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/terminal`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Don't set connected yet — wait for server to confirm PTY is alive
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (event) => {
        // Check for JSON status messages from server
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "status") {
            if (parsed.status === "connected") {
              setStatus("connected");
            } else if (parsed.status === "error") {
              setStatus("error");
              setErrorMsg(parsed.message || "Unknown error");
            } else if (parsed.status === "ended") {
              setStatus("disconnected");
            }
            return;
          }
        } catch {
          // Not JSON — it's terminal output
        }
        term.write(event.data);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        term.write("\r\n\x1b[31m[Disconnected from server. Refresh to reconnect.]\x1b[0m\r\n");
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMsg("WebSocket connection failed");
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
        }
      });
      resizeObserver.observe(terminalRef.current);

      cleanup = () => {
        resizeObserver.disconnect();
        ws.close();
        term.dispose();
      };
    }

    init();

    return () => {
      cleanup?.();
    };
  }, []);

  const statusConfig: Record<Status, { color: string; label: string }> = {
    connecting: { color: "bg-yellow-400 animate-pulse", label: "Connecting..." },
    connected: { color: "bg-emerald-400", label: "Claude Code session active" },
    error: { color: "bg-red-400", label: errorMsg || "Failed to start session" },
    disconnected: { color: "bg-gray-400", label: "Disconnected" },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-xs">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-gray-400">{label}</span>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
}
