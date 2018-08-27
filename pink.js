// 
// pink in javascript
// 

require('./xact.js')(global);

MAKERS['err']=function(val) { return make(val,'$err'); }

MAKERS['f1']=function(f){return function(x,ctx){emit([x,ctx],'f1');;return f(x,ctx)}};
MAKERS['f2']=function(f){return function(x,ctx){return function(y,ctx) { ctx._state['x']=x;ctx._state['y']=y; return f(x,y,ctx); }}} // ???

var BASE={};
BASE['_state']={};
BASE[',']=make(ins,'f2');
BASE['each']=make(function(left,right,ctx) {
	emit([left,right],'each');
	if(!tarray(left)) left=[left];
	right=parse(right);
	emit(right,'each code');
	var r=each(left,function(x,i) {
		emit(x,'each inner - calling interp');
		var r=interp(right,ctx,x);
		emit(r,'each inner - interrupt result');
		return r;
	});
	return r;
},'f2');

BASE['+']=make(function(x,y){x=ravel(x),y=ravel(y); if(len(x)==1) x=take(x,len(y)); emit([x,y],'+'); return eachboth([x,y],function(x,y){return x+y})},'f2');
BASE['get']=make(get,'f2');
BASE['interp']=interp;
BASE['invoke']=invoke;
BASE['is']=make(function(left,right,ctx) {
			emit([left,right],'is() main');
			if(!tstr(right)) return make('err',['is','nyi']);
			if($sym(right)!='$str') return emit(ctx[right]=left,'str');
			return make('err',['is',[left,right]]); },'f2');
BASE['len']=make(len,'f1');
BASE['parse']=make(parse,'f1');
BASE['take']=make(take,'f2');
BASE['til']=make(til,'f1');
BASE['type']=make(function(x) {
	function test_array(x, type) { return x.every(function(y) { return typeof(y)==type; }); }
	if(tsym(x)) return $sym(x);
	if(tarray(x)) {
		var r=merge(take(x,3),take(x,-3));
		if(test_array(r,'number')) return make(len(r),'$num');
		if(test_array(r,'string')) return make(len(r),'$str');
	}
	var u=t(x);
	if(u=='int') return make(1,'$num');
	if(u=='string') return make(len(x),'$str');
	return u;
},'f1');
emit(BASE);
function context() { var o=Object.assign({},BASE); return o; }

function invoke(litname, left, ctx) {
	emit([litname,left],'invoke');
	//var val=get(ctx, litnam;
	// if(tU(obj)) return 
	var val=ctx[litname];
	emit(val,'invoke found');
	if(tfunc(val)) {
		emit(left,'invoking function with arg');
		if(tU(left)) return val; else return val(left, ctx);
	}
	//return make(make(litname,'$name'),'$err');
	//throw 'invoke(): couldnt figure out '+je(obj);
	return make(make(litname,'not_found'),'err');
}

function interp(x, ctx, left) {
	emit(je(x),'interp');
	emit(je(ctx),'interp');
	var xn=len(x),i,xi,sy,data,val;
	for(i=0;i<xn;i++){
		emit(i);
		if($sym(left)=='$err') return left;
		xi=x[i]; sy=$sym(xi); data=xi[1];
		emit(x[i],'interp '+i); emit(left,'interp left '+i); emit(sy); emit(data);
		if(sy=='$ws') continue;
		if(sy=='$lit') {
			//var val=get(ctx, d);
			//var val=ctx[d]; emit(val,'eval get'); 
			emit('interp-branch-c');
			left=invoke(data, left, ctx); continue;
		}
		val=undefined;
		if(tarray(xi)&&!sy) { emit('interp recursing'); val=interp(xi,ctx,left); }
		else if(sy=='$str'||sy=='$n') { emit('interp value'); val=data; }
		else if(sy=='$expr') { emit('interp expr'); val=interp(data, ctx, undefined); emit(val,'result'); }
		if(tfunc(left)) val=left(val,ctx);
		left=val;
	}
	return left;
}

function parse(c) {
	// cc=each(c.split(''),projright(make,'$rawch'));
	cc=c.split('');
	emit(cc);
	ccc=nest(cc,"'","'",function(v){return ['$str',v.join('')]});
	ccd=resolve(ccc, [ 
		/^[0-9.]+$/, function(x){emit(x,'making number'); return make(Number(x),'$n');},
		/^\s+$/, function(x){return make(x,'$ws');},
		/^[A-Za-z0-9!@#%^&*=<>,.\/?;:'`_+-]+$/, function(x){return make(x,'$lit'); }
	]);
	ccf=nest(ccd,"(",")",function(v) { return make(v,'$expr'); });
	ccg=wide(ccf, function(x, last_, path) {
		x=alike(x, function(x,y) {
			emit([x,$sym(x),y,$sym(y)],'ca-cb');
			if($sym(x)=='$n') return make(x[1]*10+y[1],'$n');
			if($sym(x)=='$lit') return make(x[1]+y[1],'$lit');
			// no return = undefined = skip
		});
		return x;
	});
	emit(je(ccg),'ccg');
	//var cch=match(ccg[0],make([make([],'$n'),','],'$and'));
	//return cch;
	return ccg;
}

function attempt(code) {
	emit(code,'attempt..');
	var C=context(); emit(C);
	var r=C.interp(C.parse(code),C);
	emit(r,'attempt result'); emit(C,'attempt context');
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
	c="2,3 is 'z'"; r=attempt(c);
	assert(r[0],[2,3],'code1a'); assert(r[1],{'z':[2,3]},'code1b');
	c="til 4"; r=attempt(c);
	assert(r[0],[0,1,2,3],'code2a');
	c="4 til"; r=attempt(c); emit(r);
	assert(r[0],[0,1,2,3],'code2b');
	c="'abc' is 'name'"; r=attempt(c); emit(r);
	assert(r[0],'abc','code3');assert(r[1],{'name':'abc'},'code4');
	c="(2,3) is 'z'"; r=attempt(c);
	assert(r[0],[2,3],'code5a'); assert(r[1],{'z':[2,3]},'code5b');
	c="(2,3) take 1 is 'z'"; r=attempt(c);
	assert(r[0],[2],'code6a'); assert(r[1],{'z':[2]},'code6b');
	c="2 type"; r=attempt(c); emit(r);
	assert(r[0],['$num',1],'code7a');
	c="(2,3) each 'til'"; r=attempt(c);
	assert(r[0],[[0,1],[0,1,2]],'code8a');
	c="(2,3) each 'til' each 'len'"; r=attempt(c);
	assert(r[0],[2,3],'code9');
	c="'hello' len"; r=attempt(c); assert(r[0],5,'code10');
	c="'hello' get 1"; r=attempt(c); assert(r[0],'e','code11');
	c="1,2,3"; r=attempt(c); assert(r[0],[1,2,3],'code-ll-0');
	c="(2,3,4,5) get 0"; r=attempt(c); emit(r); assert(r[0],2,'code12');
	c="(2,3,4,5) get 1"; r=attempt(c); assert(r[0],3,'code13');
	c="1+1"; r=attempt(c); assert(r[0],[2],'code14');
	c="1,2+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code15');
	c="(1,2)+(3,4)"; r=attempt(c); assert(r[0],[4,6],'code16');
	emit('code tests passed!');
}

function main() {
	//parsetest("(1,2,345) is 'blah'")
	//
	code_tests();
}

main();

