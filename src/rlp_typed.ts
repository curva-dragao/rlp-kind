// TODO: replace with `.d.ts` declaration?
const rlp_lib: RLPLibTypes = require("./rlp.js");

export type U8 = number;
export type Nat = bigint;

export type List<T> = Nil | Cons<T>;
export type Nil = { _: "List.nil" };
export type Cons<T> = { _: "List.cons"; head: T; tail: List<T>; };

export type Bytes = List<U8>;

export type RLPTree = RLPData | RLPNode;

export type RLPData = { _: "Ether.RLP.data"; value: List<U8> };
export type RLPNode = { _: "Ether.RLP.node"; child: List<RLPTree> };

export interface RLPLibTypes {
  "List.cons": <T>(head: T) => (tail: List<T>) => List<T>;
  "List.nil": List<any>;
  "Ether.RLP.data": (value: Bytes) => RLPTree;
  "Ether.RLP.node": (child: List<RLPTree>) => RLPTree;
  "Ether.RLP.encode": (tree: RLPTree) => Bytes;
  "Ether.RLP.decode": (bytes: Bytes) => RLPTree;
}

export default rlp_lib;
