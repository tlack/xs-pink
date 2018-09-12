// 
// pink in javascript
//

PX={};
if(typeof(require)!='undefined') {
	require('./xact.js')(PX);
	var fs=require('fs'); }
PX.amend(global, PX.key(PX), PX.value(PX));
function assign(left,right,ctx) {
	emit([left,right,ctx],'assigning..');
	if(!tstr(right)) return make(['y is non-string','nyi'],'$err');
	if (tstr(right)) { ctx[right]=left; return left; }
	return make(make('assign y must be string','$nyi'),'$err'); }
PX.assign=assign;
function arity(parsetree) {
	emit(je(parsetree),'arity ptree');
	if($sym(parsetree)=='$parsetree') parsetree=$data(parsetree);
	var m=match(parsetree,make('y','$lit'));
	var LY=len(m);
	emit([m,LY],'arityy');
	return LY > 0 ? 2 : 1;
}
PX.arity=arity;
function call(x, y, ctx) {
	emit(x,'call() x');
	emit(y,'call() y');
	if(tfunc(x)) return x(y,ctx);
	let sx=$sym(x),dx=$data(x);
	emit(sx);emit(dx);
	if(sx=='$f1') { return dx(y,ctx); } 
	//else if (sx=='$f2') { return make([f,y],'$p2'); }
	else if (sx=='$p1') { let f=dx[0]; return f(y,ctx); }
	else if (sx=='$p2') { let f=dx[0]; return f(dx[1],y,ctx); }
	return make_err(call,'type','x argument not understood');
} PX.call=call;
function tcallable(x) {
	let t=type(x), ok='func $f1 $f2 $p1 $p2'.split(/ /);
	return ok.includes(t);
} PX.tcallable=tcallable;
function lookup(litname, left, ctx) {
	let val=undefined;
	if(!tU(left)) val=ctx[type(left)+' ## '+litname];
	val=tU(val) ? ctx[litname] : val;
	if(tU(val)) return make(make(litname,'$notfound'),'$err');
	return val; }
PX.lookup=lookup;
var INTERP_N=0; 
function interp0(x, ctx, left, right) {
	var interp_n=INTERP_N++;
	if(len(x)==1 && tarray(x[0])) return interp0(x[0], ctx, left, right);
	//emit(je(x),'interp #'+interp_n+' entering with code');
	//emit(je(left),'interp #'+interp_n+' entering with left');
	//emit(je(right),'interp #'+interp_n+' entering with right');
	//emit(je(ctx),'interp #'+interp_n+' entering with ctx');
	//emit(ctx,'and data');
	let xn=len(x),i,xi,sy,data,val;
	let _state={};
	_state.x=left;
	_state.y=right;
	emit(_state.x,'interp0 state.x');
	left=undefined;
	for(i=0;i<xn;i++){
		if($sym(left)=='$err') return left;
		xi=x[i]; sy=$sym(xi); data=$data(xi);
		//emit([je(xi),left],'interp x['+i+']/left'); 
		emit(xi,'interp() #'+interp_n+' loop '+i);
		val=left;
		$from_expr=0;
		if(sy=='$ws') continue;
		else if(sy=='$lit') {
			if (data=='y') {
				//emit(ctx,'ctx at time of y reference');
				val=emit(_state.y,'replacement for "y"');
			} else if (data=='x') {
				//emit(ctx,'ctx at time of x reference');
				val=emit(_state.x,'replacement for "x"');
			} else {
				val=lookup(data, left, ctx); 
				//emit(val,'interp lit result for "'+data+'"');
				if($sym(val)=='err') return val; }
		}
		else if(sy=='$str'||sy=='$n') { emit('interp n/str value'); val=data; }
		else if(sy=='$expr') { noemit('interp expr'); val=interp0(data, ctx, _state.x, _state.y); $from_expr=1; noemit(val,'result'); }
		else if(tarray(xi) && !sy) { noemit('interp recursing'); val=interp0(xi,ctx,_state.x,_state.y); }
		//emit([left?left.toString():'(U)',val?val.toString():'(U)'],'intr');
		if(1) { //||!tU(val)) {
			emit(val,'v');
			if($from_expr || !tcallable(val)) {
				if(tcallable(left)) val=emit(call(left, val, ctx),'interp left() result');
			} else {
				if(!tU(left)) val=emit(call(val, left, ctx),'interp val() result');
			}
			/*
			if(tcallable(val) && !tU(left) && !tcallable(left)) {
				emit('calling val');
				val=call(val,left,ctx);
			} 
			else 
			if (tcallable(left)) { 
				emit('calling left');
				val=call(left,val,ctx);
			}
			*/
			/*
			if ($sym(left)=='$p2') {
				//emit(left,'invoking projection..');
				emit('interp invoking projection');
				let proj=$data(left), fn=proj[0];
				val=fn(proj[1],val,ctx); } 
			else if (tfunc(val) && !tU(left)) { emit('interp invoking val'); val=val(left,ctx); } 
			else if (tfunc(left)) { emit('interp invoking default left'); val=left(val,ctx); }
			*/
			emit(val,'interp lookup !tU(val) result'); 
		}
		left=emit(val,'interp #'+interp_n+' x['+i+']/final left'); 
	}
	noemit(je(left),'interp #'+interp_n+' returning');
	return left; }
