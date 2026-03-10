interface GeneratedPrompt {
  prompt_id: number;
  category: string;
  prompt_text: string;
}

const MAX_PROMPTS = 20;

const SERVICE_TEMPLATES = [
  "What are the best {service} providers in {location}?",
  "Who are the top {service} companies?",
  "Can you recommend {service} services for small businesses?",
  "{service} providers comparison {location}",
  "Best {service} companies near me",
  "Who are the leading {service} companies in {location}?",
];

const KEYWORD_TEMPLATES = [
  "{keyword}",
  "Best {keyword} in {location}",
  "Top companies for {keyword}",
];

export function generatePrompts(
  services: string[],
  location: string = "",
  keywords: string[] = []
): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];
  let promptId = 1;
  const loc = location || "my area";

  for (const service of services) {
    for (const template of SERVICE_TEMPLATES) {
      prompts.push({
        prompt_id: promptId++,
        category: service,
        prompt_text: template
          .replace(/\{service\}/g, service)
          .replace(/\{location\}/g, loc),
      });
    }
  }

  for (const keyword of keywords) {
    if (prompts.length >= MAX_PROMPTS) break;
    for (const template of KEYWORD_TEMPLATES) {
      if (prompts.length >= MAX_PROMPTS) break;
      prompts.push({
        prompt_id: promptId++,
        category: "Target Keywords",
        prompt_text: template
          .replace(/\{keyword\}/g, keyword)
          .replace(/\{location\}/g, loc),
      });
    }
  }

  return prompts.slice(0, MAX_PROMPTS);
}
