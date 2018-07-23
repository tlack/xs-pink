#include <cstdarg>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TMPLTN template<typename TN>

typedef unsigned char Xtype;

int emit(const double x) { printf("%f",x); return 1; }
int emit(const char* x) { printf("%s",x); return 1; };
int emit(int x) { printf("%d",x); return 1; };
int emit(int x[]) { int s=(int)sizeof(x)/sizeof(*x); for (int i=0;i<s;i++) printf("%d",x[i]); return 1; };
TMPLTN int emit(TN x,const char* label) {
	if(label) { emit(label); emit(":\n"); }
	emit(x);
	if(label) { emit("\n"); }
}

// abstract holder
class Xany;
class Xany { public: 
	Xtype type; int last; void* data;
	Xany operator[](int i); };

// XRANGE ---
class Xrange : public Xany {
	public:
	int x,y;
	Xrange(const int ax,const int ay) { x=ax;y=ay;last=ay-ax; }
	int operator[](int i) { return x+i; }
};
int emit(Xrange x) { int i; for (i=x.x;i<=x.y;i++) { emit(i); emit(","); } return 1; };
Xrange til(int x,int y) { return Xrange(x,y-1); };


// XSYM --- Short string
class Xsym : public Xany { 
	public:
	char data[8]; int n; int last; 
	Xsym(const char* x) {n=sizeof(data); memset(data,0,n); last=strlen(x); if(last>n) last=n; memcpy(data,x,last); }
	char operator[](int i) { if (i>8) return -1; return data[i]; }
	bool operator==(const Xsym x) { return memcmp(x.data,data,sizeof(x.data))==0; }
};
int emit(Xsym x) { char buf[32]={0}; memset(buf,0,sizeof(buf));memcpy(buf,x.data,sizeof(x.data)); emit(buf); return 1; };


// XVEC ---
TMPLTN class Xvec : public Xany {
	public:
	TN* data; int n; int last; 
	Xvec(const int xn) : n(xn),last(0) { if (!xn) return; data=(TN*)malloc(sizeof(TN)*n); memset(data, 0, n); };
	Xvec(const int xn, TN vals[]) { 
		n=xn; last=0; if (!xn) return; 
		data=(TN*)malloc(sizeof(TN)*n); last=xn;
		for(int i=0;i<xn;i++) data[i]=vals[i];
	};
	Xvec(TN vals[]) { Xvec(sizeof(vals)/sizeof(*vals),vals); }
	TN operator[](int i) { return data[i]; };
	int emit();
};
TMPLTN int insert(Xvec<TN>& x, const TN y); /*proto*/
TMPLTN int insert(Xvec<TN>* x, const TN y); /*proto*/
int emittype(Xvec<int> x) { emit("("); emit(x.last); emit(",int)"); }
int emittype(Xvec<double> x) { emit("("); emit(x.last); emit(",double)"); }
int emittype(Xvec<float> x) { emit("("); emit(x.last); emit(",float)"); }
TMPLTN int emittype(Xvec<TN> x) {
	emit(x.last);
}
TMPLTN int emit(Xvec<TN> x) {
	emit("["); int i; for(i=0; i<x.last; i++) { emit(x[i]); emit(","); } emit("]#");
	emittype(x);
};
TMPLTN int emit(Xvec<TN>* x) { return emit(*x); };
TMPLTN int Xvec<TN>::emit() { return ::emit(this); }
TMPLTN Xvec<TN> except(Xvec<TN> x, TN y) {
	int i,sz=0;     for(i=0;i<x.last;i++) if(x[i]!=y) sz++;
	Xvec<TN> r(sz); for(i=0;i<x.last;i++) if(x[i]!=y) insert(r,x[i]);
	return r;
}
TMPLTN Xvec<TN> except(Xvec<TN> x,Xvec<TN> y) {
	Xvec<TN> r(x.last);
	for(int i=0; i<x.last; i++) {
		int found=0;
		for(int j=0; j<y.last; j++) if(x[i]==y[j]) found++;
		if(!found) insert(r,x[i]);
	}
	return r;
}
TMPLTN int find(Xvec<TN> x,TN y) { 
	for(int i=0;i<x.last;i++){ if(x[i]==y) return i; } return -1;
}
TMPLTN Xvec<int> find(Xvec<TN> x,Xvec<TN> y) { // -1, 1, 1, -1, 2.. for each y
	Xvec<int> r(y.last);
	for(int j=0;j<y.last;j++) {
		for(int i=0;i<x.last;i++){ if(x[i]==y) {insert(r,i);break;} } 
		insert(r,-1);
	}
	return r;
}
TMPLTN int has(Xany x,TN y) { for(int i=0;i<x.last;i++) { if (x[i]==y) return 1; } return 0; }
//TMPLTN int has(Xvec<TN> x,Xvec<TN> y) { for(int i=0;i<y.last;i++) { if (has(x,y[i])) return 1; } return 0; }
TMPLTN int has(Xany x,Xany y) { for(int i=0;i<y.last;i++) { if (has(x,y[i])) return 1; } return 0; }
TMPLTN int insert(Xvec<TN>& x, const TN y) { int idx=x.last++; x.data[idx]=y; return idx; };
TMPLTN int insert(Xvec<TN>* x, const TN y) { return insert(*x,y); } //int idx=x->last++; x->data[idx]=y; return idx; };
// index X with y, and then X again with the result, until it returns the same thing twice
// returns all steps
// i.e., [ x[y], x[x[y]], x[x[x[y]]], ...
TMPLTN Xvec<TN> recurse(Xvec<TN> x, TN y) {
	TN i=y; TN last;
	Xvec<TN> r(x.n);
	while (1) {
		last=i; i=x[i];
		if(i==last) return r;
		else insert(r,i);
	};
	return r;
};
Xvec<int> til(int x) { Xvec<int> r(x); int i; for (i=0; i<x; i++) insert(r,i); return r; };
TMPLTN Xvec<int> key(Xvec<TN> x) { return til(x.last); }
TMPLTN Xvec<TN> value(Xvec<TN> x) { return Xvec<TN>(x.data); }

