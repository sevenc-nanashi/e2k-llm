import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import type { InferenceProvider } from ".";

export class Gemini implements InferenceProvider {
  genAI: GoogleGenerativeAI;
  model: GenerativeModel;
  constructor() {
    const apiKey = Bun.env["GOOGLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Missing GOOGLE_API_KEY environment variable");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  }

  async infer(words: string[]) {
    const prompt = [
      "Estimate Japanese-style pronunciation of these words, and output in the specified format. Don't include any other texts.",
      "Words:",
      ...words,
      "Format:",
      "word=ハツオン",
      "word=ハツオン",
    ].join("\n");

    const response = await this.model
      .generateContent(prompt)
      .then((res) => res.response.text());
    const resultPattern = /^([a-z]+)=(.+)$/gm;
    const results = Object.fromEntries(
      [...response.matchAll(resultPattern)].map((match) => [
        match[1],
        match[2],
      ]),
    );
    for (const word of words) {
      if (!(word in results)) {
        throw new Error(`Failed to infer pronunciation for ${word}`);
      }
    }

    return results;
  }
}
