// In-memory queue for triggered automations that need execution
// This allows API routes to queue prompts for execution via WebSocket

let automationQueue: Array<{ prompt: string; timestamp: number }> = [];

export function addAutomationToQueue(prompt: string): void {
  automationQueue.push({ prompt, timestamp: Date.now() });
  // Clean up old entries older than 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  automationQueue = automationQueue.filter((item) => item.timestamp > fiveMinutesAgo);
}

export function getNextAutomation(): { prompt: string; timestamp: number } | null {
  return automationQueue.shift() || null;
}

export function peekAutomationQueue(): Array<{ prompt: string; timestamp: number }> {
  return [...automationQueue];
}
