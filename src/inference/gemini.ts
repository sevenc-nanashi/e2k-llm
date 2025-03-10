import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import type { DictionaryEntry, InferenceProvider } from ".";

export class Gemini implements InferenceProvider {
  genAI: GoogleGenerativeAI;
  model: GenerativeModel;
  constructor() {
    const apiKey = Bun.env["GOOGLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Missing GOOGLE_API_KEY environment variable");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              word: {
                type: SchemaType.STRING,
              },
              kata: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.STRING,
                },
              },
            },
            required: ["word", "kata"],
          },
        },
      },
    });
  }

  async infer(words: string[]) {
    const prompt = [
      "Estimate Japanese-style pronunciation of these words.",
      "Words:",
      ...words,
    ].join("\n");

    const results = await this.model.generateContent(prompt).then((res) => {
      const text = res.response.text();
      console.log(text);
      return JSON.parse(text) as DictionaryEntry[];
    });
    const returnedWords = new Set(results.map((r) => r.word));
    if (returnedWords.size !== words.length) {
      throw new Error(
        `Length mismatch: Requested ${words.length} words, got ${returnedWords.size}`,
      );
    }

    return results;
  }
}
