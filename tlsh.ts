import { bit_pair_diff_table, v_table } from "./tables.ts";

const LOG1_5 = 0.4054651;
const LOG1_3 = 0.26236426;
const LOG1_1 = 0.095310180;
const SALT = new Uint8Array([2, 3, 5, 7, 11, 13]);
const CODE_SIZE = 32;
const WINDOW_LENGTH = 5;
const EFF_BUCKETS = 128;
const NUM_BUCKETS = 256;
const MIN_INPUT_SIZE = 50;
const HASH_LEN = 70;

class ChunkState {
    buckets = new Uint8Array(NUM_BUCKETS).fill(0);
    chunk = new Uint8Array(WINDOW_LENGTH).fill(0);
    store = new Uint8Array(2).fill(0);
    chunk3 = new Uint8Array(3).fill(0);
    checksum = 0;
    fileSize = 0;

    constructor(buf: Uint8Array) {
        this.chunk = Uint8Array.from(buf.slice(0, 5)).reverse();

        this.fileSize = WINDOW_LENGTH - 1;

        // loop through the buffer and calculate the pearson hash for
        // the contents of each window as it moves over the buffer.
        for (let i = WINDOW_LENGTH; i < buf.length; i++) {
            this.chunk3[0] = this.chunk[0];
            this.chunk3[1] = this.chunk[1];
            this.chunk3[2] = this.checksum;

            this.checksum = this.pearsonHash(0, this.chunk3[0], this.chunk3[1], this.chunk3[2]);

            this.chunk3[2] = this.chunk[2];
            this.buckets[this.pearsonHash(SALT[0], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            this.chunk3[2] = this.chunk[3];
            this.buckets[this.pearsonHash(SALT[1], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            this.chunk3[1] = this.chunk[2];
            this.buckets[this.pearsonHash(SALT[2], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            this.chunk3[2] = this.chunk[4];
            this.buckets[this.pearsonHash(SALT[3], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            this.chunk3[1] = this.chunk[1];
            this.buckets[this.pearsonHash(SALT[4], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            this.chunk3[1] = this.chunk[3];
            this.buckets[this.pearsonHash(SALT[5], this.chunk3[0], this.chunk3[1], this.chunk3[2])]++;

            const temp1 = this.chunk[0];
            const temp2 = this.chunk[1];
            const temp3 = this.chunk[2];
            const temp4 = this.chunk[3];
            this.chunk[1] = temp1;
            this.chunk[2] = temp2;
            this.chunk[3] = temp3;
            this.chunk[4] = temp4;

            this.chunk[0] = buf[i];
            this.fileSize++;
        }
    }

    private pearsonHash(salt: number, c1: number, c2: number, c3: number): number {
        let h = 0;
        h = v_table[h ^ salt];
        h = v_table[h ^ c1];
        h = v_table[h ^ c2];
        h = v_table[h ^ c3];
        return h;
    }
}

export class Tlsh {
    checksum = 0;
    lValue = 0;
    qRatio = 0;
    q1Ratio = 0;
    q2Ratio = 0;
    code: Uint8Array = new Uint8Array(CODE_SIZE).fill(0);
    complete = false;

    /**
     * creates a new TLSH hash object with the provided bytes
     */
    constructor(buf?: Uint8Array) {
        if (buf == undefined) {
            return;
        }

        if (buf.length < MIN_INPUT_SIZE) {
            return;
        }

        const state = new ChunkState(buf);

        this.checksum = state.checksum;
        this.lValue = this.lValueCalc(buf.length);

        const tempBuckets = new Uint8Array(NUM_BUCKETS).fill(0);
        for (let i = 0; i < NUM_BUCKETS; i++) {
            tempBuckets[i] = state.buckets[i];
        }

        const [q1, q2, q3] = this.quartilePoints(tempBuckets);
        if (q3 == 0) {
            return;
        }

        this.q1Ratio = (q1 * 100 / q3) % 16;
        this.q2Ratio = (q2 * 100 / q3) % 16;
        this.qRatio = ((this.q1Ratio & 0xf) << 4) | (this.q2Ratio & 0xf);

        for (let i = 0; i < CODE_SIZE; i++) {
            let h = 0;
            for (let j = 0; j < 4; j++) {
                const k = state.buckets[4 * i + j];
                if (q3 < k) {
                    h += 3 << (j * 2);
                } else if (q2 < k) {
                    h += 2 << (j * 2);
                } else if (q1 < k) {
                    h += 1 << (j * 2);
                }
            }

            this.code[(CODE_SIZE - 1) - i] = h;
        }

        this.complete = true;
    }

    /**
     * Returns a new TLSH object given a valid TLSH hash value
     * @param str - TLSH hash value
     * @returns the Tlsh object representation
     */
    static from(str: string): Tlsh {
        if (str.length != HASH_LEN && str.length != HASH_LEN + 2) {
            throw new Error("invalid TLSH hash value");
        }

        let raw = str.toUpperCase();
        if (raw.length == HASH_LEN + 2) {
            if (raw[0] == "T" && raw[1] == "2") {
                raw = raw.substring(2);
            } else {
                throw new Error("invalid TLSH hash value, non-supported version or T-type");
            }
        }

        const bytes: Array<number> = (raw.match(/.{1,2}/g) || []).map((x) => {
            return parseInt(x, 16);
        });

        if (bytes.length != HASH_LEN / 2) {
            throw new Error("unable to extract bytes of hash correctly");
        }

        const checksum = Tlsh.swapByte(bytes[0]);
        const lValue = Tlsh.swapByte(bytes[1]);
        const qRatio = Tlsh.swapByte(bytes[2]);

        const q1Ratio = (qRatio >> 4) & 0xf;
        const q2Ratio = qRatio & 0xf;

        const code = new Uint8Array(CODE_SIZE).fill(0);
        for (let i = 3; i < bytes.length; i++) {
            code[i - 3] = bytes[i];
        }

        const tlsh = new Tlsh();
        tlsh.checksum = checksum;
        tlsh.lValue = lValue;
        tlsh.qRatio = qRatio;
        tlsh.q1Ratio = q1Ratio;
        tlsh.q2Ratio = q2Ratio;
        tlsh.code = code;
        tlsh.complete = true;

        return tlsh;
    }

    /**
     * diff takes in a second Tlsh object and calculates the difference or distance between the two Tlsh objects.
     * @param b second Tlsh object
     * @returns number, the distance between the two Tlsh objects
     */
    diff(b: Tlsh): number {
        let diff = 0;

        const q1Diff = this.mod_diff(this.q1Ratio, b.q1Ratio, 16);
        if (q1Diff <= 1) {
            diff += q1Diff;
        } else {
            diff += (q1Diff - 1) * 12;
        }

        const q2Diff = this.mod_diff(this.q2Ratio, b.q2Ratio, 16);
        if (q2Diff <= 1) {
            diff += q2Diff;
        } else {
            diff += (q2Diff - 1) * 12;
        }

        if (this.checksum != b.checksum) {
            diff++;
        }

        diff += this.digest_distance(this.code, b.code);

        return diff;
    }

    /**
     * toString converts the Tlsh object into its string representation
     * @returns string
     */
    toString(): string {
        let buf = "";
        if (!this.complete) {
            return "TNULL";
        }

        buf = buf.concat(
            Tlsh.swapByte(this.checksum).toString(16).padStart(2, "0"),
        );
        buf = buf.concat(
            Tlsh.swapByte(this.lValue).toString(16).padStart(2, "0"),
        );
        buf = buf.concat(
            Tlsh.swapByte(this.qRatio).toString(16).padStart(2, "0"),
        );

        for (let i = 0; i < CODE_SIZE; i++) {
            buf = buf.concat(this.code[i].toString(16).padStart(2, "0"));
        }

        return buf.toUpperCase();
    }

    private mod_diff(x: number, y: number, R: number): number {
        let dl = 0;
        let dr = 0;

        if (y > x) {
            dl = y - x;
            dr = x + R - y;
        } else {
            dl = x - y;
            dr = y + R - x;
        }

        if (dl > dr) {
            return dr;
        } else {
            return dl;
        }
    }

    private digest_distance(x: Uint8Array, y: Uint8Array): number {
        let diff = 0;
        for (let i = 0; i < CODE_SIZE; i++) {
            diff += bit_pair_diff_table[x[i]][y[i]];
        }

        return diff;
    }

    static swapByte(input: number): number {
        let out = 0;
        out = ((input & 0xf0) >> 4) & 0x0f;
        out |= ((input & 0x0f) << 4) & 0xf0;
        return out;
    }

    private lValueCalc(len: number): number {
        let l = 0;

        if (len <= 656) {
            l = Math.floor(Math.log(len) / LOG1_5);
        } else if (len <= 3199) {
            l = Math.floor(Math.log(len) / LOG1_3 - 8.71777);
        } else {
            l = Math.floor(Math.log(len) / LOG1_1 - 62.5472);
        }

        return l;
    }

    private quartilePoints(buckets: Uint8Array): Uint8Array {
        let spl = 0;
        let spr = 0;
        let q1 = 0;
        let q2 = 0;
        let q3 = 0;

        const p1 = (EFF_BUCKETS / 4) - 1;
        const p2 = (EFF_BUCKETS / 2) - 1;
        const p3 = EFF_BUCKETS - (EFF_BUCKETS / 4) - 1;
        const end = EFF_BUCKETS - 1;
        const bucketsCopy = Uint8Array.from(buckets);

        const shortCutLeft = new Uint8Array(EFF_BUCKETS).fill(0);
        const shortCutRight = new Uint8Array(EFF_BUCKETS).fill(0);

        let l = 0;
        let r = 0;

        for (l = 0, r = end;;) {
            const ret = this.partition(bucketsCopy, l, r);

            if (ret > p2) {
                r = ret - 1;
                shortCutRight[spr] = ret;
                spr++;
            } else if (ret < p2) {
                l = ret + 1;
                shortCutLeft[spl] = ret;
                spl++;
            } else {
                q2 = bucketsCopy[p2];
                break;
            }
        }

        shortCutLeft[spl] = p2 - 1;
        shortCutRight[spr] = p2 + 1;

        for (let i = 0, l = 0; i <= spl; i++) {
            r = shortCutLeft[i];
            if (r > p1) {
                while (true) {
                    const ret = this.partition(bucketsCopy, l, r);
                    if (ret > p1) {
                        r = ret - 1;
                    } else if (ret < p1) {
                        l = ret + 1;
                    } else {
                        q1 = bucketsCopy[p1];
                        break;
                    }
                }
                break;
            } else if (r < p1) {
                l = r;
            } else {
                q1 = bucketsCopy[p1];
                break;
            }
        }

        for (let i = 0, r = end; i <= spr; i++) {
            l = shortCutRight[i];
            if (l < p3) {
                while (true) {
                    const ret = this.partition(bucketsCopy, l, r);
                    if (ret > p3) {
                        r = ret - 1;
                    } else if (ret < p3) {
                        l = ret + 1;
                    } else {
                        q3 = bucketsCopy[p3];
                        break;
                    }
                }
                break;
            } else if (l > p3) {
                r = l;
            } else {
                q3 = bucketsCopy[p3];
                break;
            }
        }
        return new Uint8Array([q1, q2, q3]);
    }

    private partition(buf: Uint8Array, left: number, right: number): number {
        if (left == right) {
            return left;
        }

        if (left + 1 == right) {
            if (buf[left] > buf[right]) {
                const temp = buf[right];
                buf[right] = buf[left];
                buf[left] = temp;
            }

            return left;
        }

        let ret = left;
        const pivot = (left + right) >> 1;
        const val = buf[pivot];

        buf[pivot] = buf[right];
        buf[right] = val;

        for (let i = left; i < right; i++) {
            if (buf[i] < val) {
                const temp = buf[i];
                buf[i] = buf[ret];
                buf[ret] = temp;
                ret++;
            }
        }

        buf[right] = buf[ret];
        buf[ret] = val;

        return ret;
    }
}

export class TreeNode {
    left: TreeNode | undefined;
    right: TreeNode | undefined;
    splitPoint: number = 0;
    splitKey: Tlsh | undefined;
    isLeaf: boolean = false;
    items: Array<Tlsh> = [];

    constructor(
        left: TreeNode | undefined,
        right: TreeNode | undefined,
        splitPoint: number,
        splitKey: Tlsh | undefined,
        isLeaf: boolean,
        items: Array<Tlsh>,
    ) {
        this.left = left;
        this.right = right;
        this.splitPoint = splitPoint;
        this.splitKey = splitKey;
        this.isLeaf = isLeaf;
        this.items = items;
    }
}

type SplitResult = {
    left: Array<Tlsh>;
    right: Array<Tlsh>;
    splitKey: Tlsh;
    splitPoint: number;
};

export class TlshTree {
    public size = 0;
    public numLeafs = 0;
    leafSize = 10;
    node: TreeNode;

    constructor(hashes: Array<string>, leafSize: number = 10) {
        const dedup: Map<string, boolean> = new Map();
        for (let i = 0; i < hashes.length; i++) {
            if (hashes[i].length != HASH_LEN && hashes[i].length != HASH_LEN + 2) {
                continue;
            }

            if (dedup.has(hashes[i])) {
                continue;
            } else {
                dedup.set(hashes[i], true);
            }
        }

        const tlshList = Array.from(dedup.keys()).map((x) => Tlsh.from(x));
        this.size = tlshList.length;
        this.leafSize = leafSize;
        this.node = this.build(tlshList, leafSize);
    }

    /**
     * dump will create a pretty string representation of the entire tree
     * @returns string
     */
    dump(): string {
        let out = "";
        const _dump = (space: string, node: TreeNode) => {
            if (node.isLeaf) {
                for (let i = 0; i < node.items.length; i++) {
                    out = out.concat(space + node.items[i].toString() + "\n");
                }
            } else {
                out = out.concat(space + "left\n");
                if (node.left == undefined) {
                    throw new Error("unexpected empty left node");
                }
                _dump(space + ".  ", node.left);

                out = out.concat(space + "right\n");
                if (node.right == undefined) {
                    throw new Error("unexpected empty right node");
                }
                _dump(space + ".  ", node.right);
            }
        };

        _dump("", this.node);

        return out;
    }

    /**
     * isPresent will say if a hash is present in the tree within a
     * certain distance. This will be slightly faster than
     * searchTraverse because it stops once it finds one match.
     * @param tlsh is the value to find nearest neighbors for
     * @param distance is the threshold for what is a close neighbor
     * @returns a boolean, true if the hash is present within the
     * given distance
     */
    isPresent(hash: string, distance: number): boolean {
        const _traverse = (tlsh: Tlsh, distance: number, node: TreeNode): boolean => {
            if (node.isLeaf) {
                for (let i = 0; i < node.items.length; i++) {
                    if (tlsh.diff(node.items[i]) <= distance) {
                        return true;
                    }
                }

                return false;
            }

            if (node.splitKey == undefined || node.left == undefined || node.right == undefined) {
                return false;
            }

            if (tlsh.diff(node.splitKey) < node.splitPoint) {
                return _traverse(tlsh, distance, node.left);
            } else {
                return _traverse(tlsh, distance, node.right);
            }
        };

        const tlsh = Tlsh.from(hash);
        return _traverse(tlsh, distance, this.node);
    }

    /**
     * search will find the nearest `distance` hashes from
     * the input hash. The returned array is also sorted with the
     * closest matches first.
     * @param node is the current node in the tree
     * @param tlsh is the value to find nearest neighbors for
     * @param distance is the threshold for what is a close neighbor
     * @returns a sorted list of hashes.
     */
    search(hash: string, distance: number): Array<string> {
        const _search = (node: TreeNode, tlsh: Tlsh, distance: number): string[] => {
            if (node.isLeaf) {
                const out: [string, number][] = [];
                for (let i = 0; i < node.items.length; i++) {
                    const diff = tlsh.diff(node.items[i]);
                    if (diff <= distance) {
                        out.push([node.items[i].toString(), diff]);
                    }
                }

                out.sort((a, b) => a[1] - b[1]);
                return out.map((xs) => xs[0]);
            }

            if (node.splitKey == undefined || node.left == undefined || node.right == undefined) {
                throw new Error("unexpected error traversing the tree, splitKey, left, or right is undefiend");
            }

            if (tlsh.diff(node.splitKey) < node.splitPoint) {
                return _search(node.left, tlsh, distance);
            } else {
                return _search(node.right, tlsh, distance);
            }
        };

        const tlsh = Tlsh.from(hash);
        return _search(this.node, tlsh, distance);
    }

    /**
     * build is the entry point for building the Tlsh tree
     */
    private build(tlshList: Array<Tlsh>, leafSize: number): TreeNode {
        const splitResult = this.splitNodes(tlshList, leafSize);
        if (splitResult == undefined) {
            this.numLeafs++;
            return new TreeNode(undefined, undefined, 0, undefined, true, tlshList);
        }

        const left = this.build(splitResult.left, leafSize);
        const right = this.build(splitResult.right, leafSize);

        return new TreeNode(left, right, splitResult.splitPoint, splitResult.splitKey, false, []);
    }

    /** splitNodes will take an array of Tlsh and find an optimial split point such that each partition is at least
     * `minSplitSize`.
     */
    private splitNodes(tlshList: Array<Tlsh>, leafSize: number): SplitResult | undefined {
        if (tlshList.length <= leafSize) {
            return undefined;
        }

        let splitPoint = 5;
        const jumpSize = 5;
        const minSplitSize = tlshList.length * 0.3;

        for (let i = 0; i < tlshList.length; i++) {
            const splitKey = tlshList[i];
            const left = [];
            const right = [];

            for (let j = 0; j < tlshList.length; j++) {
                const diff = splitKey.diff(tlshList[j]);
                if (diff <= splitPoint) {
                    left.push(tlshList[j]);
                } else {
                    right.push(tlshList[j]);
                }
            }

            if (left.length > minSplitSize && right.length > minSplitSize) {
                return { left, right, splitKey, splitPoint };
            }

            splitPoint += jumpSize;
        }

        return undefined;
    }
}
