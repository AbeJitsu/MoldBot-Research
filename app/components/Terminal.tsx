"use client";

import { useEffect, useRef, useState } from "react";

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      // Dynamic imports — xterm is browser-only
      const { Terminal } = await import("@xterm/xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // xterm CSS is imported in globals.css

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
        setStatus("connected");
        // Send initial terminal size
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onclose = () => {
        setStatus("disconnected");
        term.write("\r\n\x1b[31m[Session disconnected. Refresh to reconnect.]\x1b[0m\r\n");
      };

      ws.onerror = () => {
        setStatus("disconnected");
      };

      // Send keystrokes to server
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Handle resize
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

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "connected"
              ? "bg-emerald-400"
              : status === "connecting"
              ? "bg-yellow-400 animate-pulse"
              : "bg-red-400"
          }`}
        />
        <span className="text-gray-400">
          {status === "connected" && "Connected to Claude Code"}
          {status === "connecting" && "Connecting..."}
          {status === "disconnected" && "Disconnected"}
        </span>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1" />
    </div>
  );
}
