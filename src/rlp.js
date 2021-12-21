module.exports = (function (){
  function word_to_u8(w) {
    var u = 0;
    for (var i = 0; i < 8; ++i) {
      u = u | (w._ === 'Word.i' ? 1 << i : 0);
      w = w.pred;
    };
    return u;
  };
  function u8_to_word(u) {
    var w = {_: 'Word.e'};
    for (var i = 0; i < 8; ++i) {
      w = {_: (u >>> (8-i-1)) & 1 ? 'Word.i' : 'Word.o', pred: w};
    };
    return w;
  };
  function word_to_u16(w) {
    var u = 0;
    for (var i = 0; i < 16; ++i) {
      u = u | (w._ === 'Word.i' ? 1 << i : 0);
      w = w.pred;
    };
    return u;
  };
  function u16_to_word(u) {
    var w = {_: 'Word.e'};
    for (var i = 0; i < 16; ++i) {
      w = {_: (u >>> (16-i-1)) & 1 ? 'Word.i' : 'Word.o', pred: w};
    };
    return w;
  };
  function u16_to_bits(x) {
    var s = '';
    for (var i = 0; i < 16; ++i) {
      s = (x & 1 ? '1' : '0') + s;
      x = x >>> 1;
    }
    return s;
  };
  var list_length = list => {
    var len = 0;
    while (list._ === 'List.cons') {
      len += 1;
      list = list.tail;
    };
    return BigInt(len);
  };
  const inst_unit = x=>x(null);
  const elim_unit = (x=>{var $1 = (()=>c0=>{var self = x;switch("unit"){case 'unit':var $0 = c0;return $0;};})();return $1;});
  const inst_bool = x=>x(true)(false);
  const elim_bool = (x=>{var $4 = (()=>c0=>c1=>{var self = x;if (self) {var $2 = c0;return $2;} else {var $3 = c1;return $3;};})();return $4;});
  const inst_nat = x=>x(0n)(x0=>1n+x0);
  const elim_nat = (x=>{var $8 = (()=>c0=>c1=>{var self = x;if (self===0n) {var $5 = c0;return $5;} else {var $6=(self-1n);var $7 = c1($6);return $7;};})();return $8;});
  const inst_u8 = x=>x(x0=>word_to_u8(x0));
  const elim_u8 = (x=>{var $11 = (()=>c0=>{var self = x;switch('u8'){case 'u8':var $9=u8_to_word(self);var $10 = c0($9);return $10;};})();return $11;});
  const inst_u16 = x=>x(x0=>word_to_u16(x0));
  const elim_u16 = (x=>{var $14 = (()=>c0=>{var self = x;switch('u16'){case 'u16':var $12=u16_to_word(self);var $13 = c0($12);return $13;};})();return $14;});
  const inst_string = x=>x('')(x0=>x1=>(String.fromCharCode(x0)+x1));
  const elim_string = (x=>{var $19 = (()=>c0=>c1=>{var self = x;if (self.length===0) {var $15 = c0;return $15;} else {var $16=self.charCodeAt(0);var $17=self.slice(1);var $18 = c1($16)($17);return $18;};})();return $19;});
  var run = (p) => {
    if (typeof window === 'undefined') {      var rl = eval("require('readline')").createInterface({input:process.stdin,output:process.stdout,terminal:false});
      var fs = eval("require('fs')");
      var pc = eval("process");
      var ht = eval("require('http')");
      var hs = eval("require('https')");
      var dg = eval("require('dgram')");
    } else {
      var rl = {question: (x,f) => f(''), close: () => {}};
      var fs = {readFileSync: () => ''};
      var pc = {exit: () => {}, argv: []};
      var ht = null;
      var hs = null;
      var dg = null;
    };
    var lib = {rl,fs,pc,ht,hs,dg};
    return run_io(lib,p)
      .then((x) => { rl.close(); return x; })
      .catch((e) => { rl.close(); throw e; });
  };
  var set_file = (lib, param) => {
    var path = '';
    for (var i = 0; i < param.length && param[i] !== '='; ++i) {
      path += param[i];
    };
    var data = param.slice(i+1);
    lib.fs.mkdirSync(path.split('/').slice(0,-1).join('/'),{recursive:true});
    lib.fs.writeFileSync(path,data);
    return '';
  };
  var del_file = (lib, param) => {
    try {
      lib.fs.unlinkSync(param);
      return '';
    } catch (e) {
      if (e.message.indexOf('EPERM') !== -1) {
        lib.fs.rmdirSync(param);
        return '';
      } else {
        throw e;
      }
    }
  };
  var get_file = (lib, param) => {
    return lib.fs.readFileSync(param, 'utf8');
  }
  var get_dir = (lib, param) => {
    return lib.fs.readdirSync(param).join(';');
  };
  var get_file_mtime = (lib, param) => {
    return String(lib.fs.statSync(param).mtime.getTime());
  };
  var request = (lib, param) => {
    if (typeof fetch === 'undefined') {
      return new Promise((res,err) => {
        (/^https/.test(param)?lib.hs:lib.ht).get(param, r => {
          let data = '';
          r.on('data', chunk => { data += chunk; });
          r.on('end', () => res(data));
        }).on('error', e => res(''));
      });
    } else {
      return fetch(param).then(res => res.text()).catch(e => '');
    }
  }
  let PORTS = {};
  function init_udp(lib, port_num) {
    return new Promise((resolve, reject) => {
      if (!PORTS[port_num]) {
        PORTS[port_num] = {socket: lib.dg.createSocket('udp4'), mailbox: []};
        PORTS[port_num].socket.bind(port_num);
        PORTS[port_num].socket.on('listening', () => resolve(PORTS[port_num]));
        PORTS[port_num].socket.on('message', (data, peer) => {
          var ip = peer.address;
          var port = peer.port;
          PORTS[port_num].mailbox.push({ip: peer.address, port: peer.port, data: data.toString('hex')});
        })
        PORTS[port_num].socket.on('error', (err) => {
          console.log('err');
          reject('UDP init error.');
        });
      } else {
        resolve(PORTS[port_num]);
      }
    });
  }
  async function send_udp(lib, port_num, to_ip, to_port_num, data) {
    var port = await init_udp(lib, port_num);
    port.socket.send(Buffer.from(data,'hex'), to_port_num, to_ip);
    return null;
  }
  async function recv_udp(lib, port_num) {
    var port = await init_udp(lib, port_num);
    var mailbox = port.mailbox;
    port.mailbox = [];
    return mailbox;
  }
  async function stop_udp(lib, port_num) {
    PORTS[port_num].socket.close();
    delete PORTS[port_num];
  }
  var file_error = e => {
    if (e.message.indexOf('NOENT') !== -1) {
      return '';
    } else {
      throw e;
    }
  };
  var io_action = {
    print: async (lib, param) => {
      console.log(param);
      return '';
    },
    put_string: async (lib, param) => {
      process.stdout.write(param);
      return '';
    },
    get_file: async (lib, param) => {
      try {
        return get_file(lib, param);
      } catch (e) {
        return file_error(e);
      }
    },
    set_file: async (lib, param) => {
      try {
        return set_file(lib, param)
      } catch (e) {
        return file_error(e);
      }
    },
    del_file: async (lib, param) => {
      try {
        return del_file(lib, param);
      } catch (e) {
        return file_error(e);
      }
    },
    get_dir: async (lib, param) => {
      try {
        return get_dir(lib, param);
      } catch (e) {
        return file_error(e);
      }
    },
    get_file_mtime: async (lib, param) => {
      try {
        return get_file_mtime(lib, param);
      } catch (e) {
        return file_error(e);
      }
    },
    get_time: async (lib, param) => {
      return String(Date.now());
    },
    exit: async (lib, param) => {
      lib.pc.exit();
      return '';
    },
    request: async (lib, param) => {
      return request(lib, param);
    },
    get_time: async (lib, param) => {
      return String(Date.now());
    },
    get_line: async (lib, param) => {
      return await new Promise((res,err) => {
        lib.rl.question(param, (line) => res(line));
      });
    },
    get_args: async (lib, param) => {
      return lib.pc.argv[2] || '';
    },
    init_udp: async (lib, param) => {
      try {
        await init_udp(lib, Number(param));
        return '';
      } catch (e) {
        return '';
      }
    },
    send_udp: async (lib, param) => {
      let [port_num, to_ip, to_port_num, data] = param.split(';');
      await send_udp(lib, Number(port_num), to_ip, Number(to_port_num), data);
      return '';
    },
    recv_udp: async (lib, param) => {
      var mailbox = await recv_udp(lib, Number(param));
      var reply = mailbox.map(x => x.ip + ',' + x.port + ',' + x.data).join(';');
      return reply;
    },
    stop_udp: async (lib, param) => {
      await stop_udp(lib, Number(param));
      return '';
    },
    sleep: async (lib, param) => {
      return await new Promise((resolve,reject) => {
        setTimeout(() => resolve(''), Number(param));
      });
    },
  };
  var run_io = async (lib, io, depth = 0) => {
    switch (io._) {
      case 'IO.end':
        return Promise.resolve(io.value);
      case 'IO.ask':
        var action = io_action[io.query];
        var answer = await action(lib, io.param);
        return await run_io(lib, io.then(answer), depth + 1);
      }
  };
  function List$cons$(_head$2,_tail$3){var $20 = ({_:'List.cons','head':_head$2,'tail':_tail$3});return $20;};
  const List$cons = x0=>x1=>List$cons$(x0,x1);
  const List$nil = ({_:'List.nil'});
  function Ether$RLP$data$(_value$1){var $21 = ({_:'Ether.RLP.data','value':_value$1});return $21;};
  const Ether$RLP$data = x0=>Ether$RLP$data$(x0);
  function Ether$RLP$node$(_child$1){var $22 = ({_:'Ether.RLP.node','child':_child$1});return $22;};
  const Ether$RLP$node = x0=>Ether$RLP$node$(x0);
  function List$(_A$1){var $23 = null;return $23;};
  const List = x0=>List$(x0);
  const Bool$false = false;
  const Bool$and = a0=>a1=>(a0&&a1);
  const Bool$true = true;
  const Nat$eql = a0=>a1=>(a0===a1);
  function Nat$succ$(_pred$1){var $24 = 1n+_pred$1;return $24;};
  const Nat$succ = x0=>Nat$succ$(x0);
  const List$length = a0=>(list_length(a0));
  const Nat$lte = a0=>a1=>(a0<=a1);
  const Nat$add = a0=>a1=>(a0+a1);
  const Nat$mul = a0=>a1=>(a0*a1);
  function Word$to_nat$(_word$2){var self = _word$2;switch(self._){case 'Word.o':var $26=self.pred;var $27 = (2n*Word$to_nat$($26));var $25 = $27;break;case 'Word.i':var $28=self.pred;var $29 = Nat$succ$((2n*Word$to_nat$($28)));var $25 = $29;break;case 'Word.e':var $30 = 0n;var $25 = $30;break;};return $25;};
  const Word$to_nat = x0=>Word$to_nat$(x0);
  const Nat$zero = 0n;
  const U8$to_nat = a0=>(BigInt(a0));
  function List$head_with_default$(_default$2,_xs$3){var self = _xs$3;switch(self._){case 'List.cons':var $32=self.head;var $33 = $32;var $31 = $33;break;case 'List.nil':var $34 = _default$2;var $31 = $34;break;};return $31;};
  const List$head_with_default = x0=>x1=>List$head_with_default$(x0,x1);
  function U8$new$(_value$1){var $35 = word_to_u8(_value$1);return $35;};
  const U8$new = x0=>U8$new$(x0);
  function Word$(_size$1){var $36 = null;return $36;};
  const Word = x0=>Word$(x0);
  const Word$e = ({_:'Word.e'});
  function Word$o$(_pred$2){var $37 = ({_:'Word.o','pred':_pred$2});return $37;};
  const Word$o = x0=>Word$o$(x0);
  function Word$zero$(_size$1){var self = _size$1;if (self===0n) {var $39 = Word$e;var $38 = $39;} else {var $40=(self-1n);var $41 = Word$o$(Word$zero$($40));var $38 = $41;};return $38;};
  const Word$zero = x0=>Word$zero$(x0);
  function Word$i$(_pred$2){var $42 = ({_:'Word.i','pred':_pred$2});return $42;};
  const Word$i = x0=>Word$i$(x0);
  function Word$inc$(_word$2){var self = _word$2;switch(self._){case 'Word.o':var $44=self.pred;var $45 = Word$i$($44);var $43 = $45;break;case 'Word.i':var $46=self.pred;var $47 = Word$o$(Word$inc$($46));var $43 = $47;break;case 'Word.e':var $48 = Word$e;var $43 = $48;break;};return $43;};
  const Word$inc = x0=>Word$inc$(x0);
  function Nat$to_word$(_size$1,_n$2){var self = _n$2;if (self===0n) {var $50 = Word$zero$(_size$1);var $49 = $50;} else {var $51=(self-1n);var $52 = Word$inc$(Nat$to_word$(_size$1,$51));var $49 = $52;};return $49;};
  const Nat$to_word = x0=>x1=>Nat$to_word$(x0,x1);
  const Nat$to_u8 = a0=>(Number(a0)&0xFF);
  function List$concat$(_as$2,_bs$3){var self = _as$2;switch(self._){case 'List.cons':var $54=self.head;var $55=self.tail;var $56 = List$cons$($54,List$concat$($55,_bs$3));var $53 = $56;break;case 'List.nil':var $57 = _bs$3;var $53 = $57;break;};return $53;};
  const List$concat = x0=>x1=>List$concat$(x0,x1);
  function Pair$fst$(_pair$3){var self = _pair$3;switch(self._){case 'Pair.new':var $59=self.fst;var $60 = $59;var $58 = $60;break;};return $58;};
  const Pair$fst = x0=>Pair$fst$(x0);
  function Pair$(_A$1,_B$2){var $61 = null;return $61;};
  const Pair = x0=>x1=>Pair$(x0,x1);
  const Nat$sub = a0=>a1=>(a0-a1<=0n?0n:a0-a1);
  function Pair$new$(_fst$3,_snd$4){var $62 = ({_:'Pair.new','fst':_fst$3,'snd':_snd$4});return $62;};
  const Pair$new = x0=>x1=>Pair$new$(x0,x1);
  function Nat$div_mod$go$(_n$1,_d$2,_r$3){var Nat$div_mod$go$=(_n$1,_d$2,_r$3)=>({ctr:'TCO',arg:[_n$1,_d$2,_r$3]});var Nat$div_mod$go=_n$1=>_d$2=>_r$3=>Nat$div_mod$go$(_n$1,_d$2,_r$3);var arg=[_n$1,_d$2,_r$3];while(true){let [_n$1,_d$2,_r$3]=arg;var R=(()=>{var self = (_n$1<=_r$3);if (self) {var $63 = Nat$div_mod$go$(_n$1,Nat$succ$(_d$2),(_r$3-_n$1<=0n?0n:_r$3-_n$1));return $63;} else {var $64 = Pair$new$(_d$2,_r$3);return $64;};})();if(R.ctr==='TCO')arg=R.arg;else return R;}};
  const Nat$div_mod$go = x0=>x1=>x2=>Nat$div_mod$go$(x0,x1,x2);
  const Nat$div_mod = a0=>a1=>(({_:'Pair.new','fst':a0/a1,'snd':a0%a1}));
  const Nat$div = a0=>a1=>(a0/a1);
  const U8$from_nat = a0=>(Number(a0)&0xFF);
  function Pair$snd$(_pair$3){var self = _pair$3;switch(self._){case 'Pair.new':var $66=self.snd;var $67 = $66;var $65 = $67;break;};return $65;};
  const Pair$snd = x0=>Pair$snd$(x0);
  const Nat$mod = a0=>a1=>(a0%a1);
  function Bytes$from_nat$(_n$1){var self = _n$1;if (self===0n) {var $69 = List$nil;var $68 = $69;} else {var $70=(self-1n);var $71 = List$concat$(Bytes$from_nat$((_n$1/256n)),List$cons$((Number((_n$1%256n))&0xFF),List$nil));var $68 = $71;};return $68;};
  const Bytes$from_nat = x0=>Bytes$from_nat$(x0);
  function Ether$RLP$encode$length$(_add$1,_length$2){var self = (_length$2<=55n);if (self) {var $73 = List$cons$((Number((_add$1+_length$2))&0xFF),List$nil);var $72 = $73;} else {var _b$3 = Bytes$from_nat$(_length$2);var _a$4 = (Number((56n+(_add$1+((list_length(_b$3))-1n<=0n?0n:(list_length(_b$3))-1n))))&0xFF);var $74 = List$cons$(_a$4,_b$3);var $72 = $74;};return $72;};
  const Ether$RLP$encode$length = x0=>x1=>Ether$RLP$encode$length$(x0,x1);
  function Ether$RLP$encode$many$(_trees$1){var self = _trees$1;switch(self._){case 'List.cons':var $76=self.head;var $77=self.tail;var $78 = List$concat$(Ether$RLP$encode$($76),Ether$RLP$encode$many$($77));var $75 = $78;break;case 'List.nil':var $79 = List$nil;var $75 = $79;break;};return $75;};
  const Ether$RLP$encode$many = x0=>Ether$RLP$encode$many$(x0);
  function Ether$RLP$encode$(_tree$1){var self = _tree$1;switch(self._){case 'Ether.RLP.data':var $81=self.value;var self = (((list_length($81))===1n)&&((BigInt(List$head_with_default$(0,$81)))<=127n));if (self) {var $83 = $81;var $82 = $83;} else {var $84 = List$concat$(Ether$RLP$encode$length$(128n,(list_length($81))),$81);var $82 = $84;};var $80 = $82;break;case 'Ether.RLP.node':var $85=self.child;var _rest$3 = Ether$RLP$encode$many$($85);var $86 = List$concat$(Ether$RLP$encode$length$(192n,(list_length(_rest$3))),_rest$3);var $80 = $86;break;};return $80;};
  const Ether$RLP$encode = x0=>Ether$RLP$encode$(x0);
  function Maybe$default$(_m$2,_a$3){var self = _m$2;switch(self._){case 'Maybe.some':var $88=self.value;var $89 = $88;var $87 = $89;break;case 'Maybe.none':var $90 = _a$3;var $87 = $90;break;};return $87;};
  const Maybe$default = x0=>x1=>Maybe$default$(x0,x1);
  function Maybe$(_A$1){var $91 = null;return $91;};
  const Maybe = x0=>Maybe$(x0);
  const Maybe$none = ({_:'Maybe.none'});
  function Maybe$some$(_value$2){var $92 = ({_:'Maybe.some','value':_value$2});return $92;};
  const Maybe$some = x0=>Maybe$some$(x0);
  function List$head$(_xs$2){var self = _xs$2;switch(self._){case 'List.cons':var $94=self.head;var $95 = Maybe$some$($94);var $93 = $95;break;case 'List.nil':var $96 = Maybe$none;var $93 = $96;break;};return $93;};
  const List$head = x0=>List$head$(x0);
  function List$split$(_xs$2,_n$3){var self = _n$3;if (self===0n) {var $98 = Pair$new$(List$nil,_xs$2);var $97 = $98;} else {var $99=(self-1n);var self = _xs$2;switch(self._){case 'List.cons':var $101=self.head;var $102=self.tail;var self = List$split$($102,$99);switch(self._){case 'Pair.new':var $104=self.fst;var $105=self.snd;var $106 = Pair$new$(List$cons$($101,$104),$105);var $103 = $106;break;};var $100 = $103;break;case 'List.nil':var $107 = Pair$new$(List$nil,_xs$2);var $100 = $107;break;};var $97 = $100;};return $97;};
  const List$split = x0=>x1=>List$split$(x0,x1);
  const Bytes$split = List$split;
  function Bytes$to_nat$go$(_bytes$1,_acc$2){var Bytes$to_nat$go$=(_bytes$1,_acc$2)=>({ctr:'TCO',arg:[_bytes$1,_acc$2]});var Bytes$to_nat$go=_bytes$1=>_acc$2=>Bytes$to_nat$go$(_bytes$1,_acc$2);var arg=[_bytes$1,_acc$2];while(true){let [_bytes$1,_acc$2]=arg;var R=(()=>{var self = _bytes$1;switch(self._){case 'List.cons':var $108=self.head;var $109=self.tail;var _digit$5 = (BigInt($108));var $110 = Bytes$to_nat$go$($109,((_acc$2*256n)+_digit$5));return $110;case 'List.nil':var $111 = _acc$2;return $111;};})();if(R.ctr==='TCO')arg=R.arg;else return R;}};
  const Bytes$to_nat$go = x0=>x1=>Bytes$to_nat$go$(x0,x1);
  function Bytes$to_nat$(_bytes$1){var $112 = Bytes$to_nat$go$(_bytes$1,0n);return $112;};
  const Bytes$to_nat = x0=>Bytes$to_nat$(x0);
  function Ether$RLP$split$length$(_add$1,_bytes$2){var self = _bytes$2;switch(self._){case 'List.cons':var $114=self.head;var $115=self.tail;var _fst$5 = ((BigInt($114))-_add$1<=0n?0n:(BigInt($114))-_add$1);var self = (_fst$5<=55n);if (self) {var $117 = Bytes$split($115)(_fst$5);var $116 = $117;} else {var self = Bytes$split($115)(Nat$succ$((_fst$5-56n<=0n?0n:_fst$5-56n)));switch(self._){case 'Pair.new':var $119=self.fst;var $120=self.snd;var $121 = Bytes$split($120)(Bytes$to_nat$($119));var $118 = $121;break;};var $116 = $118;};var $113 = $116;break;case 'List.nil':var $122 = Pair$new$(List$nil,List$nil);var $113 = $122;break;};return $113;};
  const Ether$RLP$split$length = x0=>x1=>Ether$RLP$split$length$(x0,x1);
  function Ether$RLP$decode$many$(_bytes$1){var self = _bytes$1;switch(self._){case 'List.cons':var $124=self.head;var $125=self.tail;var _prefix$4 = (BigInt($124));var self = (_prefix$4<=127n);if (self) {var $127 = List$cons$(Ether$RLP$data$(List$cons$($124,List$nil)),Ether$RLP$decode$many$($125));var $126 = $127;} else {var self = (_prefix$4<=191n);if (self) {var self = Ether$RLP$split$length$(128n,_bytes$1);switch(self._){case 'Pair.new':var $130=self.fst;var $131=self.snd;var $132 = List$cons$(Ether$RLP$data$($130),Ether$RLP$decode$many$($131));var $129 = $132;break;};var $128 = $129;} else {var self = Ether$RLP$split$length$(192n,_bytes$1);switch(self._){case 'Pair.new':var $134=self.fst;var $135=self.snd;var $136 = List$cons$(Ether$RLP$node$(Ether$RLP$decode$many$($134)),Ether$RLP$decode$many$($135));var $133 = $136;break;};var $128 = $133;};var $126 = $128;};var $123 = $126;break;case 'List.nil':var $137 = List$nil;var $123 = $137;break;};return $123;};
  const Ether$RLP$decode$many = x0=>Ether$RLP$decode$many$(x0);
  function Ether$RLP$decode$(_bytes$1){var $138 = Maybe$default$(List$head$(Ether$RLP$decode$many$(_bytes$1)),Ether$RLP$data$(List$nil));return $138;};
  const Ether$RLP$decode = x0=>Ether$RLP$decode$(x0);
  function Ether$RLP$decode$check$split$(_add$1,_bytes$2){var self = _bytes$2;switch(self._){case 'List.cons':var $140=self.head;var $141=self.tail;var _fst$5 = ((BigInt($140))-_add$1<=0n?0n:(BigInt($140))-_add$1);var self = (_fst$5<=55n);if (self) {var $143 = ((list_length($141))<=_fst$5);var $142 = $143;} else {var self = (Nat$succ$((_fst$5-56n<=0n?0n:_fst$5-56n))<=(list_length($141)));if (self) {var self = Bytes$split($141)(Nat$succ$((_fst$5-56n<=0n?0n:_fst$5-56n)));switch(self._){case 'Pair.new':var $146=self.fst;var $147=self.snd;var $148 = ((list_length($147))<=Bytes$to_nat$($146));var $145 = $148;break;};var $144 = $145;} else {var $149 = Bool$false;var $144 = $149;};var $142 = $144;};var $139 = $142;break;case 'List.nil':var $150 = Bool$false;var $139 = $150;break;};return $139;};
  const Ether$RLP$decode$check$split = x0=>x1=>Ether$RLP$decode$check$split$(x0,x1);
  function Ether$RLP$decode$check$(_bytes$1){var self = _bytes$1;switch(self._){case 'List.cons':var $152=self.head;var $153=self.tail;var _prefix$4 = (BigInt($152));var self = (_prefix$4<=127n);if (self) {var $155 = Ether$RLP$decode$check$($153);var $154 = $155;} else {var self = (_prefix$4<=191n);if (self) {var self = Ether$RLP$decode$check$split$(128n,_bytes$1);if (self) {var self = Ether$RLP$split$length$(128n,_bytes$1);switch(self._){case 'Pair.new':var $159=self.snd;var $160 = Ether$RLP$decode$check$($159);var $158 = $160;break;};var $157 = $158;} else {var $161 = Bool$false;var $157 = $161;};var $156 = $157;} else {var self = Ether$RLP$decode$check$split$(192n,_bytes$1);if (self) {var self = Ether$RLP$split$length$(192n,_bytes$1);switch(self._){case 'Pair.new':var $164=self.fst;var $165=self.snd;var $166 = (Ether$RLP$decode$check$($164)&&Ether$RLP$decode$check$($165));var $163 = $166;break;};var $162 = $163;} else {var $167 = Bool$false;var $162 = $167;};var $156 = $162;};var $154 = $156;};var $151 = $154;break;case 'List.nil':var $168 = Bool$true;var $151 = $168;break;};return $151;};
  const Ether$RLP$decode$check = x0=>Ether$RLP$decode$check$(x0);
  function IO$(_A$1){var $169 = null;return $169;};
  const IO = x0=>IO$(x0);
  function IO$ask$(_query$2,_param$3,_then$4){var $170 = ({_:'IO.ask','query':_query$2,'param':_param$3,'then':_then$4});return $170;};
  const IO$ask = x0=>x1=>x2=>IO$ask$(x0,x1,x2);
  function IO$bind$(_a$3,_f$4){var self = _a$3;switch(self._){case 'IO.end':var $172=self.value;var $173 = _f$4($172);var $171 = $173;break;case 'IO.ask':var $174=self.query;var $175=self.param;var $176=self.then;var $177 = IO$ask$($174,$175,(_x$8=>{var $178 = IO$bind$($176(_x$8),_f$4);return $178;}));var $171 = $177;break;};return $171;};
  const IO$bind = x0=>x1=>IO$bind$(x0,x1);
  function IO$end$(_value$2){var $179 = ({_:'IO.end','value':_value$2});return $179;};
  const IO$end = x0=>IO$end$(x0);
  function IO$monad$(_new$2){var $180 = _new$2(IO$bind)(IO$end);return $180;};
  const IO$monad = x0=>IO$monad$(x0);
  const Unit$new = null;
  const export$rlp = (()=>{var _u$1 = List$cons;var _u$2 = List$nil;var _u$3 = Ether$RLP$data;var _u$4 = Ether$RLP$node;var _u$5 = Ether$RLP$encode;var _u$6 = Ether$RLP$decode;var _u$7 = Ether$RLP$decode$check;var $181 = IO$monad$((_m$bind$8=>_m$pure$9=>{var $182 = _m$pure$9;return $182;}))(Unit$new);return $181;})();
  return {
    '$main$': ()=>run(export$rlp),
    'run': run,
    'List.cons': List$cons,
    'List.nil': List$nil,
    'Ether.RLP.data': Ether$RLP$data,
    'Ether.RLP.node': Ether$RLP$node,
    'List': List,
    'Bool.false': Bool$false,
    'Bool.and': Bool$and,
    'Bool.true': Bool$true,
    'Nat.eql': Nat$eql,
    'Nat.succ': Nat$succ,
    'List.length': List$length,
    'Nat.lte': Nat$lte,
    'Nat.add': Nat$add,
    'Nat.mul': Nat$mul,
    'Word.to_nat': Word$to_nat,
    'Nat.zero': Nat$zero,
    'U8.to_nat': U8$to_nat,
    'List.head_with_default': List$head_with_default,
    'U8.new': U8$new,
    'Word': Word,
    'Word.e': Word$e,
    'Word.o': Word$o,
    'Word.zero': Word$zero,
    'Word.i': Word$i,
    'Word.inc': Word$inc,
    'Nat.to_word': Nat$to_word,
    'Nat.to_u8': Nat$to_u8,
    'List.concat': List$concat,
    'Pair.fst': Pair$fst,
    'Pair': Pair,
    'Nat.sub': Nat$sub,
    'Pair.new': Pair$new,
    'Nat.div_mod.go': Nat$div_mod$go,
    'Nat.div_mod': Nat$div_mod,
    'Nat.div': Nat$div,
    'U8.from_nat': U8$from_nat,
    'Pair.snd': Pair$snd,
    'Nat.mod': Nat$mod,
    'Bytes.from_nat': Bytes$from_nat,
    'Ether.RLP.encode.length': Ether$RLP$encode$length,
    'Ether.RLP.encode.many': Ether$RLP$encode$many,
    'Ether.RLP.encode': Ether$RLP$encode,
    'Maybe.default': Maybe$default,
    'Maybe': Maybe,
    'Maybe.none': Maybe$none,
    'Maybe.some': Maybe$some,
    'List.head': List$head,
    'List.split': List$split,
    'Bytes.split': Bytes$split,
    'Bytes.to_nat.go': Bytes$to_nat$go,
    'Bytes.to_nat': Bytes$to_nat,
    'Ether.RLP.split.length': Ether$RLP$split$length,
    'Ether.RLP.decode.many': Ether$RLP$decode$many,
    'Ether.RLP.decode': Ether$RLP$decode,
    'Ether.RLP.decode.check.split': Ether$RLP$decode$check$split,
    'Ether.RLP.decode.check': Ether$RLP$decode$check,
    'IO': IO,
    'IO.ask': IO$ask,
    'IO.bind': IO$bind,
    'IO.end': IO$end,
    'IO.monad': IO$monad,
    'Unit.new': Unit$new,
    'export.rlp': export$rlp,
  };
})();
