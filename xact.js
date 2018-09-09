// TODO use better array intrinsics
function xact(Scope) {
	if(!Scope) Scope=this;
	Scope.MAKERS=MAKERS={};
	Scope.MAXITER=MAXITER=5;
	Scope.SHOWASSERT=SHOWASSERT=1;
	Scope.U=U=typeof(blehhhh);
	Scope.NOEMIT=0;

	// Values: Make one..
	function make(x, newtype, makers) {
		if(!tstr(newtype)) throw 'make(): newtype::str'; // TODO declarative expects
		makers=makers||MAKERS;
		if(makers[newtype]) return makers[newtype](x,newtype);
		if(newtype[0]=='$') { var o={};o[newtype]=x;return o; }
		throw 'make(): nyi';
	}
	Scope.make=make;

	// Values: Misc..
	function amend(x,L,V) {
		if(!tarray(L)) { L=[L]; if (!tfunc(V)) V=[V]; }
		let i;
		if(tfunc(V)) for(i=0;i<L.length;i++) x[L[i]]=V(x[L[i]],i);
		else         for(i=0;i<L.length;i++) x[L[i]]=V[i];
		return x;
	} Scope.amend=amend;
	function copy(x) { 
		noemit(x,"copy in");
		if (tdict(x)) return noemit(Object.assign({},x),"copy out"); 
		if (tarray(x)) { let R=[],i; for(i=0;i<x.length;i++) R.push(copy(x[i])); return R; }
		return noemit(jd(je(x)),"copy out 2"); } Scope.copy=copy;
	function drop(x,n) {
		let st,en=len(x),i,R=[],xn=len(x);
		if(n<0) { st=0; en=xn+n; } else st=n;
		for(i=st;i<en;i++) R.push(x[i % xn]);
		return R;
	} Scope.drop=drop;
	function eq(x,y) { //emit([x,y],'equal');
		if (typeof(x)!==typeof(y)) return false;
		if (Array.isArray(x) && Array.isArray(y) && x.length!=y.length) return false;
		if (typeof(x)!=='object' && x==y) return true; //simple values - hopefully
		return JSON.stringify(x)==JSON.stringify(y); } Scope.eq=eq;
	function empty(x) { return len(x)===0; } Scope.empty=empty;
	function first(x) {
		if(!tarray(x)) throw 'first(): x::array';
		return x[0]; } Scope.first=first;
	function ins(x,y) {
		if(tstr(x)&&tstr(x)) { return x+y; }
		//if(tstr(x)&&tarray(y)&&tstr(y[0])) { return x+over(ins,y) }/*!killme*/
		if(tarray(x) && !tarray(y)) { var r=copy(x);r.push(y);return r; }
		if(tarray(x)&&tarray(y)) { var R=[]; for(var i=0;i<len(x);i++) R.push(x[i]); for(var j=0;j<len(y);j++) R.push(y[j]); return R; }
		if(tdict(x)&&tdict(y)) { return Object.assign(x,y); }
		if(tU(x)) return [y];
		return [x,y]; } Scope.ins=ins;
	function key(x) {
		if(tdict(x)) return Object.keys(x);
		if(tarray(x)) return til(len(x));
		throw 'key: '+typeof(x)+': nyi';
	} Scope.key=key;
	function last(x) {
		if(!tarray(x)) throw 'last(): x::array';
		return x[len(x)-1]; } Scope.last=last;
	function len(x) { 
		const tx=typeof(x);
		if(tarray(x)||tstr(x)) return x.length;
		else if (tx==='object') {
			if (x.hasOwnProperty('len')) return x.len();
			else if (x.hasOwnProperty('length')) { return x.length; }
			else return Object.keys(x).length;
		};
		throw 'len: bad arg '+tx;
	} Scope.len=len;
	function merge(x,y) { 
		//emit([x,y],'merge');
		if(tsym(x)&&tsym(y)) return make(y,$sym(x)); 
		return [x,y]; } Scope.merge=merge;
	function ravel(x) { return tarray(x)?x:[x]; } Scope.ravel=ravel;
	function $sym(x) { return tsym(x) ? Object.keys(x)[0] : ''; } Scope.$sym=$sym;
	function $data(x) { return tsym(x) ? Object.values(x)[0] : undefined; } Scope.$data=$data;
	function take(x,n) {
		let st,en=n,i,R=[],xn=len(x);
		if(n<0) st=xn-n; else st=0;
		for(i=st;i<en;i++) R.push(x[i % xn]);
		return R;
	} Scope.take=take;
	function value(x) {
		if(tdict(x)) return Object.values(x);
		else return x;
	} Scope.value=value;
	// Values: Math-ish
	function max(min,max) { if(tarray(min)) return Math.max.apply(null,min); else return Math.max(min,max);  }
	Scope.max=max;
	function min(mm,mx) { if(tarray(mm)) return Math.min.apply(null,mm); else return Math.min(mm,mx); }
	Scope.min=min;
	function til(x) { let R=[]; for(let i=0;i<x;i++) R=ins(R,i); emit([x,R],'til'); return R; } Scope.til=til;
	// Values: Sorting..
	function sort(retcodes, vals, keyOpt) {
		const tv=t(vals);
		if (tv==='array') {
			if (keyOpt) return vals.sort(function(a,b) {
					const ak=a[keyOpt], bk=b[keyOpt];
					return ak==bk ? 0 : (ak < bk ? retcodes[0] : retcodes[1]);
				});
			else return vals.sort(function(a,b) { return a==b?0:(a<b?retcodes[0]:retcodes[1]); });
		}
		throw 'sort(): not yet implemented'; } Scope.sort=sort;
	function asc(vals, key) { return sort([-1, 1], vals, key); } Scope.asc=asc;
	function desc(vals, key) { return sort([1, -1], vals, key); } Scope.desc=desc;
	// Values: Types..
	function t(x) { 
		if (Array.isArray(x)) return 'array';
		const t=typeof(x);
		if (x===U||t===U) return 'undef';
		if (t==='number' && Math.floor(x)==x) return 'int'; /*lame*/
		else if (t==='number') return 'float'; /*lame*/ else if (t==='function') return 'func';
		return t; /*fallthru*/ } Scope.t=t;
	function tarray(x) { return Array.isArray(x); } Scope.tarray=tarray;
	function tstr(x) { return typeof(x)==='string'; } Scope.tstr=tstr;
	function tbox(x) { return typeof(x)==='object' || Array.isArray(x); } Scope.tbox=tbox;
	function tdict(x) { return typeof(x)==='object' && !Array.isArray(x); } Scope.tdict=tdict;
	function tfunc(x) { return typeof(x)==='function'; } Scope.tfunc=tfunc;
	function tsym(x) { 
		if (!tdict(x)) return false;
		let k=Object.keys(x)[0];
		if(!k || k[0]!='$') return false;
		return true; } Scope.tsym=tsym;
	function tU(x) { return x===undefined; } Scope.tU=tU;
	// Debugging:
	Scope._req=function _req(fs) {
		if(typeof require=='undefined') throw('_req(): cannot get '+fs);
		return require(fs); }
	function assert(v,exp,msg) { 
		if (tdict(exp)) {
		} else if(!eq(v,exp)) { emit(je([v,exp]),'assertion failed: '+msg); process.exit(1); } 
		if(SHOWASSERT)emit(msg,'** PASSED:'); return v; }
	Scope.assert=assert;
	function emit(x,y){if(Scope.NOEMIT)return x; if(y!==undefined)console.log(y,': '); console.log(x);return x;} Scope.emit=emit;
	function noemit(x,y){return x;} Scope.noemit=noemit;
	function ordie(value, exc) { if(tU(value)) throw exc; else return value; } Scope.ordie=ordie;
	// System:
	function file(fn, contentsOpt) {
		var fs=_req('fs');
		if(tU(contentsOpt)) return fs.readFileSync(fn,'utf-8');
		else return fs.writeFileSync(fn,contentsOpt,'utf-8'); }
	Scope.file=file;
	function jd(x) { return JSON.parse(x); } Scope.jd=jd;
	function je(x) { return JSON.stringify(x); } Scope.je=je;
	// More trippy stuff
	function eachdict(x,f) {
		let k=Object.keys(x),kl=len(k),i=0,R=[];
		for(;i<kl;i++) R.push(f(x[k[i]],k[i],i)); 
		return R; }
	function each(x,f) { 
		emit([x,f.toString()],'each()');
		if(tdict(x)) return eachdict(x,f);
		if(!tarray(x)) x=[x];
		var R=[]; 
		for(var i=0;i<x.length;i++) R.push(f(x[i],i)); return emit(R,'each() return'); }
	Scope.each=each;
	function eachleft(x,f) {
		emit(je(x),'eachleft() x');
		emit(f,'eachleft() f');
		if(!tarray(x) || x.length != 2 || !tarray(x[0])) throw 'eachLeft(): x must be [ [1, 2, 3], 10 ]';
		const x0=x[0],x0n=x0.length,x1=x[1]; var i,R=[];
		for(i=0;i<x0n;i++) R.push(f(x0[i],x1,i));
		return R;
	} Scope.eachleft=eachleft;
	function eachright(x,f) {
		emit([x,f],'eachright');
		if(!tarray(x) || x.length != 2 || !tarray(x[1])) throw 'eachRight(): x must be [ 10, [1, 2, 3] ]';
		const x0=x[1],x0n=x0.length,x1=x[0]; var i,R=[];
		for(i=0;i<x0n;i++) R.push(f(x1,x0[i],i));
		return R;
	} Scope.eachright=eachright;
	function eachboth(x,f) {
		emit([x,f],'eachboth');
		if(!tarray(x) || x.length != 2 || !tarray(x[0]) || !tarray(x[0]) || len(x[0]) != len(x[1])) return make('eachboth: [ [1,2,3],[10,20,30] ]','$err');
		const xn=len(x[0]); var i=0,R=[];
		if(xn==1) return f(x[0],x[1],0);
		for(;i<xn;i++) { R.push(emit(f(x[0][i],x[1][i],i),'eachboth '+i)); }
		emit(je(R),'eachboth returning');
		return R;
	} Scope.eachboth=eachboth;
	function over(x,f,val) { // binary function f; (f..(f(f(x[0],x[1]),x[2]),x[3...]))
		if(!tarray(x)) throw 'over(): x must be array';
		if(tU(val)) val=x.shift();
		const xn=len(x); for(let i=0;i<xn;i++) val=f(val,x[i]);
		return val;
	} Scope.over=over;
	function projleft(f,x)  {return function(y) {return f(x,y);}} Scope.projleft=projleft;
	Scope.projleft=projleft;
	function projright(f,y) {return function(x) {return f(x,y);}} Scope.projright=projright;
	Scope.projright=projright;
	function scan(x,f,val) { // binary function f; [ f(x[0],x[1]), f(f(x[0],x[1]),x[2]), ... ]
		if(!tarray(x)) throw 'scan(): x must be array';
		if(tU(val)) val=x.shift();
		const xn=len(x); let R=[]; for(let i=0;i<xn;i++) R.push(val=f(val,x[i]));
		return R;
	} Scope.scan=scan;

	// "Recursive combinators"

	function alike(x, f) {
		//x=copy(x);
		var i,r;
		for(i=1;i<len(x);i++) {
			// emit(x[i],'alike '+i+'/'+len(x)); emit(tsym(x[i])); emit(tsym(x[i-1]));
			if(x[i]==x[i-1] ||
				 eq(x[i],x[i-1]) ||
				 (tsym(x[i]) && tsym(x[i-1]) 
				  && ($sym(x[i]) == $sym(x[i-1])))) { 
				// emit(i,'combalikematch');
				r=f(x[i-1],x[i],i);
				// emit(r,'combr');
				if(!tU(r)) { 
					x.splice(i-1, 2, r); i-=2; //emit(x,'postsplice');
				} } }
		return x;
	} Scope.alike=alike;
	function exhaust(x,f,opt) {
		var last=x,iter=0;
		while (1) { x=last; last=f(x,opt,iter); if (eq(x,last)) return last; if (iter++==MAXITER) return last; }
	} Scope.exhaust=exhaust;
	function wide(x,f,last,path) { 
		//emit(je(x),'wide');
		if(tU(x) || !tarray(x)) return x;
		let xl=x.length; if(xl==0) return x;
		if(last==undefined) last=x;
		if(path==undefined) path=[];
		let R=[];
		for (let i=0;i<xl;i++) {
			if(tarray(x[i])) { 
				var p=ins(path,i); last=wide(f(x[i],last,p),f,last,p); 
				if(!tU(last)) R.push(last); }
			else R.push(x[i]);
		}
		return R;
		//[ [ 49, 2, [ 147, 4 ] ], 8 ]
		//[ [ 7, 2, [ 21, 4 ] ], 8 ]
	}
	Scope.wide=wide;
	function deep(x,f,last,path) { 
		if(!tarray(x)) throw 'deep(): arg not list';
		let xl=x.length; if(xl==0) return x;
		if(last==undefined) last=x;
		if(path==undefined) path=[];
		let R=[];
		for (let i=0;i<xl;i++) {
			var p=ins(path,i),xi=x[i];
			//emit(xi,'deep x'+i);
			if(tsym(xi) && tarray($data(xi))) last=deep($data(xi),f,last,p);
			else if(tarray(xi)) last=deep(xi,f,last,p); 
			else last=f(xi,last,p);
			//emit(last,'deep loop last'+i);
			if(!tU(last)) R.push(last);
		}
		return R.length?R:undefined;
	}
	Scope.deep=deep;
	function get(x,idx) {
		emit([x,idx],'get');
		if(tarray(idx)) { // deep indexing:
			var R=[],i;
			var last=x;
			for(i=0; i<idx.length; i++) {
				if(tfunc(last)) last=last(idx[i]);
				else {
					if(tsym(last)) last=$data(last);
					last=last[idx[i]];
				}
			}
			return last;
		} else {
			if (tsym(x)) return $data(x)[idx];
			else if (tfunc(x)) return x(idx);
			else return x[idx]; // todo funcs
		}
	}
	Scope.get=get;
	function match(x,pattern) {
		noemit(x,'match x');
		noemit(pattern,'match pat');
		var R=[];
		function visitSym(x, last, path) { 
			if($sym(x)==pattern) R.push(path); return x; }
		function visitVal(x, last, path) { 
			if(tsym(pattern) && tsym(x) && ($sym(pattern) == $sym(x))) {
				if($data(pattern)==[]) R.push(path);
				if($data(pattern)==$data(x)) R.push(path);
			} 
			if(x==pattern) {
				R.push(path); 
			}
			return x; 
		}
		function visitAnd(x, last, path) {
			let i,j, patn=len(pattern), xn=len(x);
			for(i=0;i<xn;i++) {
				emit(i,'i');
				var matchval=[];
				var found=1;
				var xij,pj;
				for(j=0;j<patn;j++) {
					emit(j,'j');
					pj=pattern[j]; xij=x[i+j];
					if(tsym(pj) && $sym(pj) == $sym(xij)) {
						//emit([pj,$sym(pj),xij,$sym(xij)],'visitAnd match');
						continue;
					}
					if(pj == xij) continue;
					found=0;
					break;
				}
				if (found && j==patn) {
					var p=ins(path,i);
					//emit(p,'visitAnd adding path');
					//emit(i,'visitAnd i');
					//emit(xij,'visitAnd value xij');
					R.push(p); // made it this far, pattern matched
				}
			}
			return x; }
		var z;
		if(tsym(pattern)) {
			let op=$sym(pattern); 
			if(op=='$and') { pattern=$data(pattern); z=wide(x,visitAnd); }
		}
		if(pattern[0]=='$') z=deep(x,visitSym);
		else z=deep(x,visitVal);
		return R;
	}
	Scope.match=match;

	function resolve(x, patterns) {
		// patlist like
		//   [  2, numhandler, 3, numhandler, '$thing', thinghandler, elsehandler.. ]
		if(!tarray(patterns)) throw 'resolve(): patterns must be [val, func, "$sym", func, elsefunc]';
		var patn=len(patterns);
		function _resolve0(x, last, path) {
			var i;
			//emit(x,'resolve0');
			for(i=0;i<patn;i+=2) {
				if(tsym(patterns[i]) && $sym(x)==$sym(patterns[i]) ||
					 patterns[i]==x ||
					 (patterns[i].test && patterns[i].test(x))) {
					//emit([x, patterns[i]],'resolve sym match');
					var fn=patterns[i+1];
					if(tfunc(fn)) x=fn(x); else x=fn;
					//emit(x,'new value');
					break;
				}
			}
			return x;
		}
		var z=deep(x, _resolve0);
		return z;
	}
	Scope.resolve=resolve;

	function _nest0(L, open, close, cb, path) {
		//emit(je(L),'start _nest0 path='+je(path));
		const LL=L.length; var opens=[],R=[],i;
		if(LL==0) return L;
		R=L;
		for(i=0; i<LL; i++) {
			if(L[i]==close) { 
				if (opens.length==0) throw 'nest(): imbalanced';
				var oidx=opens.pop();
				var inner=R.slice(oidx+1, i); 
				//emit(je(R),'presplice');
				if(cb) { inner=noemit(cb(inner),'nest-inner-cb'); }
				R.splice(oidx, i-oidx+len(open)+len(close)-1, inner);
				//emit(je(R),'recurse');
				return _nest0(R, open, close, cb, ins(path,i));
				//emit([oidx,i],'replacing');
				//emit(ins(path,i),'_nest0 path');
			} else {
				if(L[i]==open) opens.push(i);
			}
		}
		//emit(R,'_end nest0 '+path);
		return R;
	}
	function _nest1(L, open, close, cb, path) {
		//emit(L,'start _nest1 '+path);
		const LL=L.length; var opens=[],R=[],i;
		if(LL==0) return L;
		R=L;
		for(i=0; i<LL; i++) {
			if(L[i]==open) {
				if(len(opens)==0) { opens.push(i); continue; }
				//emit(i,'found close');
				if (opens.length==0) throw 'nest(): imbalanced';
				var oidx=opens.pop();
				var inner=R.slice(oidx+1, i); 
				//emit(R,'presplice');
				if(cb) { inner=noemit(cb(inner),'nest-inner-cb'); }
				R.splice(oidx, i-oidx+len(open)+len(close)-1, inner);
				//emit(je(R),'recurse');
				return _nest1(R, open, close, cb, ins(path,i));
				//emit([oidx,i],'replacing');
				//emit(ins(path,i),'_nest0 path');
			}
		}
		//emit(R,'_end nest1 '+path);
		return R;
	}
	function nest(L, open, close, handlecb) {
		if(!tarray(L)) throw('nest(): L::array');
		L=[L];
		//emit(je(L),"nest in");
		var nestfn=(open == close)?_nest1 : _nest0;
		R=wide(L,function(x,last,path){return nestfn(x,open,close,handlecb,path);});
		//emit(je(R),'nest out');
		return R;
	}
	Scope.nest=nest;
	Scope.selftest=function() {

		assert($sym(make(1,'$z')),'$z','sym0');
		assert(tsym(make(2,'$bbbb')),true,'sym1');

		assert(asc([4,1,7]),[1,4,7],'asc0');
		assert(desc([4,1,7]),[7,4,1],'desc0');
		assert(take([1,2,3],1),[1],'take0');
		assert(take([1,2,3],0),[],'take1');
		assert(take([1,2,3],4),[1,2,3,1],'take2');
		assert(drop([1,2,3],1),[2,3],'drop0');
		assert(drop([1,2,3],0),[1,2,3],'drop1');
		assert(drop([1,2,3],-1),[1,2],'drop2a');
		assert(drop([1,2,3],-2),[1],'drop2b');
		assert(drop([1,2,3],-3),[],'drop2c');
		function mul(x,y){return x*y;}
		assert(over([3,5,7],mul),105,'over0');
		assert(over([5,7],mul,3),105,'over1');
		assert(scan([3,5,7],mul),[15,105],'scan0');
		assert(scan([5,7],mul,3),[15,105],'scan1');
		assert(eachleft([ [1,2,3], 10 ],mul),[10,20,30],'el0');
		assert(eachright([ 5, [6,7,8] ],mul),[30,35,40],'er0');
		assert(eachboth([ [4,5,6],[3,4,5] ],mul),[12,20,30],'eb0');
		assert(exhaust(10, function(x) { return x <= 5 ? x : x-1; }),5,'exhaust0');
		var t=[[1,2,[3,4]],8];
		var a=deep(t,function(x){return x*2;});
		emit(a);
		assert(last(a),16,'deep0');assert(len(a),2,'deep1');assert(a[0][2][0],6,'deep2');
		var aa=deep(t,function(x){if (x%2==0) return x*10;});
		assert(aa,[[20,[40]],80],'deep3');
		var b=wide(t,function(x){emit(x,'wide-b-x'); if (!tarray(x[0])) x[0]=x[0]*7;return x;});
		emit(b,'finalb');
		assert(last(b),8,'wide0'); assert(b[0][0],7,'wide1'); assert(b[0][2][0],21,'wide2');
		var t_sym=[ {'$name':'Bob'}, make(30,'$age'), {'$parents':[{'$name':'Olga'},make('Sam','$name')]} ];
		var c=deep(t_sym,function(x){emit(x,'deep');if($sym(x)=='$name')return make($data(x).toUpperCase(),'$name');return x;});
		emit(je(c),'c');
		assert($data(first(c)),'BOB','deep0sym');

		var c=deep(t_sym,function(x){emit(x,'t_sym_f'); if ($sym(x)=='$age') return x;});
		emit(c,'wide-c');
		assert(len(c)==1 && $sym(first(c)),'$age','wide1sym');
		var d=match(t_sym, '$name');
		var e=eachright([t_sym,d],get);
		assert(len(e),len(d),'match-er-0');
		emit(t_sym);
		emit(d);
		emit(e);
		assert($sym(last(e)),'$name','match-er-1');

		o=nest("1(2)".split(''),"(",")");
		assert(len(o),1,'nest0'); assert(len(o[0]),2,'nest1'); assert(len(o[0][1]),1,'nest2');

		o=nest("(1)".split(''),"(",")");
		emit(o);
		assert(len(o),1,'nest3'); assert(len(o[0]),1,'nest4'); assert(len(o[0][0]),1,'nest5');

		o=nest("(module)".split(''),"(",")");
		emit(o);
		o2=wide(o[0],function(x){emit(x,'o2-wide'); return x.join('');});
		emit(o2);

		o=nest("(1(2)(3))".split(''),"(",")");
		each(o,emit);

		o=first(nest("(1 2)".split(''),"(",")"));
		each(o,emit);
		flatten=function(x) { return wide(x, function(x){return x.join('');}); }
		o2=flatten(o);
		emit(je(o2));
		var q=[1, 2, [3, 4]];
		amend(q,0,5);
		assert(q[0],5,'amend0');
		qq=amend(q,[0,1],[8,9]);
		assert(qq,[8,9,[3,4]],'amend1');
		qqq=amend(q,2,function(x){return [x[0]*2,x[1]*3]});
		assert(qqq,[8,9,[6,12]],'amend2');

		var d=[1], p=[1], r=match(d,p);
		assert(r,[[0]],'m1-t1');
		var d=[1], p=make([1],'$and'), r=match(d,p);
		emit(d,'d');
		emit(p,'p');
		emit(r,'r');
		assert(r,[[0]],'m1-t2');
		var d=[1], p=make([1,2],'$and'), r=match(d,p);
		assert(r,[],'m1-t3');
		var d=[[1,2]], p=make([1,2],'$and'), r=match(d,p);
		assert(r,[[0,0]],'m1-t4');
		var d=[1,2], p=make([1],'$and'), r=match(d,p);
		assert(r,[[0]],'m1-t5');

		var md=[[1,2]];
		var m1=match(md,make([1,2],'$and'));
		assert(m1,[[0,0]],'match AND 1');
		var m1=match(md,make([1,2,1],'$and'));
		assert(m1,[],'match AND 2');
		assert(match([[1,2,1]],make([1,2],'$and')),[[0,0]],'match AND 3');
		assert(match([[1,2,1]],make([2,1],'$and')),[[0,1]],'match AND 4');
		assert(match([[1,2,1]],make([1,2,1],'$and')),[[0,0]],'match AND 5');

		var d=[[1,2,1]], p=['$and',[1]], r=match(d,p);
		emit(r,'r');

		var f7=function(x,y){return 7};
		var r=alike([1,1,3,1,3],f7); assert(r,[7,3,1,3],'alike0');
		assert(alike([[1,2],[1,2],[1,3],1,[1,4]],f7),[7,[1,3],1,[1,4]],'alike1');

		assert(key({'a':1,'b':2}),['a','b'],'key0');
		assert(key({'a':1}),['a'],'key1');
		assert(key([4,5,3]),[0,1,2],'key2');

		assert(til(3),[0,1,2],'til0');

		assert(resolve([1,2,3],[1,function(x){return 999;}]),[999,2,3],'resolve0');
		assert(resolve([1,2,3],[5,function(x){return 999;}]),[1,2,3],'resolve1');
		assert(resolve([1,2,1],[1,function(x){return 999;}]),[999,2,999],'resolve2');
		assert(resolve([make(1,'$x'),2],[make([],'$x'),function(x){return 999;}]),[999,2],'resolve3');
		emit('all tests','passed');
	}
	return Scope;
}

if(typeof(module)!='undefined') {
	module.exports = xact; 
}

