import type { Input } from "./original";
import { toBuffer } from "./original";

import type { List, RLPData, RLPTree } from "./rlp_typed";
import rlp_lib from "./rlp_typed";

const List$cons = rlp_lib["List.cons"];
const List$nil = rlp_lib["List.nil"];
const Ether$RLP$node = rlp_lib["Ether.RLP.node"];
const Ether$RLP$encode = rlp_lib["Ether.RLP.encode"];
const Ether$RLP$decode = rlp_lib["Ether.RLP.decode"];

type RLPObj = Buffer | RLPObj[];

function to_list<T>(array: T[]): List<T> {
  return array.reduceRight((a, b) => List$cons(b)(a), List$nil);
}

function to_array<T>(list: List<T>) {
  var array = [];
  while (list._ === "List.cons") {
    array.push(list.head);
    list = list.tail;
  }
  return array;
}

function obj_to_rlp_tree(obj: RLPObj): RLPTree {
  if (Array.isArray(obj)) {
    return Ether$RLP$node(to_list(obj.map(obj_to_rlp_tree)));
  } else {
    const arr = Array.from(obj);
    const node: RLPData = {
      _: "Ether.RLP.data",
      value: to_list(arr),
    };
    return node;
  }
}

function rlp_tree_to_obj(tree: RLPTree): RLPObj {
  if (tree._ === "Ether.RLP.node") {
    var trees = [];
    var child = tree.child;
    while (child._ === "List.cons") {
      trees.push(rlp_tree_to_obj(child.head));
      child = child.tail;
    }
    return trees;
  } else {
    return Buffer.from(to_array(tree.value));
  }
}

function input_to_rlp_obj(input: Input): RLPObj {
  if (Array.isArray(input)) {
    return input.map(input_to_rlp_obj);
  } else {
    return toBuffer(input);
  }
}

export function encode(input: Input): Buffer {
  const input_obj = input_to_rlp_obj(input);
  const rlp_tree = obj_to_rlp_tree(input_obj);
  const encoded = Ether$RLP$encode(rlp_tree);
  const bytes_arr = to_array(encoded);
  return Buffer.from(bytes_arr);
}

export function decode(input: Input): RLPObj {
  if (!input || (input as any).length === 0) {
    return Buffer.from([]);
  }

  const input_buffer = toBuffer(input);
  const arr = Array.from(input_buffer);
  const rlp_tree = Ether$RLP$decode(to_list(arr));
  const rlp_json = rlp_tree_to_obj(rlp_tree);

  return rlp_json;
}
