var fs=require('fs'),wast=require('./wast.js');

var Values={};
function gl(x) {
	return '(get_local '+x+')';
}
function sl(x,y) {
	return '(set_local '+x+' '+y+')';
}
function add(x,y) {
	return '(i32.add '+x+' '+y+')';
}
function c(x) {
	return '(i32.const '+x+')';
}
function copy(x,y) { return sl(y,parse(x)); }
function emit(x) { return '(call $emeti '+parse(x)+')'; }
function get_(x) { return Values[x].v;}
function parse(x) {
	x=x.trim(); 
	if(x[0]=='@') return get_(x.slice(1));
	if(x[0]=='$') return gl(x); else return c(x);
}
function inc(name,val) {
	//emit(aa,'inc');
	return sl(name,add(gl(name),c(val)));
}
function make(name, type, inc) {
	Values[name]={n:name, t:type, i:inc};
	return '(local '+name+' '+type+') '; //;;inc='+inc;
}
function next(name) {
	return inc(name,Values[name].i);
}
function amend(x,y) {
	return '(i32.store '+gl(x)+' '+parse(y)+')';
}
function def(x,y,t){if(!t)t='f';Values[x]={n:x,t:'f',v:y};}
def('t_int',c("i".charCodeAt(0)));
def('copy',copy);
def('emit',emit);
def('inc',inc);
def('make',make);
def('next',next);
def('amend',amend);

function getSrc(){
	var content=fs.readFileSync('test.wat','utf8');

	content=content.replace(/\(%(.+) (.*)%\)/g, function(x,y,z) {
		//console.log(x);
		var words=x.slice(2,-2).trim().split(/\s+/);
		//.split(' ');
		//console.log(words,'words');
		//console.log(y);
		//console.log(z);
		//emit(words,'resolving..');
		var f=Values[words[0]];
		if(!f) return ";; '"+words[0]+"' not found";
		f=f.v;
		if(typeof(f)=='function') r=f(words[1],words[2],words[3]);
		else r=f;
		var cmnt=" ;; "+x+"\n";
		return r+cmnt;
	});

	fs.writeFileSync('test.out.wat',content);
	console.log(content);

	return content;
}
function emit(x,y){if(y!==undefined)console.log(y,': '); console.log(x);return x;}
function ch(st_){return st_.charCodeAt(0);}
function main(){
	var Mem=new WebAssembly.Memory({initial:1});
	var abs=Math.abs;
	function decode(ptr) {
		var chi=ch("i");
		var decodeType={};
		decodeType['i']=function(r, buf, ptr, len) {
			var n=r.len;
			var w=new Uint32Array(Mem.buffer, ptr, n);
			var r=[];
			for(i=0;i<n;i++) r.push(w[i]);
			return r;
		}
		var r={};
		var w=new Uint32Array(Mem.buffer, ptr, 100);
		var t=w[0];
		r.t=t;
		emit(t,'t');
		if(t<0) { r.one=1; r.len=1; ofs=4; }
		else { 
			r.one=0; r.len=w[1]; ofs=8;
		}
		var tt=String.fromCharCode(abs(r.t));
		emit(tt);
		var df=decodeType[String.fromCharCode(abs(r.t))];
		r.val=df(r, Mem.buffer, ptr+ofs, r.len);
		return r;
	};
	var dump=function() {
		var r=decode(0);
		console.log(r);
	}
	var c=getSrc(),b=wast.WebAssemblyText.encode(c);
	var sys={emit:emit,mem:Mem};
	var wm=new WebAssembly.Module(b);
	var winst=new WebAssembly.Instance(wm,{sys:sys});
	emit(winst);
	winst.exports.main();
	dump();
}
main();
