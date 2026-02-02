"use client";

import { useState, useEffect, useCallback } from "react";

interface ReconnectingOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function ReconnectingOverlay({ visible, onDismiss }: ReconnectingOverlayProps) {
  const [dots, setDots] = useState(".");
  const [successCount, setSuccessCount] = useState(0);

  const REQUIRED_PINGS = 3;

  // Animate dots
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);
    return () => clearInterval(timer);
  }, [visible]);

  // Ping health endpoint to detect server recovery
  useEffect(() => {
    if (!visible) {
      setSuccessCount(0);
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          setSuccessCount((c) => {
            const next = c + 1;
            if (next >= REQUIRED_PINGS) {
              // Server is back — reload the page
              window.location.reload();
            }
            return next;
          });
        } else {
          setSuccessCount(0);
        }
      } catch {
        setSuccessCount(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-sm w-full mx-4 text-center">
        {/* Spinning icon */}
        <div className="flex justify-center mb-4">
          <svg
            className="animate-spin h-8 w-8 text-emerald-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Reconnecting to server{dots}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {successCount > 0
            ? `Server detected (${successCount}/${REQUIRED_PINGS})...`
            : "Waiting for server to come back online"}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
