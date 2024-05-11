import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { Tlsh, TlshTree } from "./mod.ts";
import { assertThrows } from "https://deno.land/std@0.204.0/assert/assert_throws.ts";

Deno.test("should create a valid hash", () => {
    const input =
        "MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!";

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    const tlsh = new Tlsh(uint8Array);
    assertEquals(tlsh.toString(), "8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
});

Deno.test("should create a valid tlsh hash object", () => {
    const input1 = "8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2";
    const input2 = "T28AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2";
    const input3 = "T28AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2".toLowerCase();
    const tlsh1 = Tlsh.from(input1);
    const tlsh2 = Tlsh.from(input2);
    assertEquals(tlsh1.toString(), tlsh2.toString());
    const tlsh3 = Tlsh.from(input3);
    assertEquals(tlsh1.toString(), tlsh3.toString());
});

Deno.test("should create a TNULL hash if not enough data is provided", () => {
    const input = "not enough";
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    const tlsh = new Tlsh(uint8Array);
    assertEquals(tlsh.toString(), "TNULL");
});

Deno.test("should throw exceptions if invalid hashes are provided to from() method", () => {
    const input = "not enough";
    assertThrows(() => {
        Tlsh.from(input);
    });
});

Deno.test("should throw errors if invalid hashes are provided", () => {
    const input = "not enough";
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    const tlsh = new Tlsh(uint8Array);
    assertEquals(tlsh.toString(), "TNULL");
});

Deno.test("should encode and decode hashes correctly", () => {
    const input =
        "MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!";

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    const tlsh = new Tlsh(uint8Array);
    assertEquals(tlsh.toString(), "8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
    const tlsh2 = Tlsh.from("8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
    assertEquals(tlsh2.toString(), "8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
});

Deno.test("should diff hashes correctly", () => {
    const input =
        "MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!";

    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(input);
    const tlsh = new Tlsh(uint8Array);
    const tlsh2 = Tlsh.from("8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
    assertEquals(tlsh.diff(tlsh2), 0);

    const tlsh3 = Tlsh.from("8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C3");
    assertEquals(tlsh.diff(tlsh3), 1);
});

Deno.test("should construct a simple tree with multiple leaf nodes", () => {
    const input = [
        "54456c07b6a214fcc5d6AAAAA26b96b26c70b4a581327d7b349ce6302f52f642b6efe1",
        "54456c07b6a214fcc5d6c570BBBBB6b26c70b4a581327d7b349ce6302f52f642b6efe2",
        "54456c07b6a214fcc5d6c570826bCCCCCc70b4a581327d7b349ce6302f52f642b6efe3",
        "54456c07b6a214fcc5d6c570826b96b2DDDDD4a581327d7b349ce6302f52f642b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70EEEEE1327d7b349ce6302f52f642baaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a5FFFFFd7b349ce6302f52f642baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327AAAAA9ce6302f52f641b6efe1",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b3BBBBB302f52f632b6efe2",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ceCCCCC52f643b6efe3",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302DDDDD44b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52fEEEEEaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f646bFFFFF",
        "54456c07AAAAA4fcc5d61570826b96b26c70b4a581327d7b349ce6302f52f642b6efe1",
        "54456c07b6a2BBBBB5d62570826b96b26c70b4a581327d7b349ce6302f52f642b6efe2",
        "54456c07b6a214fcCCCCC570826b96b26c70b4a581327d7b349ce6302f52f642b6efe3",
        "54456c07b6a214fcc5d6DDDDD26b96b26c70b4a581327d7b349ce6302f52f642b6efe4",
        "54456c07b6a214fcc5d65570EEEEE6b26c70b4a581327d7b349ce6302f52f642baaaab",
        "54456c07b6a214fcc5d66570826bFFFFFc70b4a581327d7b349ce6302f52f642baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26AAAAAa581327d7b349ce6302f52f641b6efe1",
        "54456c07b6a214fcc5d6c570826b96b26c70bBBBBB327d7b349ce6302f52f632b6efe2",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a58CCCCC7b349ce6302f52f643b6efe3",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327DDDDD9ce6302f52f644b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b3EEEEE302f52f645baaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ceFFFFF52f646baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f642baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f642baaaaa", //duplicate
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f642baaaaa", //duplicate
    ];
    const tree = new TlshTree(input, 10);
    assertEquals(tree.numLeafs, 3);
    assertEquals(tree.size, 25);
});

Deno.test("should parse and output the same tlsh hashes", () => {
    const input = [
        "54456c07b6a214fcc5d6AAAAA26b96b26c70b4a581327d7b349ce6302f52f642b6efe1",
        "54456c07b6a214fcc5d6c570BBBBB6b26c70b4a581327d7b349ce6302f52f642b6efe2",
        "54456c07b6a214fcc5d6c570826bCCCCCc70b4a581327d7b349ce6302f52f642b6efe3",
        "54456c07b6a214fcc5d6c570826b96b2DDDDD4a581327d7b349ce6302f52f642b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70EEEEE1327d7b349ce6302f52f642baaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a5FFFFFd7b349ce6302f52f642baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327AAAAA9ce6302f52f641b6efe1",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b3BBBBB302f52f632b6efe2",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ceCCCCC52f643b6efe3",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302DDDDD44b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52fEEEEEaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f646bFFFFF",
        "54456c07AAAAA4fcc5d61570826b96b26c70b4a581327d7b349ce6302f52f642b6efe1",
        "54456c07b6a2BBBBB5d62570826b96b26c70b4a581327d7b349ce6302f52f642b6efe2",
        "54456c07b6a214fcCCCCC570826b96b26c70b4a581327d7b349ce6302f52f642b6efe3",
        "54456c07b6a214fcc5d6DDDDD26b96b26c70b4a581327d7b349ce6302f52f642b6efe4",
        "54456c07b6a214fcc5d65570EEEEE6b26c70b4a581327d7b349ce6302f52f642baaaab",
        "54456c07b6a214fcc5d66570826bFFFFFc70b4a581327d7b349ce6302f52f642baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26AAAAAa581327d7b349ce6302f52f641b6efe1",
        "54456c07b6a214fcc5d6c570826b96b26c70bBBBBB327d7b349ce6302f52f632b6efe2",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a58CCCCC7b349ce6302f52f643b6efe3",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327DDDDD9ce6302f52f644b6efe4",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b3EEEEE302f52f645baaaab",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ceFFFFF52f646baaaaa",
        "54456c07b6a214fcc5d6c570826b96b26c70b4a581327d7b349ce6302f52f642baaaaa",
    ];

    for (const hash of input) {
        const tlsh = Tlsh.from(hash);
        const tlshHash = tlsh.toString().toLowerCase();
        assertEquals(hash.toLowerCase(), tlshHash);
    }
});
