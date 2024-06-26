# Tlsh and Tlsh search tree

[![JSR](https://jsr.io/badges/@kgwinnup/tlsh)](https://jsr.io/@kgwinnup/tlsh)

TLSH-TS is a TrendMicro Locality Sensitive Hashing (TLSH) implementation in pure Typescript. Additionally, there is a
TLSH tree implementation to index a set of hashes for the purpose of efficient nearest neighbor look-ups.

TLSH is a fuzzy hashing algorithm that has the property of computing a distance metric between two hashes. This distance
metric is what enables TLSH to construct TLSH trees or indexes for efficient nearest neighbor lookups in large sets of
TLSH hashes.

## References

- Jonathan Oliver, Muqeet Ali, Josiah Hagen,
  "[HAC-T and Fast Search for Similarity in Security](https://tlsh.org/papersDir/COINS_2020_camera_ready.pdf)"
- Jonathan Oliver, Chun Cheng and Yanggui Chen,
  "[TLSH - A Locality Sensitive Hash](https://github.com/trendmicro/tlsh/blob/master/TLSH_CTC_final.pdf)” 4th Cybercrime
  and Trustworthy Computing Workshop, Sydney, November 2013

# Usage

For simple hashing the input to the hashing function is a Uint8Array, this value should be at least 50 bytes or more.

```typescript
const input =
    "MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!!MIT License is so cool license that I can't imagine a better one!";

const encoder = new TextEncoder();
const uint8Array = encoder.encode(input);
const tlsh = new Tlsh(uint8Array);
assertEquals(tlsh.toString(), "8AD02202FC30C02303A002B02B33B00EC30A82F80008E2FA000A008030B20E03CCA0C2");
```

To use the TLSH tree for fast nearest neighbor lookups, it will accept an array of TLSH hashes.

```typescript
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
```

If you want to dump the tree to a formatted tree view, you can use the `dump()` method of the tlsh tree.

```
// tree.dump()

left
.  left
.  .  54456C07B6A214FCC5D6AAAAA26B96B26C70B4A581327D7B349CE6302F52F642B6EFE1
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327AAAAA9CE6302F52F641B6EFE1
.  .  54456C07B6A214FCCCCCC570826B96B26C70B4A581327D7B349CE6302F52F642B6EFE3
.  .  54456C07B6A214FCC5D6C570826B96B26AAAAAA581327D7B349CE6302F52F641B6EFE1
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327DDDDD9CE6302F52F644B6EFE4
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B3EEEEE302F52F645BAAAAB
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CE6302F52F642BAAAAA
.  right
.  .  54456C07B6A214FCC5D6C570BBBBB6B26C70B4A581327D7B349CE6302F52F642B6EFE2
.  .  54456C07B6A214FCC5D6C570826B96B2DDDDD4A581327D7B349CE6302F52F642B6EFE4
.  .  54456C07B6A214FCC5D6C570826B96B26C70EEEEE1327D7B349CE6302F52F642BAAAAB
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B3BBBBB302F52F632B6EFE2
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CE6302DDDDD44B6EFE4
.  .  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CE6302F52F646BFFFFF
.  .  54456C07AAAAA4FCC5D61570826B96B26C70B4A581327D7B349CE6302F52F642B6EFE1
.  .  54456C07B6A214FCC5D6DDDDD26B96B26C70B4A581327D7B349CE6302F52F642B6EFE4
right
.  54456C07B6A214FCC5D6C570826BCCCCCC70B4A581327D7B349CE6302F52F642B6EFE3
.  54456C07B6A214FCC5D6C570826B96B26C70B4A5FFFFFD7B349CE6302F52F642BAAAAA
.  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CECCCCC52F643B6EFE3
.  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CE6302F52FEEEEEAAAB
.  54456C07B6A2BBBBB5D62570826B96B26C70B4A581327D7B349CE6302F52F642B6EFE2
.  54456C07B6A214FCC5D65570EEEEE6B26C70B4A581327D7B349CE6302F52F642BAAAAB
.  54456C07B6A214FCC5D66570826BFFFFFC70B4A581327D7B349CE6302F52F642BAAAAA
.  54456C07B6A214FCC5D6C570826B96B26C70BBBBBB327D7B349CE6302F52F632B6EFE2
.  54456C07B6A214FCC5D6C570826B96B26C70B4A58CCCCC7B349CE6302F52F643B6EFE3
.  54456C07B6A214FCC5D6C570826B96B26C70B4A581327D7B349CEFFFFF52F646BAAAAA
```
