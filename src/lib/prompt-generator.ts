interface GeneratedPrompt {
  prompt_id: number;
  category: string;
  prompt_text: string;
}

const MAX_PROMPTS = 30;

const QUESTION_WORDS = [
  "what",
  "who",
  "where",
  "which",
  "how",
  "can",
  "do",
  "does",
  "is",
  "are",
  "should",
  "why",
  "compare",
  "recommend",
];

function startsWithQuestionWord(text: string): boolean {
  const lower = text.toLowerCase();
  return QUESTION_WORDS.some((w) => lower.startsWith(w + " "));
}

/**
 * Generate prompts from user-entered queries.
 * Each query is used verbatim as a prompt. If the query isn't already
 * a question, 1-2 variations are generated.
 */
export function generatePrompts(queries: string[]): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];
  let promptId = 1;

  for (const query of queries) {
    if (prompts.length >= MAX_PROMPTS) break;
    const trimmed = query.trim();
    if (!trimmed) continue;

    // Always include the user's exact query verbatim
    prompts.push({
      prompt_id: promptId++,
      category: trimmed,
      prompt_text: trimmed,
    });

    // Add variations only if it's not already a question
    if (!startsWithQuestionWord(trimmed)) {
      if (prompts.length < MAX_PROMPTS) {
        prompts.push({
          prompt_id: promptId++,
          category: trimmed,
          prompt_text: `Can you recommend ${trimmed.toLowerCase()}?`,
        });
      }
      if (prompts.length < MAX_PROMPTS) {
        prompts.push({
          prompt_id: promptId++,
          category: trimmed,
          prompt_text: `What are the best ${trimmed.toLowerCase()}?`,
        });
      }
    }
  }

  return prompts.slice(0, MAX_PROMPTS);
}

/**
 * Generate prompts from new queries to append to an existing audit.
 * Prompt IDs start from startId to avoid collisions.
 */
export function generateAdditionalPrompts(
  queries: string[],
  startId: number
): GeneratedPrompt[] {
  const prompts: GeneratedPrompt[] = [];
  let promptId = startId;

  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed) continue;

    prompts.push({
      prompt_id: promptId++,
      category: trimmed,
      prompt_text: trimmed,
    });

    if (!startsWithQuestionWord(trimmed)) {
      prompts.push({
        prompt_id: promptId++,
        category: trimmed,
        prompt_text: `Can you recommend ${trimmed.toLowerCase()}?`,
      });
    }
  }

  return prompts;
}
