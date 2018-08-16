var fs=require('fs'),wast=require('./wast.js');
var Values={};

function add(x,y) { return ['i32.add',x,y]; }
function amend(x,y) { return ['i32.store',gl(x),parse(y)]; }
function emit(x) { return ['call','$emeti',x]; }
function literal(x) { return ['i32.const',x]; }
//function rem(x) { return ['remark',x]; }
function rem(x) { return ['rem',x]; }

function gl(x) { return ['get_local',x]; }
function sl(x,y) { return ['set_local',x,y]; }

function copy(x,y) { return sl(y,parse(x)); }
function get_(x) { return Values[x].v; }
function parse(x) {
	x=x.trim(); 
	if(x[0]=='@') return get_(x.slice(1));
	if(x[0]=='$') return gl(x); 
	return literal(x);
}
function inc(name,val) {
	//emit(aa,'inc');
	return sl(name,add(gl(name),literal(val)));
}
function make(name, type, inc) {
	Values[name]={n:name, t:type, i:inc};
	return ['local',name,type,rem(inc,"inc")];
}
function next(name) { return inc(name,Values[name].i); }
function def(x,y,t){if(isa(x))return def(x[0],x[1],x[2]);if(!t)t='f';Values[x]={n:x,t:'f',v:y};}
def('t_int',literal("i".charCodeAt(0)),'i');
def('copy',copy);
def('emit',emit);
def('inc',inc);
def('make',make);
def('next',next);
def('amend',amend);

function empty(x) { return isa(x)&&x.length==0; }
function isa(x) { return typeof(x)==typeof([1,2]); }
function isstr(x) { return typeof(x)=='string'; }
function isud(x) { return typeof(x)=='undefined'; }
function wide(x,f,last,depth) { 
	if(!isa(x)) throw 'wide(): arg not list';
	let xl=x.length; if(xl==0) return x;
	if(last==undefined) last=x;
	if(depth==undefined) depth=0;
	let R=[];
	for (let i=0;i<xl;i++) {
		if(isa(x[i])) { last=wide(x[i],f,last,depth+1); R.push(last); }
		else R.push(x[i]);
	}
	return f(R,depth,last);
}
function deep(x,f,last) { 
	if(!isa(x)) throw 'deep(): arg not list';
	let xl=x.length; if(xl==0) return x;
	if(last==undefined) last=x;
	let R=[];
	for (let i=0;i<xl;i++) {
		if(isa(x[i])) last=deep(x[i],f,last); 
		else last=f(x[i],i,last);
		R.push(last);
	}
	return R;
}
function render(wlist) {
	emit(wlist,'render');
	if(!isa(wlist)) return '(invalid wasmlist)';
	if(wlist.length==0) return '';
	var o=wide(wlist,function(x,d,l){
		if(empty(x[0])) return '(;;)'; 
		if(x[0]=='rem') return "(;"+x.join(" ")+";)";
		if(isstr(x[0])) return "("+x.join(" ")+")";
		return x.join("\n");
	});
	emit(o,'render o');
	return o;
}
function getSrc(){
	var content=fs.readFileSync('test.wat','utf8');
	content=content.replace(/\(%(.+) (.*)%\)/gm, function(x,y,z) {
		var words=x.slice(2,-2).trim().split(/\s+/);
		var f=Values[words[0]];
		if(!f) return "(;'"+words[0]+"' not found;)";
		f=f.v;
		if(typeof(f)=='function') r=f(words[1],words[2],words[3]);
		else r=f;
		r.push(rem(x.slice(2,-2)));
		return render(r);
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
		r.t=t; emit(t,'t');
		if(t<0) { r.one=1; r.len=1; ofs=4; }
		else { r.one=0; r.len=w[1]; ofs=8; }
		var tt=String.fromCharCode(abs(r.t));
		var df=decodeType[String.fromCharCode(abs(r.t))];
		r.val=df(r, Mem.buffer, ptr+ofs, r.len);
		return r;
	};
	var dump=function() {
		var r=decode(0);
		console.log(r);
	}
	var c=getSrc(),b=wast.WebAssemblyText.encode(c);

	function exhaust(f,x,opt) {
		var last=x,iter=0;
		do { x=last; last=f(x,opt,iter++); } while(last!=x);
		return last;
	}

	var o=exhaust(function(str) {
		return str.replace(/\(([^]*?)\)/mg, function(x,y,z) {
			emit(x,'ex'); emit(y,'ey'); emit(z,'ez');
			return JSON.stringify(y.split(/\s+/));
	})}, c);
	emit(o,'final')
	var sys={emit:emit,mem:Mem};
	var wm=new WebAssembly.Module(b);
	var winst=new WebAssembly.Instance(wm,{sys:sys});
	emit(winst);
	winst.exports.main();
	dump();
}
main();