// XLIST ---
class Xlist : public Xvec<Xany*> {
	public: Xlist(int xn):Xvec(xn){};
};
int emit(Xlist& x) {
	emit("[ rem \"general list\".\n"); 
	for(int i=0;i<x.last;i++) { 
		Xany* z=x.data[i];
	}
	emit(" ]\n");
}
int insert(Xlist& x, Xany* y) { int idx=x.last++; x.data[idx]=y; return idx; };

// XTREE ---
TMPLTN class Xtree : public Xany {
	public: 
	Xvec<int> parents;
	Xvec<TN> data;
	int last;
	Xtree(int size) : parents(size), data(size), last(0) { };
	TN operator[](const int i) { return data[i]; };
	Xvec<TN> operator[](Xvec<int> x) {
		Xvec<TN> r(x.last); for(int i=0;i<x.last;i++) insert(r,data[x[i]]); return r;
	}
	Xvec<int> children(const int parent) {
		int sz=0;        for(int i=0;i<last;i++) if(parents[i]==parent) sz++;
		Xvec<int> r(sz); for(int i=0;i<last;i++) if(parents[i]==parent) insert(r, i);
		return r;
	};
	int adopt(const int parent, const int child) { parents[child]=parent; return child; };
	int adopt(const int parent, const Xvec<int> children) {
		for(int i=0;i<children.n;i++) parents[children.data[i]]=parent; return parent;
	};
	Xvec<int> leaves() { return except(til(last), parents); }
	Xvec<int> path(const int child) { return recurse(parents, child); };
};
TMPLTN int emit(Xtree<TN> x) {
	emit("[v: ");
	for(int i=0;i<x.last;i++) {
		emit(i);emit(":");emit(x.data[i]);
		emit(",");
	}
	emit("; p: ");
	for(int i=0;i<x.last;i++) {
		emit(i);emit(":");emit(x.parents[i]);
		emit(",");
	}
	emit("]\n");
}
TMPLTN int insert(Xtree<TN>& x, const int parent, const TN y) {
	int idx=x.last++;
	if(idx>x.data.n) return -1;
	insert(x.data, y);
	insert(x.parents, parent);
	return idx;
};


