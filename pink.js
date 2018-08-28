// 
// pink in javascript
// 

// TODO allow modifying:
// - lexer
// - lexer->parser (resolver)
// - "makers" ("handlers")?
//
require('./xact.js')(global);
let fs=require('fs');

MAKERS['f1']=function(f){return function(x,ctx){
	if(ctx && ctx._state) ctx._state.x=x; 
	return f(x,ctx)}};
MAKERS['f2']=function(f){return function(x,ctx){return function(y,ctx) { 
	if (ctx && ctx._state) { ctx._state.x=x;ctx._state.y=y; }
	return f(x,y,ctx); }}} // ???
MAKERS['$file']=function(fn){
	if(!fs.existsSync(fn)) return make(make(fn,'$filenotfound'),'$err'); 
	return {'$file':fn};}

function compile(code) {
	emit(code,'compiling..');
	let c=parse(code);
	emit(je(c),'parse tree');
	return function(left, ctx) {
		return interp(code, ctx, left);
	}
}

function invoke(litname, left, ctx) {
	noemit([litname,left],'invoke');
	//var val=get(ctx, litnam;
	// if(tU(obj)) return 
	let val;
	if(!tU(left)) val=ctx[type(left)+':'+litname];
	val=val||ctx[litname];
	if(tU(val)) return make(make(litname,'$notfound'),'$err');
	if(tfunc(val)) { if(tU(left)) return val; else return val(left, ctx); }
	return val; }

