export const AUSTAX_GUIDE = {
  agentId: "dfd67189-3aff-4662-85f2-bf1bdaa0133b",
  instanceId: "00bf92c7-1cee-4fa4-823a-280f5206f755",
  name: "AusTax Guide",
} as const;

type GuideResponse = {
  reply: string;
  sources?: { title: string; url: string }[];
};

/**
 * Calls the app's server-side MCP bridge. The browser never receives a PAGS
 * token and the bridge must use the private `chat_with_instance` MCP tool.
 */
export async function askAusTaxGuide(message: string): Promise<GuideResponse> {
  const response = await fetch("/api/pags/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instanceId: AUSTAX_GUIDE.instanceId, message }),
  });

  if (!response.ok) throw new Error("AusTax Guide is unavailable");
  return response.json() as Promise<GuideResponse>;
}
