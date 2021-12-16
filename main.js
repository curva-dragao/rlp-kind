var RLP = require("./rlp.js");

function list(array) {
  return array.reduceRight((a,b) => RLP["List.cons"](b)(a), RLP["List.nil"]);
}

function array(list) {
  var array = [];
  while (list._ === "List.cons") {
    array.push(list.head);
    list = list.tail;
  }
  return array;
}

function json_to_tree(json) {
  if (typeof json === "string") {
    if (json.length % 2 !== 0 || !/^[0-9a-f]*$/.test(json)) { 
      throw "Invalid hex.";
    }
    var bytes = [];
    for (var i = 0; i < json.length; i += 2) {
      bytes.push(parseInt(json.slice(i, i+2), 16));
    }
    return RLP["RLP.data"](list(bytes));
  } else {
    return RLP["RLP.node"](list(json.map(json_to_tree)));
  }
}

function byte_to_hex(val) {
  return ("00" + val.toString(16)).slice(-2);
}

function tree_to_json(tree) {
  if (tree._ === "RLP.node") {
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

function encode(json) {
  var tree = json_to_tree(json);
  var vals = array(RLP["RLP.encode"](tree));
  console.log(vals);
  return vals.map(byte_to_hex).join("");
}

function decode(code) {
  var tree = RLP["RLP.decode"](json_to_tree(code).value);
  var json = tree_to_json(tree);
  return json;
}

var a = ["905060"];
var b = encode(a);
console.log(b);
console.log(decode(b));

//console.log(JSON.stringify(json(tree(json(tree(["010203", "77aa", ["99"], "88"]))))));


//var tree = RLP["RLP.node"](RLP["List.nil"])
//var code = RLP["RLP.encode"](tree);
//console.log(tree);
//
//console.log(array(list([1,2,3])));

//console.log(code);



//console.log(RLP)
