export abstract class SourceProvider {
  abstract getWords(): Promise<string[]>;
}

export { CmuDict } from "./cmudict.ts";