// XDICT ---
TMPLTN class Xdict : public Xany {
	public: 
	Xvec<Xsym> keys;
	Xvec<TN> data;
	int last;
	Xdict(int size) : keys(size), data(size), last(0) {};
	TN operator[](const int i) { return data[i]; };
	TN operator[](const Xsym k) { int ki=find(keys, k); return data[ki]; };
	Xvec<TN> operator[](Xvec<int> x) {
		Xvec<TN> r(x.last); for(int i=0;i<x.last;i++) insert(r,data[x[i]]); return r;
	}
};
TMPLTN int emit(Xdict<TN> x) {
	emit("{");
	for(int i=0;i<x.last;i++) { emit(x.keys[i]);emit(":");emit(x.data[i]);emit(","); }
	emit("}\n");
};
TMPLTN int insert(Xdict<TN>& x, const Xsym k, const TN v) {
	int idx=x.last++; if(idx>x.data.n) return -1;
	insert(x.keys, k); insert(x.data, v);
	return idx;
};
TMPLTN int insert(Xdict<TN>& x, const char* k, const TN v) { return insert(x,Xsym(k),v); }
TMPLTN Xvec<Xsym> key(Xdict<TN> x) { return x.keys; }
TMPLTN Xvec<TN> value(Xdict<TN> x) { return Xvec<TN>(x.data); }
TMPLTN void* constructor_shim(int n){return (void*)new TN(n);}
void* cast(int which) {
	// test code
	if(which==1) return constructor_shim< Xvec<int> >(10);
	if(which==2) return constructor_shim< Xvec<double> >(10);
	return 0;
}

typedef int (*Xfunc1Ptr) (Xany* x);
typedef int (*Xfunc2Ptr) (Xany* x, Xany* y);

// XCONTEXT ---
class Xval { 
	public:
	Xtype td,tx,ty; 
	union { Xany* d; Xfunc1Ptr f1; Xfunc2Ptr f2; }; 
	Xval(Xtype d,Xtype x,Xfunc1Ptr f1) : td(d),tx(x),ty(0),f1(f1) {};
	Xval(Xtype d,Xtype x,Xtype y,Xfunc2Ptr f2) : td(d),tx(x),ty(y),f2(f2) {};
	Xval(Xtype d,Xtype x,Xtype y) : td(d),tx(x),ty(y) {};
	Xval(Xtype d,Xany* data) : td(d),tx(0),ty(0),d(data) {}; };
int emit(Xval x) { 
	emit("(label ("); emit(x.td); emit(","); emit(x.tx); emit(","); emit(x.ty); emit("))"); };
int emit(Xval* x) { return emit(*x); }
class Xcontext : public Xdict<Xval> { public: Xcontext(int sz) : Xdict<Xval>(sz) {} };

//Xval eval(Xcontext ctx, Xsym name) {
//}

TMPLTN int mustbe(TN x, const char msg[]) { if (!x) { emit("\n\n** BLOOP **"); emit(msg); exit(1); }; return 1; }
TMPLTN int mustbe(TN x) { return mustbe(x, "assertion failed: "); }

