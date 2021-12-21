import type { Input, InputTree } from "./original";
import { toBuffer } from "./original";

import type { List, RLPData, RLPTree } from "./rlp_typed";
import rlp_lib from "./rlp_typed";

export { getLength } from "./original";

/* tslint:disable: variable-name */
const List$cons = rlp_lib["List.cons"];
const List$nil = rlp_lib["List.nil"];
const Ether$RLP$node = rlp_lib["Ether.RLP.node"];
const Ether$RLP$encode = rlp_lib["Ether.RLP.encode"];
const Ether$RLP$decode = rlp_lib["Ether.RLP.decode"];
const Ether$RLP$decode$check = rlp_lib["Ether.RLP.decode.check"];
/* tslint:enable */

type BufferTree = Buffer | BufferTree[];

function to_list<T>(array: T[]): List<T> {
  return array.reduceRight((a, b) => List$cons(b)(a), List$nil);
}

function to_array<T>(list: List<T>): T[] {
  const array = [];
  while (list._ === "List.cons") {
    array.push(list.head);
    list = list.tail;
  }
  return array;
}

function buf_tree_to_internal_tree(obj: BufferTree): RLPTree {
  if (Array.isArray(obj)) {
    return Ether$RLP$node(to_list(obj.map(buf_tree_to_internal_tree)));
  } else {
    const arr = Array.from(obj);
    const node: RLPData = {
      _: "Ether.RLP.data",
      value: to_list(arr),
    };
    return node;
  }
}

function internal_tree_to_buf_tree(tree: RLPTree): BufferTree {
  if (tree._ === "Ether.RLP.node") {
    const trees = [];
    let child = tree.child;
    while (child._ === "List.cons") {
      trees.push(internal_tree_to_buf_tree(child.head));
      child = child.tail;
    }
    return trees;
  } else {
    return Buffer.from(to_array(tree.value));
  }
}

function input_to_buf_tree(input: InputTree): BufferTree {
  if (Array.isArray(input)) {
    return input.map(input_to_buf_tree);
  } else {
    return toBuffer(input);
  }
}

export function encode(input: InputTree): Buffer {
  const input_tree = input_to_buf_tree(input);
  const rlp_tree = buf_tree_to_internal_tree(input_tree);
  const encoded = Ether$RLP$encode(rlp_tree);
  const bytes_arr = to_array(encoded);
  return Buffer.from(bytes_arr);
}

export function decode(input: Input): BufferTree {
  if (!input || (input as any).length === 0) {
    return Buffer.from([]);
  }
  const input_buffer = toBuffer(input);
  const bytes_arr = Array.from(input_buffer);
  const bytes_list = to_list(bytes_arr);
  if (!Ether$RLP$decode$check(bytes_list)) {
    throw new Error("invalid RLP encoding");
  }
  const rlp_tree = Ether$RLP$decode(bytes_list);
  const result = internal_tree_to_buf_tree(rlp_tree);
  return result;
}
