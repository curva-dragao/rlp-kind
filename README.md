# rlp-kind

[Recursive Length Prefix](https://eth.wiki/en/fundamentals/rlp) Encoding for
Node.js wrapper written in [Kind](https://github.com/kind-lang/Kind).

With the [underlying
implementation](https://github.com/kind-lang/Kind/blob/master/base/Ether/RLP/encode.kind)
we provide a
[proof](https://github.com/kind-lang/Kind/blob/master/base/Ether/RLP/encode_identity.kind)
to ensure that all encoded RLPs will be correctly decoded.

[DEMO](http://uwu.tech/App.RLP).

## Install

```sh
npm install --save rlp-kind
```
```sh
yarn add rlp-kind
```

Install globally if you want to use the CLI:

```sh
npm install -g rlp-kind
```

```sh
yarn global add rlp-kind
```

## Usage

### API

```js
import * as assert from 'assert'
import * as rlp from 'rlp'

const nestedList = [[], [[]], [[], [[]]]]
const encoded = rlp.encode(nestedList)
const decoded = rlp.decode(encoded)
assert.deepEqual(nestedList, decoded)
```

#### `encode`

`encode(input: InputTree): Buffer`

RLP encodes a tree of data (`Buffer`s, `String`s etc) and returns a `Buffer`.

#### `decode`

`decode(input: Input): BufferTree`

Decodes an RLP encoded `Buffer`, `Array` etc and returns a tree of `Buffer`s.

The input will be converted to a buffer.

#### Types

```ts
type Input =
  | Buffer
  | string
  | number
  | bigint
  | Uint8Array
  | BN
  | null

type InputTree =
  | InputTree[]
  | Input
```

```ts
type BufferTree = Buffer | BufferTree[]
```

### CLI

```sh
$ rlp encode '[ 5 ]'
c105
```

```sh
$ rlp decode '0xc105'
[ '05' ]
```
