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
  function List$(_A$1){var $20 = null;return $20;};
  const List = x0=>List$(x0);
  const Bool$false = false;
  const Bool$and = a0=>a1=>(a0&&a1);
  const Bool$true = true;
  const Nat$eql = a0=>a1=>(a0===a1);
  function Nat$succ$(_pred$1){var $21 = 1n+_pred$1;return $21;};
  const Nat$succ = x0=>Nat$succ$(x0);
  const List$length = a0=>(list_length(a0));
  const Nat$lte = a0=>a1=>(a0<=a1);
  const Nat$add = a0=>a1=>(a0+a1);
  const Nat$mul = a0=>a1=>(a0*a1);
  function Word$to_nat$(_word$2){var self = _word$2;switch(self._){case 'Word.o':var $23=self.pred;var $24 = (2n*Word$to_nat$($23));var $22 = $24;break;case 'Word.i':var $25=self.pred;var $26 = Nat$succ$((2n*Word$to_nat$($25)));var $22 = $26;break;case 'Word.e':var $27 = 0n;var $22 = $27;break;};return $22;};
  const Word$to_nat = x0=>Word$to_nat$(x0);
  const Nat$zero = 0n;
  const U8$to_nat = a0=>(BigInt(a0));
  function List$head_with_default$(_default$2,_xs$3){var self = _xs$3;switch(self._){case 'List.cons':var $29=self.head;var $30 = $29;var $28 = $30;break;case 'List.nil':var $31 = _default$2;var $28 = $31;break;};return $28;};
  const List$head_with_default = x0=>x1=>List$head_with_default$(x0,x1);
  function U8$new$(_value$1){var $32 = word_to_u8(_value$1);return $32;};
  const U8$new = x0=>U8$new$(x0);
  function Word$(_size$1){var $33 = null;return $33;};
  const Word = x0=>Word$(x0);
  const Word$e = ({_:'Word.e'});
  function Word$o$(_pred$2){var $34 = ({_:'Word.o','pred':_pred$2});return $34;};
  const Word$o = x0=>Word$o$(x0);
  function Word$zero$(_size$1){var self = _size$1;if (self===0n) {var $36 = Word$e;var $35 = $36;} else {var $37=(self-1n);var $38 = Word$o$(Word$zero$($37));var $35 = $38;};return $35;};
  const Word$zero = x0=>Word$zero$(x0);
  function Word$i$(_pred$2){var $39 = ({_:'Word.i','pred':_pred$2});return $39;};
  const Word$i = x0=>Word$i$(x0);
  function Word$inc$(_word$2){var self = _word$2;switch(self._){case 'Word.o':var $41=self.pred;var $42 = Word$i$($41);var $40 = $42;break;case 'Word.i':var $43=self.pred;var $44 = Word$o$(Word$inc$($43));var $40 = $44;break;case 'Word.e':var $45 = Word$e;var $40 = $45;break;};return $40;};
  const Word$inc = x0=>Word$inc$(x0);
  function Nat$to_word$(_size$1,_n$2){var self = _n$2;if (self===0n) {var $47 = Word$zero$(_size$1);var $46 = $47;} else {var $48=(self-1n);var $49 = Word$inc$(Nat$to_word$(_size$1,$48));var $46 = $49;};return $46;};
  const Nat$to_word = x0=>x1=>Nat$to_word$(x0,x1);
  const Nat$to_u8 = a0=>(Number(a0)&0xFF);
  function List$cons$(_head$2,_tail$3){var $50 = ({_:'List.cons','head':_head$2,'tail':_tail$3});return $50;};
  const List$cons = x0=>x1=>List$cons$(x0,x1);
  function List$concat$(_as$2,_bs$3){var self = _as$2;switch(self._){case 'List.cons':var $52=self.head;var $53=self.tail;var $54 = List$cons$($52,List$concat$($53,_bs$3));var $51 = $54;break;case 'List.nil':var $55 = _bs$3;var $51 = $55;break;};return $51;};
  const List$concat = x0=>x1=>List$concat$(x0,x1);
  const List$nil = ({_:'List.nil'});
  function Pair$fst$(_pair$3){var self = _pair$3;switch(self._){case 'Pair.new':var $57=self.fst;var $58 = $57;var $56 = $58;break;};return $56;};
  const Pair$fst = x0=>Pair$fst$(x0);
  function Pair$(_A$1,_B$2){var $59 = null;return $59;};
  const Pair = x0=>x1=>Pair$(x0,x1);
  const Nat$sub = a0=>a1=>(a0-a1<=0n?0n:a0-a1);
  function Pair$new$(_fst$3,_snd$4){var $60 = ({_:'Pair.new','fst':_fst$3,'snd':_snd$4});return $60;};
  const Pair$new = x0=>x1=>Pair$new$(x0,x1);
  function Nat$div_mod$go$(_n$1,_d$2,_r$3){var Nat$div_mod$go$=(_n$1,_d$2,_r$3)=>({ctr:'TCO',arg:[_n$1,_d$2,_r$3]});var Nat$div_mod$go=_n$1=>_d$2=>_r$3=>Nat$div_mod$go$(_n$1,_d$2,_r$3);var arg=[_n$1,_d$2,_r$3];while(true){let [_n$1,_d$2,_r$3]=arg;var R=(()=>{var self = (_n$1<=_r$3);if (self) {var $61 = Nat$div_mod$go$(_n$1,Nat$succ$(_d$2),(_r$3-_n$1<=0n?0n:_r$3-_n$1));return $61;} else {var $62 = Pair$new$(_d$2,_r$3);return $62;};})();if(R.ctr==='TCO')arg=R.arg;else return R;}};
  const Nat$div_mod$go = x0=>x1=>x2=>Nat$div_mod$go$(x0,x1,x2);
  const Nat$div_mod = a0=>a1=>(({_:'Pair.new','fst':a0/a1,'snd':a0%a1}));
  const Nat$div = a0=>a1=>(a0/a1);
  const U8$from_nat = a0=>(Number(a0)&0xFF);
  function Pair$snd$(_pair$3){var self = _pair$3;switch(self._){case 'Pair.new':var $64=self.snd;var $65 = $64;var $63 = $65;break;};return $63;};
  const Pair$snd = x0=>Pair$snd$(x0);
  const Nat$mod = a0=>a1=>(a0%a1);
  function Bytes$from_nat$(_n$1){var self = _n$1;if (self===0n) {var $67 = List$nil;var $66 = $67;} else {var $68=(self-1n);var $69 = List$concat$(Bytes$from_nat$((_n$1/256n)),List$cons$((Number((_n$1%256n))&0xFF),List$nil));var $66 = $69;};return $66;};
  const Bytes$from_nat = x0=>Bytes$from_nat$(x0);
  function Ether$RLP$encode$length$(_add$1,_length$2){var self = (_length$2<=55n);if (self) {var $71 = List$cons$((Number((_add$1+_length$2))&0xFF),List$nil);var $70 = $71;} else {var _b$3 = Bytes$from_nat$(_length$2);var _a$4 = (Number((56n+(_add$1+((list_length(_b$3))-1n<=0n?0n:(list_length(_b$3))-1n))))&0xFF);var $72 = List$cons$(_a$4,_b$3);var $70 = $72;};return $70;};
  const Ether$RLP$encode$length = x0=>x1=>Ether$RLP$encode$length$(x0,x1);
  function Ether$RLP$encode$many$(_trees$1){var self = _trees$1;switch(self._){case 'List.cons':var $74=self.head;var $75=self.tail;var $76 = List$concat$(Ether$RLP$encode$($74),Ether$RLP$encode$many$($75));var $73 = $76;break;case 'List.nil':var $77 = List$nil;var $73 = $77;break;};return $73;};
  const Ether$RLP$encode$many = x0=>Ether$RLP$encode$many$(x0);
  function Ether$RLP$encode$(_tree$1){var self = _tree$1;switch(self._){case 'Ether.RLP.data':var $79=self.value;var self = (((list_length($79))===1n)&&((BigInt(List$head_with_default$(0,$79)))<=127n));if (self) {var $81 = $79;var $80 = $81;} else {var $82 = List$concat$(Ether$RLP$encode$length$(128n,(list_length($79))),$79);var $80 = $82;};var $78 = $80;break;case 'Ether.RLP.node':var $83=self.child;var _rest$3 = Ether$RLP$encode$many$($83);var $84 = List$concat$(Ether$RLP$encode$length$(192n,(list_length(_rest$3))),_rest$3);var $78 = $84;break;};return $78;};
  const Ether$RLP$encode = x0=>Ether$RLP$encode$(x0);
  function Maybe$default$(_m$2,_a$3){var self = _m$2;switch(self._){case 'Maybe.some':var $86=self.value;var $87 = $86;var $85 = $87;break;case 'Maybe.none':var $88 = _a$3;var $85 = $88;break;};return $85;};
  const Maybe$default = x0=>x1=>Maybe$default$(x0,x1);
  function Maybe$(_A$1){var $89 = null;return $89;};
  const Maybe = x0=>Maybe$(x0);
  const Maybe$none = ({_:'Maybe.none'});
  function Maybe$some$(_value$2){var $90 = ({_:'Maybe.some','value':_value$2});return $90;};
  const Maybe$some = x0=>Maybe$some$(x0);
  function List$head$(_xs$2){var self = _xs$2;switch(self._){case 'List.cons':var $92=self.head;var $93 = Maybe$some$($92);var $91 = $93;break;case 'List.nil':var $94 = Maybe$none;var $91 = $94;break;};return $91;};
  const List$head = x0=>List$head$(x0);
  function Ether$RLP$data$(_value$1){var $95 = ({_:'Ether.RLP.data','value':_value$1});return $95;};
  const Ether$RLP$data = x0=>Ether$RLP$data$(x0);
  function List$split$(_xs$2,_n$3){var self = _n$3;if (self===0n) {var $97 = Pair$new$(List$nil,_xs$2);var $96 = $97;} else {var $98=(self-1n);var self = _xs$2;switch(self._){case 'List.cons':var $100=self.head;var $101=self.tail;var self = List$split$($101,$98);switch(self._){case 'Pair.new':var $103=self.fst;var $104=self.snd;var $105 = Pair$new$(List$cons$($100,$103),$104);var $102 = $105;break;};var $99 = $102;break;case 'List.nil':var $106 = Pair$new$(List$nil,_xs$2);var $99 = $106;break;};var $96 = $99;};return $96;};
  const List$split = x0=>x1=>List$split$(x0,x1);
  const Bytes$split = List$split;
  function Bytes$to_nat$go$(_bytes$1,_acc$2){var Bytes$to_nat$go$=(_bytes$1,_acc$2)=>({ctr:'TCO',arg:[_bytes$1,_acc$2]});var Bytes$to_nat$go=_bytes$1=>_acc$2=>Bytes$to_nat$go$(_bytes$1,_acc$2);var arg=[_bytes$1,_acc$2];while(true){let [_bytes$1,_acc$2]=arg;var R=(()=>{var self = _bytes$1;switch(self._){case 'List.cons':var $107=self.head;var $108=self.tail;var _digit$5 = (BigInt($107));var $109 = Bytes$to_nat$go$($108,((_acc$2*256n)+_digit$5));return $109;case 'List.nil':var $110 = _acc$2;return $110;};})();if(R.ctr==='TCO')arg=R.arg;else return R;}};
  const Bytes$to_nat$go = x0=>x1=>Bytes$to_nat$go$(x0,x1);
  function Bytes$to_nat$(_bytes$1){var $111 = Bytes$to_nat$go$(_bytes$1,0n);return $111;};
  const Bytes$to_nat = x0=>Bytes$to_nat$(x0);
  function Ether$RLP$split$length$(_add$1,_bytes$2){var self = _bytes$2;switch(self._){case 'List.cons':var $113=self.head;var $114=self.tail;var _fst$5 = ((BigInt($113))-_add$1<=0n?0n:(BigInt($113))-_add$1);var self = (_fst$5<=55n);if (self) {var $116 = Bytes$split($114)(_fst$5);var $115 = $116;} else {var self = Bytes$split($114)(Nat$succ$((_fst$5-56n<=0n?0n:_fst$5-56n)));switch(self._){case 'Pair.new':var $118=self.fst;var $119=self.snd;var $120 = Bytes$split($119)(Bytes$to_nat$($118));var $117 = $120;break;};var $115 = $117;};var $112 = $115;break;case 'List.nil':var $121 = Pair$new$(List$nil,List$nil);var $112 = $121;break;};return $112;};
  const Ether$RLP$split$length = x0=>x1=>Ether$RLP$split$length$(x0,x1);
  function Ether$RLP$node$(_child$1){var $122 = ({_:'Ether.RLP.node','child':_child$1});return $122;};
  const Ether$RLP$node = x0=>Ether$RLP$node$(x0);
  function Ether$RLP$decode$many$(_bytes$1){var self = _bytes$1;switch(self._){case 'List.cons':var $124=self.head;var $125=self.tail;var _prefix$4 = (BigInt($124));var self = (_prefix$4<=127n);if (self) {var $127 = List$cons$(Ether$RLP$data$(List$cons$($124,List$nil)),Ether$RLP$decode$many$($125));var $126 = $127;} else {var self = (_prefix$4<=191n);if (self) {var self = Ether$RLP$split$length$(128n,_bytes$1);switch(self._){case 'Pair.new':var $130=self.fst;var $131=self.snd;var $132 = List$cons$(Ether$RLP$data$($130),Ether$RLP$decode$many$($131));var $129 = $132;break;};var $128 = $129;} else {var self = Ether$RLP$split$length$(192n,_bytes$1);switch(self._){case 'Pair.new':var $134=self.fst;var $135=self.snd;var $136 = List$cons$(Ether$RLP$node$(Ether$RLP$decode$many$($134)),Ether$RLP$decode$many$($135));var $133 = $136;break;};var $128 = $133;};var $126 = $128;};var $123 = $126;break;case 'List.nil':var $137 = List$nil;var $123 = $137;break;};return $123;};
  const Ether$RLP$decode$many = x0=>Ether$RLP$decode$many$(x0);
  function Ether$RLP$decode$(_bytes$1){var $138 = Maybe$default$(List$head$(Ether$RLP$decode$many$(_bytes$1)),Ether$RLP$data$(List$nil));return $138;};
  const Ether$RLP$decode = x0=>Ether$RLP$decode$(x0);
  function IO$(_A$1){var $139 = null;return $139;};
  const IO = x0=>IO$(x0);
  function IO$ask$(_query$2,_param$3,_then$4){var $140 = ({_:'IO.ask','query':_query$2,'param':_param$3,'then':_then$4});return $140;};
  const IO$ask = x0=>x1=>x2=>IO$ask$(x0,x1,x2);
  function IO$bind$(_a$3,_f$4){var self = _a$3;switch(self._){case 'IO.end':var $142=self.value;var $143 = _f$4($142);var $141 = $143;break;case 'IO.ask':var $144=self.query;var $145=self.param;var $146=self.then;var $147 = IO$ask$($144,$145,(_x$8=>{var $148 = IO$bind$($146(_x$8),_f$4);return $148;}));var $141 = $147;break;};return $141;};
  const IO$bind = x0=>x1=>IO$bind$(x0,x1);
  function IO$end$(_value$2){var $149 = ({_:'IO.end','value':_value$2});return $149;};
  const IO$end = x0=>IO$end$(x0);
  function IO$monad$(_new$2){var $150 = _new$2(IO$bind)(IO$end);return $150;};
  const IO$monad = x0=>IO$monad$(x0);
  const Unit$new = null;
  const export$rlp = (()=>{var _u$1 = Ether$RLP$encode;var _u$2 = Ether$RLP$decode;var $151 = IO$monad$((_m$bind$3=>_m$pure$4=>{var $152 = _m$pure$4;return $152;}))(Unit$new);return $151;})();
  return {
    '$main$': ()=>run(export$rlp),
    'run': run,
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
    'List.cons': List$cons,
    'List.concat': List$concat,
    'List.nil': List$nil,
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
    'Ether.RLP.data': Ether$RLP$data,
    'List.split': List$split,
    'Bytes.split': Bytes$split,
    'Bytes.to_nat.go': Bytes$to_nat$go,
    'Bytes.to_nat': Bytes$to_nat,
    'Ether.RLP.split.length': Ether$RLP$split$length,
    'Ether.RLP.node': Ether$RLP$node,
    'Ether.RLP.decode.many': Ether$RLP$decode$many,
    'Ether.RLP.decode': Ether$RLP$decode,
    'IO': IO,
    'IO.ask': IO$ask,
    'IO.bind': IO$bind,
    'IO.end': IO$end,
    'IO.monad': IO$monad,
    'Unit.new': Unit$new,
    'export.rlp': export$rlp,
  };
})();
