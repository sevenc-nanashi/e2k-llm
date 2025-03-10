export type DictionaryEntry = { word: string; kata: string[] };
export abstract class InferenceProvider {
  abstract infer(words: string[]): Promise<DictionaryEntry[]>;
}

export { Gemini } from "./gemini.ts";
