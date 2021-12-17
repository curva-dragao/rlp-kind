import { JSONValue } from "./json"
import rlp_lib from "./rlp_typed"
import type {List, U8, RLP} from "./rlp_typed"

const List$cons = rlp_lib["List.cons"];
const List$nil = rlp_lib["List.nil"];
const Ether$RLP$data = rlp_lib["Ether.RLP.data"];
const Ether$RLP$node = rlp_lib["Ether.RLP.node"];
const Ether$RLP$encode = rlp_lib["Ether.RLP.encode"];
const Ether$RLP$decode = rlp_lib["Ether.RLP.decode"];

function to_list<T>(array: T[]): List<T> {
  return array.reduceRight(((a,b) => List$cons(b)(a)), List$nil);
}

function to_array<T>(list: List<T>) {
  var array = [];
  while (list._ === "List.cons") {
    array.push(list.head);
    list = list.tail;
  }
  return array;
}

function json_to_tree(json: JSONValue): RLP {
  if (typeof json === "string") {
    if (json.length % 2 !== 0 || !/^[0-9a-f]*$/.test(json)) {
      throw "Invalid hex.";
    }
    var bytes = [];
    for (var i = 0; i < json.length; i += 2) {
      bytes.push(parseInt(json.slice(i, i+2), 16));
    }
    return Ether$RLP$data(to_list(bytes));
  } else {
    if (!Array.isArray(json)) throw "FAILURE";
    return Ether$RLP$node(to_list(json.map(json_to_tree)));
  }
}

function byte_to_hex(val: U8) {
  return ("00" + val.toString(16)).slice(-2);
}

function tree_to_json(tree: RLP): JSONValue {
  if (tree._ === "Ether.RLP.node") {
    var trees = [];
    var child = tree.child;
    while (child._ === "List.cons") {
      trees.push(tree_to_json(child.head));
      child = child.tail;
    }
    return trees;
  } else {
    var string = "";
    var value = tree.value;
    while (value._ === "List.cons") {
      string += byte_to_hex(value.head);
      value = value.tail;
    }
    return string;
  }
}

function encode(json: JSONValue) {
  var tree = json_to_tree(json);
  var vals = to_array(Ether$RLP$encode(tree));
  console.log(vals);
  return vals.map(byte_to_hex).join("");
}

function decode(code: JSONValue) {
  var tree = Ether$RLP$decode((json_to_tree(code) as any).value);
  var json = tree_to_json(tree);
  return json;
}

// ==== //

var a = [[[[[]],[]],[[]],[]],[[[]],[]],[[]],[]];
var b = encode(a);
console.log("encoded:", b);
console.log("decoded:", decode(b));

//console.log(JSON.stringify(json(tree(json(tree(["010203", "77aa", ["99"], "88"]))))));

//var tree = RLP["RLP.node"](RLP["List.nil"])
//var code = RLP["RLP.encode"](tree);
//console.log(tree);
//
//console.log(array(list([1,2,3])));

//console.log(code);

//console.log(RLP)