int main() {
	Xvec<int> x(10);
	emit(x);
	Xvec<int> x2=til(100);
	emit(x2);
	emit(til(5));
	mustbe(til(5).n == 5, "til5.n");
	emit(Xrange(10,20));

	Xvec<double> xd(5);
	insert(xd,1.1);
	insert(xd,5.5);
	insert(xd,10.10);
	insert(xd,10.20);
	insert(xd,15.1);
	emit(xd, "xd");

	emit(except(xd,15.1),"xd-except-1");

	emit(find(xd,15.1),"xd-find=4");

	double f[]={5.5,15.1};
	Xvec<double> xdd(2,f);
	emit(xdd,"xdd");

	emit(except(xd,xdd),"xd-except-xdd");

	Xvec<const char*> xs(5);
	insert(xs,"hello");
	insert(xs,"goodbye");
	insert(xs,"greetings");
	emit(xs,"xs");

	emit(except(xs,"goodbye"),"xs-except");

	Xtree<double> xt(20);
	int idxa=insert(xt, 0, 0.0);
	int idxb=insert(xt, idxa, 1.0);
	int idxc=insert(xt, idxa, 2.0);
	int idxd=insert(xt, idxb, 1.5);
	int idxe=insert(xt, idxc, 2.5);
	int idxf=insert(xt, idxe, 2.75);
	emit(xt,"xt");
	emit(xt.children(idxa),"xta");
	emit(xt.children(idxb),"xtb");
	emit(xt.children(idxc));
	emit(xt.children(idxd));
	emit(xt.children(idxe));
	emit(xt.children(idxf));
	emit(xt.path(idxf),"idxf path");

	emit(xt[xt.path(idxf)],"xt of idxf path");

	Xtree<const char*> xts(5);
	int last=insert(xts, insert(xts, insert(xts, 0, "abc"), "def"), "ghi");
	emit(xts,"xts");
	emit(xts.path(last),"xts path last");

	Xvec<int>* c1=(Xvec<int>*)cast(1); insert(c1, 3); insert(c1, 6); emit(c1,"c1");
	Xvec<double>* c2=(Xvec<double>*)cast(1); insert(c2, 3.1); insert(c2, 6.1); emit(c2,"c2");

	Xsym s1("Hello");
	emit(s1);
	Xsym s2("Goodbye");
	emit(s2);

	mustbe(strlen(s1.data) == 5, "s1/s2 data ==");

	Xvec<Xsym> vecsym(3);
	insert(vecsym,Xsym("bubba"));
	insert(vecsym,Xsym("jubba"));
	insert(vecsym,Xsym("splud"));
	mustbe(vecsym.last == 3 && vecsym.data[2]==Xsym("splud"),"vecsym 1");
	emit(vecsym,"vecsym");
	emit((int)sizeof(vecsym));

	vecsym.emit();

	Xsym st("Tom");
	Xdict<int> d1(1);
	insert(d1,st,39);
	emit(d1,"d1");
	mustbe(d1["Tom"]==39,"d1 1");
	mustbe(d1.keys.last==1,"d1 2");
	mustbe(d1.data.last==1,"d1 3");
	mustbe(key(d1).last==1,"d1 4");

	Xlist xl1(10);
	insert(xl1,&st);
	emit(xl1);
	emit((int)sizeof(d1));

	Xvec<Xsym> types(32);
	emit((int)sizeof(types),"sizeof(types)");
	int tvn=insert(types,Xsym("Null"));
	int tvi=insert(types,Xsym("Int"));
	emit(tvi,"tvi");
	int tvf=insert(types,Xsym("Float"));
	emit(tvf,"tvf");
	int tv1=insert(types,Xsym("Func1"));
	int tv2=insert(types,Xsym("Func2"));
	emit(types,"types");
	
	int v1[]={1, 3, 5, 7, 9};
	Xvec<int> datav1(sizeof(v1)/sizeof(int), v1);
	emit(datav1,"datav1");

	Xcontext ctx(5);
	// Xval lblei(tv1, tvi, (Xfunc1Ptr)&emit<Xvec<int>>);
	Xval lbl(tvi, &datav1);
	emit(&lbl,"lbl");
	int lblv1=insert(ctx,"v1",lbl);
	emit(ctx,"ctx");
	emit(ctx["v1"],"ctx@'v1'");
	emit("\n\ndone!");
	return 0;
}

// idea: flip of an array/tables is obvious; flip of function is {f[y;x]}
// flip of dictionary is list of keys and list of values
/*
 
	int array_int=register("array","int");
	Xfunc xf1("x*2");
	XtypedFunc xft1(xf1,array_int,0);
	insert(Context,"times2",xft1);

*/
