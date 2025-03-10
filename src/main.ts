import * as source from "./source/index.ts";
import * as inference from "./inference/index.ts";
import { Semaphore } from "@core/asyncutil/semaphore";
import { bisectMax, shuffle } from "./utils.ts";

const sourceProvider = new source.CmuDict();
const inferenceProvider = new inference.Gemini();

console.log("1: Loading words...");
const words = await sourceProvider.getWords();
console.log(`Loaded ${words.length} words`);

console.log("2: Finding maximum batch size...");
const maxBatchSize = await bisectMax(1, 1000, async (batchSize) => {
  console.log(`Trying batch size ${batchSize}...`);
  const currentWords = shuffle(words).slice(0, batchSize);
  const results = await inferenceProvider.infer(currentWords).catch((err) => {
    console.error(String(err));
    return {};
  });
  return Object.keys(results).length === batchSize;
});

const batchSize = maxBatchSize * 0.9;
console.log(`Maximum batch size is ${maxBatchSize}, using ${batchSize}`);

console.log("3: Inferring pronunciations...");
const shuffledWords = shuffle(words);

const concurrency = 10;
const semaphore = new Semaphore(concurrency);
console.log(`Using ${concurrency} concurrency`);

const promises: Promise<void>[] = [];
const allResults: Record<string, string> = {};

const inferBatch = (words: string[]) =>
  semaphore.lock(async () => {
    const results = await inferenceProvider.infer(words).catch((err) => {
      const halfWords = words.slice(0, words.length / 2);
      const halfWords2 = words.slice(words.length / 2);
      console.error(String(err));
      promises.push(inferBatch(halfWords));
      promises.push(inferBatch(halfWords2));
      console.log(
        `Splitting batch of ${words.length} into two batches of ${halfWords.length} and ${halfWords2.length}`,
      );
      return {};
    });

    console.log(
      `Inferred ${Object.keys(results).length} pronunciations, ${shuffledWords.length - Object.keys(allResults).length} remaining`,
    );
    Object.assign(allResults, results);
  });

for (let i = 0; i < shuffledWords.length; i += batchSize) {
  const currentWords = shuffledWords.slice(i, i + batchSize);

  promises.push(inferBatch(currentWords));
}

while (Object.keys(allResults).length < words.length) {
  await Promise.all(promises);
}

console.log("4: Writing results...");
await Bun.file("./results.json").write(JSON.stringify(allResults, null, 2));
