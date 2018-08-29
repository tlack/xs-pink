// 
// pink in javascript
// 

// TODO allow modifying:
// - lexer
// - lexer->parser (resolver)
// - "makers" ("handlers")?
//
if(typeof(require)!='undefined') {
	require('./xact.js')(global);
	var fs=require('fs');
}

function assign(left,right,ctx) {
	emit([left,right,ctx],'assigning..');
	if(!tstr(right)) return make(['is non-string','nyi'],'$err');
	if (tstr(right)) { ctx[right]=left; return left; }
	return make(make('assign y must be string','$nyi'),'$err'); }
function arity(parsetree) {
	emit(je(parsetree),'arity ptree');
	if($sym(parsetree)=='$parsetree') parsetree=$data(parsetree);
	var m=match(parsetree,make('y','$lit'));
	var LY=len(m);
	emit([m,LY],'arityy');
	return LY > 0 ? 2 : 1;
}
function compile(code) {
	// Returns a function like f(x, ctx) that will do interp(code,ctx,x);
	if(!tstr(code)) return make('compile: code is string','$err');
	let ptree=parse(code);
	//let a=arity(ptree);
	//emit(a,'_###_#_#__##_ ARITY');
	emit(je(ptree),'compile() parse tree');
	if($data(ptree)[1]==2) {
		return function(left, right, ctx) {
			emit([je(left),je(right),je(ctx)],'compile2 - left');
			return interp(ptree, ctx, left, right); 
		}
	} else {
		return function(left, ctx){
			emit(je(left),'compile - inner left');
			emit(je(ctx),'compile - inner ctx');
			return interp(ptree, ctx, left)
		}
	}
}
function invoke(litname, left, ctx) {
	let val;
	emit(litname,'invoke() name');
	emit(je(ctx),'invoke() ctx');
	emit(je(left),'invoke() left');
	if(!tU(left)) val=ctx[type(left)+' ## '+litname];
	val=val||ctx[litname];
	if(tU(val)) return make(make(litname,'$notfound'),'$err');
	if(tfunc(val)) { 
		emit(val.toString(),'tfunc');
		emit(je(left),'tf left'); 
		if(!tU(left)) {
			val=val(left, ctx); 
			emit(je(val),'invoked result');
		}
	}
	emit(je(val),'invoke() returning');
	return val; }
var INTERP_N=0;
function interp0(x, ctx, left) {
	var interp_n=INTERP_N++;
	emit(je(x),'interp #'+interp_n+' entering with code:');
	//emit(ctx,'and data');
	var xn=len(x),i,xi,sy,data,val;
	ctx._state.x=left;
	for(i=0;i<xn;i++){
		if($sym(left)=='$err') return left;
		xi=x[i]; sy=$sym(xi); data=$data(xi);
		emit([je(xi),left],'interp x['+i+']/left'); 
		val=left;
		if(sy=='$ws') continue;
		if(sy=='$lit') {
			if (data=='y') {
				emit(je(ctx),'*** #'+interp_n+' Y ENCOUNTERED **');
				val=interp0(drop(x, i+1), ctx, left);
				emit(je(ctx),'*** #'+interp_n+' Y ENCOUNTERED **');
				return val;
			}
			if (data=='x') {
				emit(ctx,'ctx at time of x reference');
				left=emit(ctx._state.x,'replacement for "x"');
			} else {
				left=invoke(data, left, ctx); 
				emit(left,'interp lit result for "'+data+'"');
				if($sym(left)=='err') return left; }
			continue;
		}
		else if(sy=='$str'||sy=='$n') { emit('interp value'); val=data; }
		else if(sy=='$expr') { emit('interp expr'); val=interp0(data, ctx, undefined); noemit(val,'result'); }
		if(tarray(xi)&&!sy) { emit('interp recursing'); val=interp0(xi,ctx,left); }
		//if(tfunc(left) && !tU(val)) val=left(val,ctx);
		//emit([left?left.toString():'',val.toString()],'intr');
		if(tfunc(left) && !tU(val)) val=left(val,ctx);
		left=val; }
	emit(je(left),'interp #'+interp_n+' returning');
	return left; }
