/* 0721: embrace methods */

#include <cstdarg>
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
using OS=std::ostream;

#define TMPL(X) template<typename X>
TMPL(Tx) void emit(Tx x,const char* lbl) { std::cout<<lbl<<": "<<x<<"\n"; }
void emit(const char* s) { std::cout<<s<<"\n"; }
void emit(int i) { std::cout<<i; }
int max(int a,int b) { return a>b?a:b; }
TMPL(Tx) void _test(const char* n, Tx got, Tx expected) {
	if(got==expected) emit(n,"passed");
	else {
		emit(n,"FAILED");
		emit(expected,"expected");
		emit(got,"got");
		exit(1);
	}
}

// abstract holder
class Xany;
class Xany { 
	public:
	virtual void repr(std::ostream&os) { os<<"any()"; }
};
std::ostream& operator<<(std::ostream &os,Xany& x) { x.repr(os); return os; }
void emit(Xany& x) { x.repr(std::cout); emit("\n"); }
void test_xany() {
	Xany x;
	emit(x,"test(xany)");
}
class Xsym : public Xany {
	public: 
	Xsym() {strcpy(data,"*?sym?*");}
	Xsym(const char* s) {memset(data,0,sizeof(data)); strncpy(data,s,max(strlen(s),sizeof(data)));};
	void repr(std::ostream& os) { os<<"sym('"<<data<<"')"; }
	char data[8];
};
bool operator==(Xsym x, Xsym y) { return strncmp(x.data,y.data,sizeof(x.data))==0; }
void test_xsym() {
	emit("test(xsym)");
	Xsym a("hello");
	//emit(a);
	_test("xsym 1",strncmp(a.data,"hello",5),0);
	Xsym b("hello");
	_test("xsym 2",a,b);
	Xsym c("hell");
	Xsym d("helloo");
	_test("xsym 3",a==c,false);
	_test("xsym 4",a==d,false);
	_test("xsym 5",c==d,false);
	_test("xsym 6",a==b,true);
}
//TMPL(Tx,Ty) typedef Ty *(Xiter1)(Tx x, int n);
TMPL(Tx) class Xiter : public Xany {
	public:
	virtual Tx operator[](int n)=0;
	virtual int find(Tx x)=0;
	bool has(Tx x) { return find(x)!=-1; }
	bool empty() { return last==0; } 
	void repr(OS& o) {  o<<"iter("<<last<<")"; } 
	//virtual int insert(Tx x)=0;
	int last;
};
TMPL(Tx) Tx apply(Xiter<Tx>& x, int n) { return x[n]; }
TMPL(Tx) class Xvec : public Xiter<Tx> {
	public:
	Xvec(int n_) : data(new Tx[n_]),n(n_),last(0) {};
	Xvec(int n_,const Tx x[]) : n(n_),data(new Tx[n_]),last(n_) { emit(n_); for(int i=0;i<n_;i++)data[i]=x[i]; };
	Tx operator[](int i) {return data[i];}
	void amend(Xvec<int> x,Xvec<Tx> y) { for(int i=0;i<x.last;i++) amend(x[i],y[i]); };
	void amend(int i,Tx y) { if(i>-1 && i<last) data[i]=y; };
	Xvec<Tx> each(Xvec<Tx>(*callback)(Xvec<Tx>)) { return callback(*this); }
	Xvec<Tx> each(Tx(*callback)(Tx,int)) { 
		int i; Xvec<Tx> r(last);
		for(i=0;i<last;i++) r.insert(callback(data[i], i)); return r;
	}
	int find(Tx x) { for (int i=0; i<last; i++) if(data[i]==x) return i; return -1; }
	int insert(Tx x) { if (last>=n) return -1; data[last++]=x; return last-1; }
	void repr(OS& o) { 
		o<<tag<<"("<<last<<",("; 
		for(int i=0;i<last;i++) { o<<data[i]; if(i<last-1) o<<","; } o<<"))"; }
	Tx* data; int n; int last; char* tag="vec";
};
TMPL(Tx) int insert(Xvec<Tx>& x, Tx y) { return x.insert(y); }
TMPL(Tx) void amend(Xvec<Tx>& x, int i, Tx y) { x.amend(i,y); }
TMPL(Tx) void amend(Xvec<Tx>& x, Xvec<int> i, Xvec<Tx> y) { x.amend(i,y); }
TMPL(Tx) Xvec<Tx> each(Xvec<Tx>& x, Tx(*cb)(Tx,int)) { return x.each(cb); }
typedef Xvec<int> Xint;
typedef Xvec<char> Xstr;

