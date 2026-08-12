type InteractionResult = {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

export function interactionOutputText(result: InteractionResult) {
  return result.steps
    ?.filter(step => step.type === "model_output")
    .flatMap(step => step.content ?? [])
    .filter(content => content.type === "text")
    .map(content => content.text ?? "")
    .join("")
    .trim() ?? "";
}