function interp(x, ctx, left, right) {
	if($sym(x)!='$parsetree') return make(make('x should be parse tree','$param'),'$err');
	if(!tdict(ctx)) return make('interp(): bad ctx','$err');
	x=$data(x);
	let arity=x[1];
	x=x[0]; 
	if(arity==2 && tU(right)) { 
		emit(left, "INTERP ARITY 2 function, returning projection.."); 
		return function(y) { emit("ARITY 2 INNER"); return interp(x, ctx, left, y); }
	}
	let r=interp0(x, ctx, left);
	return tfunc(r)&&!tU(right)?r(right):r; }
function parse(c) {
	cc=c.split('');
	ccc=nest(cc,"'","'",function(v){return make(v.join(''),'$str')});
	ccc=nest(cc,"\"","\"",function(v){return make(v.join(''),'$str')});
	ccd=resolve(ccc, [ 
		/;/, function(x){return [make(' ','$ws'),make(';','$lit')]},
		/^[0-9.]+$/, function(x){noemit(x,'making number'); return make(Number(x),'$n');},
		/^\s+$/, function(x){return make(x,'$ws');},
		/^[A-Za-z0-9!@#%^&*=<>,.\/?;:'`_+-]+$/, function(x){return make(x,'$lit'); }
	]);
	ccf=wide(ccd, function(x, last_, path) {
		x=alike(x, function(x,y) {
			if($sym(x)=='$n') return make(emit($data(x)*10+$data(y),'alike-n'),'$n');
			if($sym(x)=='$lit') return make($data(x)+$data(y),'$lit'); 
			/* no return = undefined = skip */ });
		return x; });
	ccg=nest(ccf,"(",")",function(v) { return make(v,'$expr'); });
	//emit(je(ccg),'parse result');
	return make([ccg,arity(ccg)],'$parsetree');
}
function trigger(x,y,ctx) {
	ctx._triggers[y]=x;
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

function make_parsing_y_func(callback, func_type) {
	if(func_type=='$f2') 
		return make(function(x, y, ctx) {
			var y_compiled = compile(y);
			if($sym(y_compiled)=='$err') return $y_compiled;
			function helper(xx, yy, idx) { return y_compiled(xx, yy, ctx); }
			return callback(x, helper);
		},'$f2');
	
	return make(function(x, y, ctx) {
		var y_compiled = compile(y);
		if($sym(y_compiled)=='$err') return $y_compiled;
		function helper(xx, yy, idx) { return y_compiled(xx, yy, ctx); }
		return callback(x, helper);
	},'$f1');
}

function loadtext(fn) {return fs.readFileSync(tsym(fn)?$data(fn):fn,'utf8');}
var BASE=MAKERS={};
BASE['_state']={};
BASE['_triggers']={};
// TODO make a penetrative-math-operator function thing
BASE['$f1']=function(f){return function(x,ctx){
	if(ctx) { ctx._state.x=x; ctx._state.y=undefined; emit(je(ctx),'f1 new ctx'); }
	return f(x,ctx)}};
BASE['$f2']=function(f){return function(x,ctx){return function(y,ctx) { 
	emit([je(x),je(y),je(ctx)],'$f2()');
	if (ctx) { ctx._state.x=x; ctx._state.y=y; emit(je(ctx),'f2 new ctx'); }
	return f(x,y,ctx); }}} // ???
BASE['$str ## +']=make(function(x,y){emit([x,y],'strplus!');return x+y},'$f2');
BASE['arity']=make(arity,'$f1');
BASE['compile']=make(compile,'$f1');
BASE['each']=make(function(x,func,ctx) {
	var compf=projright(compile(func),ctx);
	emit(compf.toString(),'each compiled func');
	var R=each(x, compf);
	emit(R,'each-wrpaper result');
	return R;
},'$f2');
BASE['eachboth']=make_parsing_y_func(eachboth,'$f2');
BASE['eachleft']=make(function(x,func,ctx) {
	var compf=compile(func);
	emit(compf.toString(),'eachleft compiled func');
	var R=eachleft(x, function(x,y,i) {return compf(x,y,ctx)});
	emit(R,'each-wrpaper result');
	return R;
},'$f2');
BASE['eachright']=make_parsing_y_func(eachright,'$f2');
BASE['+']=make(function(x,y){
	emit([x,y],'++ ADD ++');
	if(typeof(x)=='number'&&typeof(y)=='number') return x+y;
	if(len(x)==1) x=take(x,len(y)); 
	return eachboth([x,y],function(x,y){emit([x,y],'+e');return x+y})},'$f2');
BASE['emit']=make(projright(emit,'>> FROM CODELAND'),'$f1');
BASE['get']=make(get,'$f2');
BASE['interp']=interp;
BASE['invoke']=invoke;
BASE['is']=make(assign,'$f2');
BASE['as']=make(function(x,y,ctx){return assign(y,x,ctx)},'$f2');
BASE['len']=make(len,'$f1');
BASE['make']=make(function(x,y){return make(x,y[0]!='$'?'$'+y:y);},'$f2');
BASE['$textfile']=function(fn){
	if(!fs.existsSync(fn)) return make(make(fn,'$filenotfound'),'$err'); 
	return {'$textfile':fn};}
//BASE['$textfile ## load']=make(function(x){return fs.readFileSync($data(x),'utf8');},'$f1');
BASE['$textfile ## load']=make(loadtext,'$f1');
BASE['over']=make(over,'$f2');
BASE['parse']=make(parse,'$f1');
BASE['scan']=make(over,'$f2');
BASE['take']=make(take,'$f2');
BASE['til']=make(til,'$f1');
BASE['trigger']=make(trigger,'$f2');
BASE['type']=make(type,'$f1');
// SHORT HAND:
BASE['??']=BASE['emit'];
BASE['->']=BASE['is'];
BASE['<-']=BASE['as'];
BASE['##']=BASE['make'];
BASE[',']=make(ins,'$f2');
BASE['::']=make(merge,'$f2');
BASE[';']=function(x) { emit(je(x),';'); return undefined; }

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
	c="11"; r=attempt(c); assert(r[0],11,'codeAA');
	c="10"; r=attempt(c); assert(r[0],10,'codeAA');
	c="555"; r=attempt(c); assert(r[0],555,'codeAA');
	c="(555)"; r=attempt(c); assert(r[0],555,'codeAA');
	// c=";1"; r=attempt(c); assert(r[0],1,'code;0'); XXX BIG BUG - starting with ";" breaks
	c="0;1"; r=attempt(c); assert(r[0],1,'code;1');
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
	c="'name' as 'abc'"; r=attempt(c); noemit(r);
	assert(r[0],'abc','code3b');assert(r[1],{'name':'abc'},'code4b');
	c="11,22"; r=attempt(c); assert(r[0],[11,22],'code 4b - mult');
	c="(11,22)"; r=attempt(c); assert(r[0],[11,22],'code 4b - mult');
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
	c="1+1"; r=attempt(c); assert(r[0],2,'code14');
	c="1,2+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code15');
	c="(1,2)+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code16');
	//c="'hello' is 'a' ; 'goodbye' is 'b' ; a + b"; r=attempt(c); emit(r);
	
	c="'README.md' is 'fn'; fn make '$textfile' is 'handle'; handle load"; r=attempt(c); 
	emit(r);
	assert(/pink/.test(r[0]),true,'code17');

	c="'README.md' ## '$textfile' load ??"; r=attempt(c); 
	assert(/pink/.test(r[0]),true,'code17b');
	
	c="2 is 'b';b";r=attempt(c);assert(r[0],2,'code18'); // fix for semicolon in middle of line
	//c="'emit 666;x*2' is '$mytype'; 10 make 'mytype'";r=attempt(c);
	c="2,3 type";r=attempt(c);assert(r[0],'$num','code19');
	c="'666' compile is 'myfunc'; 100 myfunc";r=attempt(c);assert(r[0],666,'compile 0');

	c="'x + 2' compile 777";r=attempt(c);assert(r[0],779,'compile 1!!');

	c="'x + 1' parse arity";r=attempt(c);assert(r[0],1,'arity 0');
	c="'(x) + 1' parse arity";r=attempt(c);assert(r[0],1,'arity 1');
	c="'y + 1' parse arity";r=attempt(c);assert(r[0],2,'arity 2');
	c="(22,5,8)::10 eachleft 'x + y'";r=attempt(c);assert(r[0],[32,15,18],'code each left');
	c="(5),(7,8,9) eachright 'x + y'";r=attempt(c);assert(r[0],[12,13,14],'code each right');
	c="(1,2,3),(7,8,9) eachboth 'x + y'";r=attempt(c);assert(r[0],[8,10,12],'code each both');

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
	if(!tU(process) && process.argv[2]) load(process.argv[2]);
	repl0();
}

function main() {
	//parsetest("(1,2,345) is 'blah'")
	//
	code_tests();
	repl();
}

main();

