import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track active PTY session so browser refresh reconnects
let activePty: any = null;
let activeWs: WebSocket | null = null;

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url!, true);

    if (pathname === "/ws/terminal") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (ws: WebSocket) => {
    // Lazy-load node-pty (native module)
    const pty = await import("node-pty");

    // If there's an existing PTY session, reconnect to it
    if (activePty) {
      // Clean up old WebSocket if any
      if (activeWs && activeWs !== ws && activeWs.readyState === WebSocket.OPEN) {
        activeWs.close();
      }
      activeWs = ws;

      // Tell the client the session is live
      ws.send(JSON.stringify({ type: "status", status: "connected" }));

      // Wire up the existing PTY to the new WebSocket
      const dataHandler = activePty.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.on("message", (msg: Buffer | string) => {
        const message = msg.toString();
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === "resize" && activePty) {
            activePty.resize(parsed.cols, parsed.rows);
            return;
          }
        } catch {
          // Not JSON — treat as keystroke
        }
        if (activePty) {
          activePty.write(message);
        }
      });

      ws.on("close", () => {
        dataHandler.dispose();
        if (activeWs === ws) {
          activeWs = null;
        }
      });

      ws.send("\r\n\x1b[33m[Reconnected to existing session]\x1b[0m\r\n");
      return;
    }

    // Resolve claude binary — ~/.local/bin may not be in default PATH
    const home = process.env.HOME || "/Users/abereyes";
    const claudePath = `${home}/.local/bin/claude`;

    // Ensure ~/.local/bin is in PATH for child processes
    const envPath = process.env.PATH || "";
    const localBin = `${home}/.local/bin`;
    const fullPath = envPath.includes(localBin) ? envPath : `${localBin}:${envPath}`;

    let shell;
    try {
      shell = pty.spawn(claudePath, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 30,
        cwd: home,
        env: {
          ...process.env,
          TERM: "xterm-256color",
          PATH: fullPath,
        } as Record<string, string>,
      });
    } catch (error: any) {
      console.error("Failed to spawn claude PTY:", error.message);
      ws.send(JSON.stringify({ type: "status", status: "error", message: error.message }));
      ws.send(
        "\r\n\x1b[31m[Failed to start Claude session]\x1b[0m\r\n" +
        `\x1b[33mError: ${error.message}\x1b[0m\r\n\r\n` +
        "\x1b[90mThis usually means:\x1b[0m\r\n" +
        "\x1b[90m  - PTY allocation blocked (run server from a real terminal, not inside Claude Code)\x1b[0m\r\n" +
        "\x1b[90m  - claude binary not found at: " + claudePath + "\x1b[0m\r\n" +
        "\x1b[90m  - node-pty native module needs rebuild: npm rebuild node-pty\x1b[0m\r\n"
      );
      return;
    }

    activePty = shell;
    activeWs = ws;

    // Tell the client the session is live
    ws.send(JSON.stringify({ type: "status", status: "connected" }));

    shell.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    shell.onExit(() => {
      activePty = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "status", status: "ended" }));
        ws.send("\r\n\x1b[31m[Claude session ended]\x1b[0m\r\n");
        ws.close();
      }
    });

    ws.on("message", (msg: Buffer | string) => {
      const message = msg.toString();
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "resize") {
          shell.resize(parsed.cols, parsed.rows);
          return;
        }
      } catch {
        // Not JSON — treat as keystroke
      }
      shell.write(message);
    });

    ws.on("close", () => {
      if (activeWs === ws) {
        activeWs = null;
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Bridgette ready on http://${hostname}:${port}`);
  });
});
