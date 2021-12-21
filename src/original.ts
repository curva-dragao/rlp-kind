import BN from "bn.js";

/*
 * from https://github.com/ethereumjs/rlp/blob/master/src/types.ts
 */

// export type Input = Buffer | string | number | bigint | Uint8Array | BN | List | null

// // Use interface extension instead of type alias to
// // make circular declaration possible.
// export interface List extends Array<Input> {}

// export interface Decoded {
//   data: Buffer | Buffer[]
//   remainder: Buffer
// }

export type Input =
  | Buffer
  | string
  | number
  | bigint
  | Uint8Array
  | BN
  | null;

export type InputTree =
  | InputTree[]
  | Input;

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
  }
  throw new Error("invalid type");
}

/**
 * Parse integers. Check if there is no leading zeros
 * @param v The value to parse
 * @param base The base to parse the integer into
 */
 function safeParseInt(v: string, base: number): number {
  if (v[0] === '0' && v[1] === '0') {
    throw new Error('invalid RLP: extra zeros')
  }

  return parseInt(v, base)
}

/**
 * Get the length of the RLP input
 * @param input
 * @returns The length of the input or an empty Buffer if no input
 */
export function getLength(input: Input): Buffer | number {
  if (!input || (input as any).length === 0) {
    return Buffer.from([])
  }

  const inputBuffer = toBuffer(input)
  const firstByte = inputBuffer[0]

  if (firstByte <= 0x7f) {
    return inputBuffer.length
  } else if (firstByte <= 0xb7) {
    return firstByte - 0x7f
  } else if (firstByte <= 0xbf) {
    return firstByte - 0xb6
  } else if (firstByte <= 0xf7) {
    // a list between  0-55 bytes long
    return firstByte - 0xbf
  } else {
    // a list  over 55 bytes long
    const llength = firstByte - 0xf6
    const length = safeParseInt(inputBuffer.slice(1, llength).toString('hex'), 16)
    return llength + length
  }
}
