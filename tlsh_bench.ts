import { TlshTree } from "./tlsh.ts";

function generateRandomTLSH(): string {
  const hexChars = "0123456789ABCDEF";

  const getRandomHex = (length: number): string => {
    return Array.from(
      { length },
      () => hexChars[Math.floor(Math.random() * 16)]
    ).join("");
  };

  const checksum = getRandomHex(6); // Checksum prefix
  const lengthVal = getRandomHex(3); // Length
  const qRatio = getRandomHex(3); // Q-ratio
  const body = getRandomHex(58); // Main hash body

  return checksum + lengthVal + qRatio + body;
}

function generateTLSHHashes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateRandomTLSH());
}

const hashes = generateTLSHHashes(100000);
console.log(`Generated ${hashes.length} TLSH hashes.`);

Deno.bench("benchmark tree creation with 100k hashes", () => {
  const _tree = new TlshTree(hashes, 100);
});
