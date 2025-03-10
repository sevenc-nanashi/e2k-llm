import type { SourceProvider } from "./index.ts";

export class CmuDict implements SourceProvider {
  async getWords() {
    const dictPath = `${import.meta.dirname}/../../deps/cmudict/cmudict-0.7b`;
    const dictContent = await Bun.file(dictPath).text();
    const dictPattern = /^([A-Z]{3,})  .+$/gm;

    const words = dictContent.matchAll(dictPattern);

    return Array.from(words, (match) => match[1].toLowerCase());
  }
}
