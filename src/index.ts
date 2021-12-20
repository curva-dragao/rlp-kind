import type { Input } from "./original";
import { toBuffer } from "./original";

import rlp_lib from "./rlp_typed";
import type { List, RLP, RLPData } from "./rlp_typed";

const List$cons = rlp_lib["List.cons"];
const List$nil = rlp_lib["List.nil"];
// const Ether$RLP$data = rlp_lib["Ether.RLP.data"];
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

function obj_to_rlp_tree(obj: RLPObj): RLP {
  if (typeof obj === "string") {
    // if (json.length % 2 !== 0 || !/^[0-9a-f]*$/.test(json)) {
    //   throw "Invalid hex.";
    // }
    // var bytes = [];
    // for (var i = 0; i < json.length; i += 2) {
    //   bytes.push(parseInt(json.slice(i, i + 2), 16));
    // }
    // return Ether$RLP$data(to_list(bytes));
  }
  if (Array.isArray(obj)) {
    if (!Array.isArray(obj)) throw "FAILURE";
    return Ether$RLP$node(to_list(obj.map(obj_to_rlp_tree)));
  } else {
    // const arr = Array.prototype.slice.call(obj, 0);
    const arr = Array.from(obj);
    const node: RLPData = {
      _: "Ether.RLP.data",
      value: to_list(arr),
    };
    return node;
  }
}

// function byte_to_hex(val: U8) {
//   return ("00" + val.toString(16)).slice(-2);
// }

function rlp_tree_to_obj(tree: RLP): RLPObj {
  if (tree._ === "Ether.RLP.node") {
    var trees = [];
    var child = tree.child;
    while (child._ === "List.cons") {
      trees.push(rlp_tree_to_obj(child.head));
      child = child.tail;
    }
    return trees;
  } else {
    // var string = "";
    // var value = tree.value;
    // while (value._ === "List.cons") {
    //   string += byte_to_hex(value.head);
    //   value = value.tail;
    // }
    // return string;
    return Buffer.from(to_array(tree.value));
  }
}

// function old_encode(json: JSONValue) {
//   var tree = obj_to_rlp_tree(json);
//   var vals = to_array(Ether$RLP$encode(tree));
//   console.log(vals);
//   return vals.map(byte_to_hex).join("");
// }

// function old_decode(code: JSONValue) {
//   var tree = Ether$RLP$decode((obj_to_rlp_tree(code) as any).value);
//   var json = rlp_tree_to_obj(tree);
//   return json;
// }

function input_to_rlp_obj(input: Input): RLPObj {
  if (Array.isArray(input)) {
    return input.map(input_to_rlp_obj);
  } else {
    return toBuffer(input);
  }
}

function encode(input: Input): Buffer {
  // var tree = obj_to_rlp_tree(json);
  // var vals = to_array(Ether$RLP$encode(tree));
  // console.log(vals);
  // return vals.map(byte_to_hex).join("");

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

// ==== //

// ==== //

var a = [[[[[]], []], [[]], []], [[[]], []], [[]], []];
var b = encode(a);
console.log("encoded:", b);
console.log("decoded:", decode(b));

// console.log(
//   // JSON.stringify(
//     rlp_tree_to_obj(
//       obj_to_rlp_tree(
//         rlp_tree_to_obj(
//           obj_to_rlp_tree(input_to_rlp_obj(["010203", "77aa", ["99"], "88"])),
//         ),
//       ),
//     ),
//   // ),
// );
