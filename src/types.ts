/*
  from https://github.com/ethereumjs/rlp/blob/master/src/types.ts
*/

import BN from 'bn.js'

export type Input = Buffer | string | number | bigint | Uint8Array | BN | List | null

// Use interface extension instead of type alias to
// make circular declaration possible.
export interface List extends Array<Input> {}

export interface Decoded {
  data: Buffer | Buffer[]
  remainder: Buffer
}
