export const AUSTAX_GUIDE = {
  agentId: "dfd67189-3aff-4662-85f2-bf1bdaa0133b",
  instanceId: "00bf92c7-1cee-4fa4-823a-280f5206f755",
  name: "AusTax Guide",
} as const;

export type GuideResponse = {
  reply: string;
  sources?: { title: string; url: string }[];
};

function safeFallback(message: string): GuideResponse {
  const question = message.toLowerCase();

  if (/tfn|tax file number|password|bank login|mygov/.test(question)) {
    return {
      reply:
        "For your safety, never enter a TFN, myGov password, bank login, or identity-document number in AusTax or an AI chat. Use the official ATO online service directly for those details.",
    };
  }
  if (/work(ing)? from home|wfh/.test(question)) {
    return {
      reply:
        "For work-from-home expenses, keep a record of your hours and the evidence needed for the ATO method you use. Check the current ATO guidance before making any claim; AusTax cannot decide what you can claim.",
      sources: [
        { title: "ATO work-from-home expenses", url: "https://www.ato.gov.au/individuals-and-families/income-deductions-and-offsets/deductions-you-can-claim/work-related-expenses/working-from-home-expenses" },
      ],
    };
  }
  if (/private health|insurance/.test(question)) {
    return {
      reply:
        "Keep your private health insurance statement ready. Review the pre-filled details in myTax and check them against your statement before lodging.",
      sources: [
        { title: "ATO private health insurance", url: "https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/private-health-insurance" },
      ],
    };
  }
  return {
    reply:
      "I can help you organise a checklist and understand the official process. I can’t determine eligibility, calculate a final tax outcome, or lodge a return. Check the ATO guidance or a registered tax agent before lodging.",
  };
}

/**
 * Calls the app's server-side MCP bridge. The browser never receives a PAGS
 * token and the bridge must use the private `chat_with_instance` MCP tool.
 */
export async function askAusTaxGuide(message: string): Promise<GuideResponse> {
  try {
    const response = await fetch("/api/pags/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceId: AUSTAX_GUIDE.instanceId, message }),
      signal: AbortSignal.timeout(7_000),
    });
    if (response.ok) return (await response.json()) as GuideResponse;
  } catch {
    // The static app can still provide bounded, general-information guidance.
  }

  return safeFallback(message);
}