function interp(x, ctx, left, right) {
	if($sym(x)!='$parsetree') return make(make('x should be parse tree','$param'),'$err');
	if(!tdict(ctx)) return make('interp(): bad ctx','$err');
	emit(x,'interp()');
	x=$data(x);
	let arity=x[1];
	x=x[0]; 
	/*if(arity==2 && tU(right)) { 
		emit(left, "INTERP ARITY 2 function, returning projection.."); 
		return function(y) { emit("ARITY 2 INNER"); return interp(x, ctx, left, y); }
	}*/
	let r=interp0(x, ctx, left, right);
	return r; }
	//return tfunc(r)&&!tU(right)?r(right):r; }
PX.interp=interp;
function parse(c) {
	cc=c.split('');
	//ccc=nest(cc,'"""','"""',function(v){return make(v.join(''),'$str')});
	//ccc=nest(cc,"'''","'''",function(v){return make(v.join(''),'$str')});
	ccc=nest(cc,"'","'",function(v){return make(v.join(''),'$str')});
	ccc=nest(cc,'"','"',function(v){return make(v.join(''),'$str')});
	ccd=resolve(ccc, [ 
		/;/, function(x){return [make(' ','$ws'),make(';','$lit')]},
		/^[0-9.]+$/, function(x){noemit(x,'making number'); return make(Number(x),'$n');},
		/^\s+$/, function(x){return make(x,'$ws');},
		/^[A-Za-z0-9!@#%^&*=<>,.\/?;:'`_+-]+$/, function(x){return make(x,'$lit'); }
	]);
	ccf=wide(ccd, function(x, last_, path) {
		x=alike(x, function(x,y) {
			if($sym(x)=='$n') return make($data(x)*10+$data(y),'$n');
			if($sym(x)=='$lit') return make($data(x)+$data(y),'$lit'); 
			if($sym(x)=='$str') return make($data(x)+$data(y),'$str'); 
			/* no return = undefined = skip */ });
		return x; });
	ccg=nest(ccf,"(",")",function(v) { return make(v,'$expr'); });
	//emit(je(ccg),'parse result');
	return make([ccg,arity(ccg)],'$parsetree');
}
PX.parse=parse;
function trigger(x,y,ctx) {
	ctx._triggers[y]=x;
}
PX.trigger=trigger;
function type(x) {
	function test_array(x, type) { return x.every(function(y) { return typeof(y)==type; }); }
	if(tsym(x)) return $sym(x);
	if(tarray(x)) {
		var r=ins(take(x,3),take(x,-3));
		emit(r,'type tarray');
		if(test_array(r,'number')) return '$num';
		if(test_array(r,'string')) return '$str';
		return 'array'; //i see more difficult general list handling in my near future
	}
	var u=t(x);
	if(u=='int') return '$num';
	if(u=='string') return '$str';
	return u;
}
PX.type=type;
function compile(code, force_arity) {
	// Returns a function like f(x, ctx) that will do interp(code,ctx,x);
	emit(code,'compile()');
	if(!tstr(code)) return make('compile: code is string','$err');
	let ptree=parse(code);
	//let a=arity(ptree);
	//emit(a,'_###_#_#__##_ ARITY');
	//emit(je(ptree),'compile() parse tree');
	if(tU(force_arity)) force_arity=$data_ptree[1];
	if(force_arity==2) { emit('compile(): making arity 2 func');
		return function compiled_inner_2(left, right, ctx) {
			//emit([je(left),je(right),je(ctx)],'compile2 - inner');
			return interp(ptree, ctx, left, right); }
	} else { // emit('compile(): making arity 1 func');
		return function compile_inner_1(left, ctx){
			//emit([je(left),je(ctx)],'compile1 - inner');
			//emit(je(ctx),'compile - inner ctx');
			return interp(ptree, ctx, left); }
	}
}
PX.compile=compile;
function case_(x,y,ctx) {
	let yn=len(y),yi=0,yy,ysucc,r;
	for(;yi<yn-1;yi+=2) {
		yy=y[yi]; ysucc=y[yi+1];
		if(tfunc(yy)) {
			r=yy(x,ctx);
			if(r) r=ysucc; break;
		} else if (eq(yy,x)) {
			r=ysucc; break;
		}
	}
	if(!tU(r)) return r;
	if(yn%2==1) {
		r=y[yn-1];
		if(tfunc(r)) return r(x,ctx);
		else return r;
	}
	return x;
}
PX.case_=case_;
function dict(x, y, ctx) {
	if((!tarray(x) && !tarray(y)) || len(x) != len(y)) { x=[x]; y=[y]; }
	return make([x,y],'$dict');
}
PX.dict=dict;
function dictget(x,y) { 
	let xx=$data(x),i;
	if((i=xx[0].indexOf(y)) != -1)
		return xx[1][i];
	return make_err('$dict ## get','key');
} PX.dictget=dictget;
function dictkey(x, ctx) {
	return $data(x)[0];
} PX.dictkey=dictkey;
function dictlen(x) { return $data(x)[0].length; } PX.dictlen=dictlen;
function dictvalue(x, ctx) { return $data(x)[1]; } PX.dictvalue=dictvalue;
function dictins(x, y, ctx) {
	if($sym(y)=='$dict') {
		let d=$data(x), yy=$data(y), yn=len(yy[0]), yi;
		emit([x,yy],'dictins');
		for(yi=0;yi<yn;yi++) { d[0].push(yy[0][yi]); d[1].push(yy[1][yi]); }
		return {'$dict':d};
		//return x;
	} else  return make_err('$dict ## ins', 'type');
} PX.dictins=dictins;
function make_err(func_name, type, val) {
	return make([func_name, type, val],'$err');
} PX.make_err=make_err;
function make_parsing_y_func(callback, inner_func_type) {
	//emit(inner_func_type,'make_parsing_y_func');
	if(inner_func_type=='$f2') 
		return make(function parsed_f2_outer(x, y, ctx) {
			var y_compiled = !tfunc(y) ? compile(y,2) : y;
			emit(y,'make_parsing_y_func() compiled');
			if($sym(y_compiled)=='$err') return y_compiled;
			function parse_helper2(xx, yy, idx) { emit([xx,yy],'make_parsing_y_func helper/2'); return y_compiled(xx,yy,ctx); }
			return callback(x, parse_helper2);
		},'$f2');
	return make(function parsed_f1_outer(x, y, ctx) {
		var y_compiled = !tfunc(y) ? compile(y,1) : y;
		if($sym(y_compiled)=='$err') return y_compiled;
		function parse_helper(xx, idx) { emit(xx,'make_parsing_y_func helper/1'); return y_compiled(xx, ctx); }
		return callback(x, parse_helper);
	},'$f2');
}
function importas(fn,type,ctx) {
	if(!tstr(type)) return make_err('importas','type','y should be symbol');
	if(/\.js$/.test(fn)) {
		if(tU(require)) return make_err('importas','sys','cant find require'); //browser
		var o=require(fn);
		if(!tfunc(o)) return make_err('importas','value','require didnt return load function');
		o=o(type,ctx);
		if(!tdict(o)) return make_err('importas','value','load fuction returned non-dict');
		each(o,function(v,k) { 
			if(k=='make')ctx[type] = function(x,y) { make(v(x,y),type); };
			else ctx[type+' ## '+k]=v; 
		});
		return true;
	}
	return make_err('importas','nyi','');
}
function loadjs(fn) {return require(tsym(fn)?$data(fn):fn)}
function loadpink(fn,ctx) {
	const txt=loadtext(fn);
	const p=parse(txt);
	return interp(p,ctx,fn);
}
function loadtext(fn) {return fs.readFileSync(tsym(fn)?$data(fn):fn,'utf8')}
var BASE=MAKERS={};
BASE['_base']=1;
BASE['_state']={};
BASE['_triggers']={};
// TODO make a penetrative-math-operator function thing
BASE['$f1']=function f1(f){return function f1outer(x,ctx){
	//if(ctx) { ctx._state.x=x; ctx._state.y=undefined; }
	return f(x,ctx) }};
BASE['$f2']=function f2(f){return function f2outer(x,y,ctx){
	//emit([je(x),je(y),je(ctx)],'$f2()');
	if(!tU(x)&&!tU(y)&&!tU(ctx)) return f(x,y,ctx);
	//emit(je(x),'$f2() - returning projection..'); 
	//emit(ctx,'$f2() - projection ctx'); 
	return make([f,x],'$p2'); }}
BASE['$json']=function json(x){return {'$json':je(x)}}
BASE['$p1']=function p1(func) { if(!tfunc(func)) return make_err('$p1','type'); return {'$p1':[func,undefined]}; }
BASE['$p2']=function p2(args) {
	if(!tarray(args) || len(args)!=2) return make_err('$p2','type','arg should be [func,x_arg]');
	if(!tfunc(args[0])) return make_err('$p2','type','arg[0] should be function');
	//emit(args,'p2');
	return {'$p2':args}; }
BASE['amend']=make(function(x,y) {
	if(!tarray(y) || len(y)!=2)return make_err('amend','type','y should be [[indices],[values]]');
	let i=y[0],yy=y[1];
	if(tarray(i) && tarray(yy) && len(i)!=len(yy))return make_err('amend','type','y parts should be eq len or len 1');
	return amend(x,i,yy);
},'$f2');
BASE['arity']=make(arity,'$f1');
BASE['compile']=make(compile,'$f1');
BASE['case']=make(case_,'$f2');
BASE['deep']=make_parsing_y_func(deep,'$f2');
BASE['drop']=make(drop,'$f2');
BASE['each']=make_parsing_y_func(each,'$f1');
BASE['eachboth']=make_parsing_y_func(eachboth,'$f2');
BASE['eachleft']=make_parsing_y_func(eachleft,'$f2');
BASE['eachright']=make_parsing_y_func(eachright,'$f2');
BASE['+']=make(function adder(x,y){
	emit([x,y],'++ ADD ++');
	if(typeof(x)=='number'&&typeof(y)=='number') return x+y;
	if(len(x)==1) x=take(x,len(y)); 
	return eachboth([x,y],function(x,y){emit([x,y],'+e');return x+y})},'$f2');
BASE['emit']=make(projright(emit,'>> FROM CODELAND'),'$f1');
BASE['eq']=make(eq,'$f2');
BASE['get']=make(get,'$f2');
BASE['importas']=make(importas,'$f2');
BASE['interp']=interp;
BASE['ins']=make(ins,'$f2');
BASE['is']=make(assign,'$f2');
 BASE['as']=make(function(x,y,ctx){return assign(y,x,ctx)},'$f2');
BASE['len']=make(len,'$f1');
BASE['lookup']=lookup;
BASE['key']=make(key,'$f1');
BASE['make']=make(function(x,y,ctx){return make(x,y[0]!='$'?'$'+y:y,ctx);},'$f2');
BASE['glue']=make(glue,'$f2');
BASE['load']=make(function(x,ctx){return make_err('load','arg','unsure about how to load '+x);},'$f1');
BASE['over']=make_parsing_y_func(over,'$f2');
BASE['parse']=make(parse,'$f1');
BASE['rem']=make(function(x){return undefined},'$f2');
BASE['scan']=make_parsing_y_func(scan,'$f2');
BASE['swapyx']=make(function(x,y,ctx){return call(y,x,ctx);},'$f2');
BASE['take']=make(take,'$f2');
BASE['til']=make(til,'$f1');
BASE['trigger']=make(trigger,'$f2');
BASE['type']=make(type,'$f1');
BASE['wide']=make_parsing_y_func(wide,'$f2');
// SHORT HAND:
BASE['@']=BASE['get'];
BASE['!!']=BASE['amend'];
BASE['??']=BASE['emit'];
BASE['->']=BASE['is'];
BASE['<-']=BASE['as'];
BASE['##']=BASE['make'];
BASE[',']=make(ins,'$f2');
BASE['::']=make(glue,'$f2');
BASE[';']=make(function(x){return undefined; },'$f1');

BASE['dict']=make(dict,'$f2');
BASE['$dict ## ins']=make(dictins,'$f2');
BASE['$dict ## key']=make(dictkey,'$f1');
BASE['$dict ## len']=make(dictlen,'$f1');
BASE['$dict ## value']=make(dictvalue,'$f1');
BASE[':>']=BASE['dict'];
BASE['$dict ## ,']=make(dictins,'$f2');

BASE['$str ## +']=make(function(x,y){emit([x,y],'strplus!');return x+y},'$f2');

BASE['$textfile']=function(fn){
	if(!fs.existsSync(fn)) return make(make(fn,'$filenotfound'),'$err'); 
	return {'$textfile':fn};}
//BASE['$textfile ## load']=make(function(x){return fs.readFileSync($data(x),'utf8');},'$f1');
BASE['$jsfile ## load']=make(loadjs,'$f1');
BASE['$pinkfile ## load']=make(loadpink,'$f1');
BASE['$textfile ## load']=make(loadtext,'$f1');

function context() { var o=Object.assign({},BASE); return emit(o,'new context()'); }
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
	assert(r[0],2,'code00');
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
	c="(2,3) drop 1 is 'z'"; r=attempt(c);
	assert(r[0],[3],'code6a'); assert(r[1],{'z':[2]},'code6c');
	c="2 type"; r=attempt(c); noemit(r);
	assert(r[0],'$num','code7a');
	c="(2,3) each 'x til'"; r=attempt(c);
	assert(r[0],[[0,1],[0,1,2]],'code8a');
	//NOEMIT=0;
	c="(2,3) each 'til x'"; r=attempt(c);
	assert(r[0],[[0,1],[0,1,2]],'code8b');
	c="(2,3) each 'til x' each 'x len'"; r=attempt(c);
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
	c="('666' compile) is 'myfunc'; 100 myfunc";r=attempt(c);assert(r[0],666,'compile 0');

	c="'x + 2' compile 777";r=attempt(c);assert(r[0],779,'compile 1!!');

	c="'2 + x' compile 777";r=attempt(c);assert(r[0],779,'compile 1! BBBB!');

	c="('x + 2' compile) is 'myfun'; myfun 777";r=attempt(c);assert(r[0],779,'compile 22222');

	c="('x + 2' compile) is 'myfun'; 1,2,3 each 'x myfun'";r=attempt(c);
	assert(r[0],[3,4,5],'compile 3');

	c="('2 + x' compile) is 'myfun'; 1,2,3 each 'x myfun'";r=attempt(c);assert(r[0],[3,4,5],'compile 3b');

	c="7,8,9 each ('10 + x' compile)";r=attempt(c);
	assert(r[0],[17,18,19],'compile 4');

	c="7 each ('10 + x' compile)";r=attempt(c);
	assert(r[0],[17],'compile 4b');

	c="'x + 1' parse arity";r=attempt(c);assert(r[0],1,'arity 0');
	c="'(x) + 1' parse arity";r=attempt(c);assert(r[0],1,'arity 1');
	c="'y + 1' parse arity";r=attempt(c);assert(r[0],2,'arity 2');
	c="'y + x' parse arity";r=attempt(c);assert(r[0],2,'arity 3');
	c="(1,2)::5 eachleft 'x + y'"        ;r=attempt(c);assert(r[0],[6,7],'code each left pre');
	c="(1,2)::5 eachleft '(x) + y'"      ;r=attempt(c);assert(r[0],[6,7],'code each left pre-a');
	c="(1,2)::5 eachleft '(x) + (y)'"    ;r=attempt(c);assert(r[0],[6,7],'code each left pre-b');
	c="(1,2)::5 eachleft 'x + (y)'"      ;r=attempt(c);assert(r[0],[6,7],'code each left pre-c');
	c="(1,2)::5 eachleft 'x + (y + 1)'"  ;r=attempt(c);assert(r[0],[7,8],'code each left pre-c');
	c="(1,2)::5 eachleft (+)"            ;r=attempt(c);assert(r[0],[6,7],'code each left pre raw');
	c="(22,5,8)::10 eachleft 'x + y'"    ;r=attempt(c);assert(r[0],[32,15,18],'code each left');
	c="(5)::(7,8,9) eachright 'x + y'"   ;r=attempt(c);assert(r[0],[12,13,14],'code each right');
	c="(1,2,3)::(7,8,9) eachboth 'x + y'";r=attempt(c);assert(r[0],[8,10,12],'code each both');
	c="'./test_xact.js' ## '$jsfile' load"; r=attempt(c);assert(r[0],999,'code jsfile load');
	c="'./xact.js' ## '$jsfile' load "; r=attempt(c); emit(r);
	c="5,6 each 'x + 2;x + 3'";r=attempt(c);assert(r[0],[8,9],'code each dupe x');

	c="'''a'''";r=attempt(c);assert(r[0],'a','dq a');
	c='"""123456"""';r=attempt(c);assert(r[0],'123456','dq c');

	c="1,2,3,4 amend (1::10)";r=attempt(c);assert(r[0],[1,10,3,4],'amend0');
	c="1,2,3,4 amend ((1,3)::(20,50))";r=attempt(c);assert(r[0],[1,20,3,50],'amend1');
	c="1,2,3,4 amend ((1,3)::20)";r=attempt(c);assert(r[0],[1,20,3,20],'amend2');

	c="1 eq 1";r=attempt(c);assert(r[0],true,'eq0');
	c="1 eq 2";r=attempt(c);assert(r[0],false,'eq1');
	c="1,2 eq 2";r=attempt(c);assert(r[0],false,'eq2');
	c="1 eq 2,1";r=attempt(c);assert(r[0],[false,1],'eq3');
	c="1 eq (2,1)";r=attempt(c);assert(r[0],false,'eq3haha');
	c="1,2 eq (2,1)";r=attempt(c);assert(r[0],false,'eq4');
	c="1,2 eq (1,2)";r=attempt(c);assert(r[0],true,'eq5');
	c="1,2,3 take 2 eq (1,2)";r=attempt(c);assert(r[0],true,'eq6');

	c="2 case (1,'one',2,'two',3,'three')";r=attempt(c);assert(r[0],'two','case0');
	c="1 case (1,'one',2,'two',3,'three')";r=attempt(c);assert(r[0],'one','case0b');
	c="3 case (1,'one',2,'two',3,'three')";r=attempt(c);assert(r[0],'three','case0c');
	c="4 case (1,'one',2,'two',3,'three')";r=attempt(c);assert(r[0],4,'case1')

	c="'name':>'blob',('age':>22) key";r=attempt(c);assert(r[0],['name','age'],'dict 0');
	c="'name':>'blob',('age':>22) value";r=attempt(c);assert(r[0],['blob',22],'dict 1');
	c="'name':>'blob' value";r=attempt(c);assert(r[0],['blob'],'dict 2');
	c="'name':>'blob' key";r=attempt(c);assert(r[0],['name'],'dict 3');
	c="'name':>'blob' len";r=attempt(c);assert(r[0],1,'dict 4');
	c="'name':>'blob',('age':>22) len";r=attempt(c);assert(r[0],2,'dict 5');
	emit('code tests passed!');
}

function repl(n) {
	function repl0() {
		n++;
		rl.question('pink '+n+'> ',function(x){ 
			emit(je(x),'input');
			x=x.trim();
			if(x=='') return repl0();
			if(x=='\\\\') process.exit(1);
			var p=parse(x,C);
			emit(je(p),'parsetree');
			var i=interp(p,C);
			emit(i,'result');
			//emit(C,'final context');
			return repl0();
		});
	}
	const rl=require('readline').createInterface({input:process.stdin,output:process.stdout});
	n=tU(n)?-1:n;
	var C=context();
	emit("\n\nwelcome to Pink\nuse \\\\ to exit\n\n");
	if(!tU(process) && process.argv[2]) load(process.argv[2]);
	repl0();
}

function main() {
	//parsetest("(1,2,345) is 'blah'")
	//
	if(len(process.argv)<3) {
		code_tests();
		repl();
	}
	else loadpink(process.argv[2],context());
}

module.exports=PX;
if(require.main==module) main();

/*

 TODO

 pred() / succ() for trees

*/
