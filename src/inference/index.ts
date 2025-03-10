export abstract class InferenceProvider {
  abstract infer(words: string[]): Promise<Record<string, string>>;
}

export { Gemini } from "./gemini.ts";
