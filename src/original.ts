import BN from "bn.js";

/*
 * from https://github.com/ethereumjs/rlp/blob/master/src/types.ts
 */

export type Input = Buffer | string | number | bigint | Uint8Array | BN | List | null

// Use interface extension instead of type alias to
// make circular declaration possible.
export interface List extends Array<Input> {}

// export interface Decoded {
//   data: Buffer | Buffer[]
//   remainder: Buffer
// }

/*
 * from https://github.com/ethereumjs/rlp/blob/master/src/index.ts
 */

/** Check if a string is prefixed by 0x */
function isHexPrefixed(str: string): boolean {
  return str.slice(0, 2) === "0x";
}

/** Removes 0x from a given String */
function stripHexPrefix(str: string): string {
  if (typeof str !== "string") {
    return str;
  }
  return isHexPrefixed(str) ? str.slice(2) : str;
}

/** Transform an integer into its hexadecimal value */
function intToHex(integer: number | bigint): string {
  if (integer < 0) {
    throw new Error("Invalid integer as argument, must be unsigned!");
  }
  const hex = integer.toString(16);
  return hex.length % 2 ? `0${hex}` : hex;
}

/** Pad a string to be even */
function padToEven(a: string): string {
  return a.length % 2 ? `0${a}` : a;
}

/** Transform an integer into a Buffer */
function intToBuffer(integer: number | bigint): Buffer {
  const hex = intToHex(integer);
  return Buffer.from(hex, "hex");
}
/** Transform anything into a Buffer */
export function toBuffer(v: Input): Buffer {
  if (!Buffer.isBuffer(v)) {
    if (typeof v === "string") {
      if (isHexPrefixed(v)) {
        return Buffer.from(padToEven(stripHexPrefix(v)), "hex");
      } else {
        return Buffer.from(v);
      }
    } else if (typeof v === "number" || typeof v === "bigint") {
      if (!v) {
        return Buffer.from([]);
      } else {
        return intToBuffer(v);
      }
    } else if (v === null || v === undefined) {
      return Buffer.from([]);
    } else if (v instanceof Uint8Array) {
      return Buffer.from(v as any);
    } else if (BN.isBN(v)) {
      // converts a BN to a Buffer
      return Buffer.from(v.toArray());
    } else {
      throw new Error("invalid type");
    }
  }
  return v;
}

export function encodeLength(len: number, offset: number): Buffer {
  if (len < 56) {
    return Buffer.from([len + offset])
  } else {
    const hexLength = intToHex(len)
    const lLength = hexLength.length / 2
    const firstByte = intToHex(offset + 55 + lLength)
    return Buffer.from(firstByte + hexLength, 'hex')
  }
}