function interp0(x, ctx, left) {
	emit(je(x),'interp entering with code:');
	var xn=len(x),i,xi,sy,data,val;
	for(i=0;i<xn;i++){
		if($sym(left)=='$err') return left;
		xi=x[i]; sy=$sym(xi); data=$data(xi);
		emit([x[i],left],'interp x['+i+']/left'); 
		if(sy=='$ws') continue;
		if(sy=='$lit') {
			left=invoke(data, left, ctx); 
			if($sym(left)=='err')
				return left;
			continue;
		}
		val=undefined;
		if(tarray(xi)&&!sy) { noemit('interp recursing'); val=interp0(xi,ctx,left); }
		else if(sy=='$str'||sy=='$n') { noemit('interp value'); val=data; }
		else if(sy=='$expr') { noemit('interp expr'); val=interp0(data, ctx, undefined); noemit(val,'result'); }
		if(tfunc(left)) val=left(val,ctx);
		left=val;
	}
	return left;
}
function interp(x, ctx, left) {
	if($sym(x)!='$parsetree') return make(make('x should be parse tree','$param'),'$err');
	x=$data(x);
	return interp0(x,ctx,left);
}
function parse(c) {
	cc=c.split('');
	ccc=nest(cc,"'","'",function(v){return make(v.join(''),'$str')});
	ccd=resolve(ccc, [ 
		/;/, function(x){return [make(' ','$ws'),make(';','$lit')]},
		/^[0-9.]+$/, function(x){noemit(x,'making number'); return make(Number(x),'$n');},
		/^\s+$/, function(x){return make(x,'$ws');},
		/^[A-Za-z0-9!@#%^&*=<>,.\/?;:'`_+-]+$/, function(x){return make(x,'$lit'); }
	]);
	ccf=nest(ccd,"(",")",function(v) { return make(v,'$expr'); });
	ccg=wide(ccf, function(x, last_, path) {
		x=alike(x, function(x,y) {
			if($sym(x)=='$n') return make($data(x)*10+$data(y),'$n');
			if($sym(x)=='$lit') return make($data(x)+$data(y),'$lit');
			// no return = undefined = skip
		});
		return x;
	});
	//emit(je(ccg),'parse result');
	return make(ccg,'$parsetree');
}

function type(x) {
	function test_array(x, type) { return x.every(function(y) { return typeof(y)==type; }); }
	if(tsym(x)) return $sym(x);
	if(tarray(x)) {
		var r=merge(take(x,3),take(x,-3));
		if(test_array(r,'number')) return '$num';
		if(test_array(r,'string')) return '$str';
		return 'array'; //i see more difficult general list handling in my near future
	}
	var u=t(x);
	if(u=='int') return '$num';
	if(u=='string') return '$str';
	return u;
}

var BASE={};
BASE['_state']={};
BASE[',']=make(ins,'f2');
BASE[';']=function(){return undefined;};
/*
BASE['amend']=make(function(left,right,ctx) {
	if(len(right)!=2) return make(make('amend','y should be ( (1,2,3),(')
},'f2');
*/
BASE['each']=make(function(left,right,ctx) {
	noemit([left,right],'each');
	if(!tarray(left)) left=[left];
	right=parse(right);
	noemit(right,'each code');
	var r=each(left,function(x,i) {
		noemit(x,'each inner - calling interp');
		var r=interp(right,ctx,x);
		noemit(r,'each inner - interrupt result');
		return r;
	});
	return r;
},'f2');
// TODO make a penetrative-math-operator function thing
BASE['+']=make(function(x,y){x=ravel(x),y=ravel(y); if(len(x)==1) x=take(x,len(y)); noemit([x,y],'+'); return eachboth([x,y],function(x,y){return x+y})},'f2');
BASE['$str:+']=make(function(x,y){emit([x,y],'strplus!');return x+y},'f2');
BASE['compile']=make(compile,'f1');
BASE['emit']=make(emit,'f1');
BASE['get']=make(get,'f2');
BASE['interp']=interp;
BASE['invoke']=invoke;
BASE['is']=make(function(left,right,ctx) {
			emit([left,right,ctx],'assigning..');
			if(!tstr(right)) return make(['is non-string','nyi'],'$err');
			if($sym(right)!='$str') return noemit(ctx[right]=left,'str');
			return make(['is',[left,right]],'$err'); },'f2');
BASE['len']=make(len,'f1');
BASE['make']=make(function(x,y){return make(x,y[0]!='$'?'$'+y:y);},'f2');
BASE['$file:load']=make(function(x){return fs.readFileSync($data(x),'utf8');},'f1');
BASE['parse']=make(parse,'f1');
BASE['take']=make(take,'f2');
BASE['til']=make(til,'f1');
BASE['type']=make(type,'f1');
function context() { var o=Object.assign({},BASE); return o; }

function attempt(code,C) {
	noemit(code,'attempt..');
	C=C||context(); 
	var r=C.interp(C.parse(code),C);
	return [r,C];
}

function code_tests() {
	//parsetest("(1,2,345) is 'blah'")
	var c, r;
	emit('begin code tests');
	c="1"; r=attempt(c); assert(r[0],1,'codeA');
	c="(1)"; r=attempt(c); assert(r[0],1,'codeA');
	c="2 is 'z'"; r=attempt(c);
	assert(r,{'z':2},'code0');
	c="z"; r=attempt(c,r[1]);
	assert(r[0],2,'code0b');
	c="2,3 is 'z'"; r=attempt(c);
	assert(r[0],[2,3],'code1a'); assert(r[1],{'z':[2,3]},'code1b');
	c="til 4"; r=attempt(c);
	assert(r[0],[0,1,2,3],'code2a');
	c="4 til"; r=attempt(c); noemit(r);
	assert(r[0],[0,1,2,3],'code2b');
	c="'abc' is 'name'"; r=attempt(c); noemit(r);
	assert(r[0],'abc','code3');assert(r[1],{'name':'abc'},'code4');
	c="(2,3) is 'z'"; r=attempt(c);
	assert(r[0],[2,3],'code5a'); assert(r[1],{'z':[2,3]},'code5b');
	c="(2,3) take 1 is 'z'"; r=attempt(c);
	assert(r[0],[2],'code6a'); assert(r[1],{'z':[2]},'code6b');
	c="2 type"; r=attempt(c); noemit(r);
	assert(r[0],'$num','code7a');
	c="(2,3) each 'til'"; r=attempt(c);
	assert(r[0],[[0,1],[0,1,2]],'code8a');
	c="(2,3) each 'til' each 'len'"; r=attempt(c);
	assert(r[0],[2,3],'code9');
	c="'hello' len"; r=attempt(c); assert(r[0],5,'code10');
	c="'hello' get 1"; r=attempt(c); assert(r[0],'e','code11');
	c="1,2,3"; r=attempt(c); assert(r[0],[1,2,3],'code-ll-0');
	c="(2,3,4,5) get 0"; r=attempt(c); noemit(r); assert(r[0],2,'code12');
	c="(2,3,4,5) get 1"; r=attempt(c); assert(r[0],3,'code13');
	c="1+1"; r=attempt(c); assert(r[0],[2],'code14');
	c="1,2+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code15');
	c="(1,2)+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code16');
	//c="'hello' is 'a' ; 'goodbye' is 'b' ; a + b"; r=attempt(c); emit(r);
	c="'README.md' is 'fn'; fn make '$file' is 'handle'; handle load"; r=attempt(c); 
	assert(/pink/.test(r[0]),true,'code17');
	c="2 is 'b';b";r=attempt(c);assert(r[0],2,'code18'); // fix for semicolon in middle of line
	//c="'emit 666;x*2' is '$mytype'; 10 make 'mytype'";r=attempt(c);
	c="2,3 type";r=attempt(c);assert(r[0],'$num','code19');
	c="'666' compile is 'myfunc'; 100 myfunc";r=attempt(c);emit(r);
	emit('code tests passed!');
}

function repl(n) {
	function repl0() {
		n++;
		rl.question(n+'> ',function(x){ 
			emit(je(x),'input');
			x=x.trim();
			if(x=='') return repl0();
			if(x=='\\\\') process.exit(1);
			var p=parse(x,C);
			emit(je(p),'parsetree');
			var i=interp(p,C);
			emit(i,'result');
			emit(C,'final context');
			return repl0();
		});
	}
	const rl=require('readline').createInterface({input:process.stdin,output:process.stdout});
	n=tU(n)?-1:n;
	let C=context();
	emit("\n\nwelcome to Pink\nuse \\\\ to exit\n\n");
	repl0();
}

function main() {
	//parsetest("(1,2,345) is 'blah'")
	//
	code_tests();
	repl();
}

main();