double test_xvec_f1(double x, int i) {
	return x*i;
}
Xvec<double> test_xvec_f2(Xvec<double> x) {
	Xvec<double> r(x.last);
	for(int i=0;i<x.last;i++) r.insert(x[i]*i);
	return r;
}
void test_xvec() {
	emit("test(xvec)");
	Xvec<int> v1(2);
	_test("xvec 1",v1.n,2);
	_test("xvec 2",v1.last,0);
	v1.insert(9);
	_test("xvec 3",v1.last,1);
	_test("xvec 4",v1.data[0],9);
	_test("xvec 5",v1.n,2);
	insert(v1,10);
	emit(v1);
	_test("xvec 6",v1.last,2);
	_test("xvec 7",v1.data[v1.last-1],10);
	Xstr v2(5,"Hello");
	emit(v2);
	v2.amend(1,'x');
	_test("xvec amend 1",v2.data[1],'x');
	emit(v2);
	int i2[]={0,1};
	int i3[]={55,66};
	v1.amend(Xvec<int>(2,i2),Xvec<int>(2,i3));
	_test("xvec amend 2",v1[0],55);
	_test("xvec amend 3",v1[1],66);

	Xvec<double> v3(3);
	insert(v3,10.10); insert(v3,20.20); insert(v3,30.30);
	Xvec<double> v4=v3.each(test_xvec_f1);
	emit(v4);
	_test("xvec each 1",v4.last,v3.last);
	_test("xvec each 2",v4.data[0],0.0);
	_test("xvec each 3",v4.data[1],20.20);
	_test("xvec each 4",v4.data[2],60.60);
	Xvec<double> v5=v3.each(test_xvec_f2);
	emit(v5);
	_test("xvec each/all 1",v5.last,v3.last);
	_test("xvec each/all 2",v5.data[0],0.0);
	_test("xvec each/all 3",v5.data[1],20.20);
	_test("xvec each/all 4",v5.data[2],60.60);
}
class Xvalerr{};
template <typename Tk,typename Tx> class Xmap : public Xiter<Tx> {
	public:
	Xmap(int n_) : key(n_),data(n_),n(n_),last(0) {}; 
	Xmap(int n_, Tk k[], Tx x[]) : key(n_),data(n_),n(n_),last(0) {
		for(int i=0;i<n_;i++) { key.insert(k[i]); data.insert(x[i]); } last=n_; }
	Tx operator[](Tk i) { return data[key.find(i)]; }
	Tx operator[](Tk* i) { return data[key.find(*i)]; }
	Tx operator[](int i) { return data[i]; }
	void amend(Tk x,Tx y) { int i=key.find(x); if(i!=-1) data.amend(i,y); }
	void amend(Tk* x,Tx y) { amend(*x,y); }
	void amend(Xvec<Tk> x,Xvec<Tx> y) {
		if (x.last!=y.last) throw Xvalerr();
		for(int i=0;i<x.last;i++) amend(x[i],y[i]);
	}
	int find(Tx x) { for (int i=0; i<n; i++) if(data[i]==x) return i; return -1; }
	int insert(Tk x,Tx y) { 
		if (last>=n) return -1; key.insert(x); data.insert(y); 
		return last++; }
	int insert(Tk* x,Tx y) { insert(*x,y); }
	void repr(OS& o) { o << tag << "(" << last << "," << key << "," << data << ")"; }
	Xvec<Tk> key; Xvec<Tx> data; int n,last; char* tag="map"; };
TMPL(Tx) class Xdict : public Xmap<Xsym,Tx> {
	public:
	typedef Xmap<Xsym,Tx> super;
	Xdict(int n):Xmap<Xsym,Tx>(n){};
	Xdict(int n,Xsym k[],Tx x[]):Xmap<Xsym,Tx>(n,k,x){};
	void repr(OS& o) { o << tag << "(" << super::last << "," << super::key << "," << super::data << ")"; }
	char* tag="dict";
};

void test_xmap() {
	emit("test(xmap)");
	Xmap<Xsym,int> v1(3);
	_test("v1 empty", v1.last, 0);
	_test("v1 n", v1.n, 3);
	long i1[]={1, 2, 3, 4};
	double d1[]={1.1, 2.2, 3.3, 4.4};
	Xmap<long,double> v2(4, i1, d1);
	_test("v2 1",v2.last,4);
	_test("v2 2",v2.n,4);
	_test("v2 3",v2[long(1)],1.1);
	_test("v2 4",v2[long(4)],4.4);
	v2.amend(long(3), 9.9);
	_test("v2 5",v2[long(3)],9.9);
	Xdict<int> v3(2);
	_test("v3 1",v3.last,0);
	_test("v3 2",v3.n,2);
	Xdict<int> v4(3);
	Xsym x1("Hello");
	Xsym x2("Goodbye");
	int idx1=v4.insert(x1,33);
	int idx2=v4.insert(x2,55);
	_test("v4 1",v4.n,3);
	_test("v4 2",v4.last,2);
	_test("v4 3",v4[x1],33);
	_test("v4 4",v4[x2],55);
	v4.amend(x2,88);
	_test("v4 5",v4[x2],88);
	v4.insert(new Xsym("barf"),111);
	_test("v4 6",v4[new Xsym("barf")],111);
	v4.amend(new Xsym("barf"),999);
	_test("v4 6-amend",v4[new Xsym("barf")],999);
}
class Xcontext : public Xany {
};

void test_genfn() {
	emit("test(genfn)");
	Xsym v_ss("imasym");
	double dd[]={10,11,12,13,14.5};
	size_t z=sizeof(dd)/sizeof(*dd);
	Xvec<double>v_dd(z, dd);
	int ii[]={10,9,8};
	Xint v_ii(3,ii);
	typedef void (emitfn)(Xany& x);
	emitfn* f1;
	f1=&emit;
	f1(v_ss); f1(v_dd); f1(v_ii); 
	//f1(v_vd);
}
void test() {
	test_xany();
	test_xsym();
	test_xvec();
	test_xmap();
	test_genfn();
	emit("tests passed");
}
int main() {
	test();
	emit("exiting");
	return 0;
}

/*
 
 xxx dict tag

 types of functions:
 atomic: +, *, ..
 scalar: sum, count, ..
 generative: open, read, ..     // .. all others


*/
