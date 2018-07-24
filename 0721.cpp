/* 0721: embrace methods */
#include <math.h>
#include <cstdarg>
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

using OS=std::ostream;
using std::cout;

#define _TX template<typename Tx>
#define _TXN template<typename Tx,int N>
_TX void emit(Tx x,const char* lbl) { cout<<lbl<<":"<<x<<"\n"; }
void emit(const char* s) { std::cout<<s<<"\n"; }
void emit(int i) { std::cout<<i; }
void emit(double i) { std::cout<<i; }
int min(int a,int b) { return a<b?a:b; }
int max(int a,int b) { return a>b?a:b; }
_TX void _test(const char* n, Tx got, Tx expected) {
	if(got==expected) emit(n,"passed");
	else { emit(n,"FAILED"); emit(expected,"expected"); emit(got,"got"); exit(1); }
}

// exceptions we toss about
class XLengthErr{};
class XValueErr{};

// abstract holder
class Xany;
class Xany { 
	public:
	virtual void repr(std::ostream&os) { os<<"any()"; }
};
std::ostream& operator<<(std::ostream &os,Xany& x) { x.repr(os); return os; }
void emit(Xany& x,const char* lbl) { cout<<lbl<<": ";x.repr(cout);cout<<"\n"; }
void emit(Xany* x,const char* lbl) { cout<<"z";cout<<lbl<<": ";x->repr(cout);cout<<"\n"; }
void emit(Xany& x) { x.repr(std::cout); emit("\n"); }
void emit(Xany* x) { emit(*x); }
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
bool operator==(const char* x, Xsym y) { return strncmp(x,y.data,min(strlen(x),sizeof(y.data)))==0; }
bool operator==(Xsym x, const char* y) { return strncmp(x.data,y,min(strlen(y),sizeof(x.data)))==0; }
void test_xsym() {
	emit("test(xsym)");
	Xsym a("hello");
	_test("xsym 1",strncmp(a.data,"hello",5),0);
	Xsym b("hello");
	_test("xsym 2",a,b);
	Xsym c("hell"); Xsym d("helloo");
	_test("xsym 3",a==c,false);
	_test("xsym 4",a==d,false);
	_test("xsym 5",c==d,false);
	_test("xsym 6",a==b,true);
}
//TMPL(Tx,Ty) typedef Ty *(Xiter1)(Tx x, int n);
_TX class Xvec;
_TX class Xiter : public Xany {
	public:
	virtual ~Xiter(){}
	virtual Tx operator[](int n)=0;
	virtual int find(Tx x)=0;
	virtual bool has(Tx x) { return find(x)!=-1; }
	virtual int len(){return 0;}
	virtual void repr(OS& o) {  o<<"iter()"; } 
	//virtual int insert(Tx x)=0;
};
_TX void emit(Xiter<Tx>& x,const char* s) { emit(s); emit(x); }
_TX void emit(Xiter<Tx>* x,const char* s) { emit(s); emit(x); }
_TX bool empty(Xiter<Tx>& x) { return x.len()==0; }
_TX Tx get(Xiter<Tx>& x, int n) { return x[n]; }
_TX Tx get(Xiter<Tx>* x, int n) { return (*x)[n]; }
_TX int len(Xiter<Tx>& x) { return x.len(); }
_TX int len(Xiter<Tx>* x) { return x->len(); }

class Xrange : public Xiter<int> {
	public:
	Xrange(int st_,int end_):start(st_),end(end_){_len=end-start;};
	int operator[](int n){return start+n;}
	int find(int x) { if(x>start && x<end) return x-start; else return -1; }
	bool has(int x) { return find(x)!=-1; }
	int len() { return _len; }
	void repr(OS& o) { o<<"range("; for(int i=start;i<end;i++)o<<i<<",";o<<end<<")"; } 
	//virtual int insert(Tx x)=0;
	int _len, start, end;
};

void test_xrange() {
	auto r1=Xrange(10,20);
	_test("xrange 1",len(r1),10);
	_test("xrange 2",r1[0],10);
	_test("xrange 3",r1[9],19);
	_test("xrange 4",r1.len(),10);
	_test("xrange 5",r1.has(13),true);
	_test("xrange 6",r1.find(13),3);
}

_TX class Xmutable : public Xiter<Tx> {
	public:
	virtual void amend(int i,Tx y)=0;
};

_TX class Xvec : public Xmutable<Tx> {
	public:
	Xvec(int n_) : data(new Tx[n_]),n(n_),_len(0) {};
	Xvec(int n_,const Tx x[]) : n(n_),data(new Tx[n_]),_len(n_) { for(int i=0;i<n_;i++)data[i]=x[i]; };
	// ~Xvec() { delete data; }
	Tx operator[](int i) {return data[i];}
	virtual void amend(Xvec<char> x,Tx y) { 
		emit("aa");
		for(int i=0;i<x._len;i++) {
			int z=(int)x[i]; emit(z); 
			amend(z,y); 
		}
	};
	virtual void amend(Xvec<char> x,Xvec<Tx> y) { 
		emit("ab");
		for(int i=0;i<x._len;i++) {
			int z=(int)x[1]; emit(z); amend((int)x[i],y[i]); 
		}
	};
	virtual void amend(Xvec<int> x,Xvec<Tx> y) { for(int i=0;i<x._len;i++) amend(x[i],y[i]); };
	virtual void amend(int i,Tx y) { emit(i,"ai1"); emit(y,"ai2"); if(i>-1 && i<_len) data[i]=y; };
	virtual int find(Tx x) { for (int i=0; i<_len; i++) if(data[i]==x) return i; return -1; }
	virtual int insert(Tx x) { if (_len>=n) return -1; data[_len++]=x; return _len-1; }
	virtual int len() { return _len; }
	void repr(OS& o) { 
		o<<"vec("<<_len<<",("; 
		for(int i=0;i<_len;i++) { o<<data[i]; if(i<_len-1) o<<","; } o<<"))"; }
	int _len; Tx* data; int n; 
};
typedef Xvec<int> Xint;
typedef Xvec<char> Xstr;
_TX void amend(Xmutable<Tx>& x, int i, Tx y) { x.amend(i,y); }
//_TX void amend(Xvec<Tx>& x, Xvec<int> i, Xvec<Tx> y) { x.amend(i,y); }
_TX void amend(Xvec<Tx>& x, Xvec<int>& i, Xvec<Tx> y) { x.amend(i,y); }
//_TX void amend(Xvec<Tx>& x, Xvec<char> i, Tx y) { x.amend(i,y); }
_TX void amend(Xvec<Tx>& x, Xvec<char>& i, Tx y) { x.amend(i,y); }
//_TX void amend(Xvec<Tx>& x, Xvec<char> i, Xvec<Tx> y) { x.amend(i,y); }
_TX void amend(Xvec<Tx>& x, Xvec<char>& i, Xvec<Tx> y) { x.amend(i,y); }
_TX void amend(Xvec<Tx>* x, int i, Tx y) { x->amend(i,y); }
//_TX void amend(Xvec<Tx>* x, Xvec<int> i, Xvec<Tx> y) { x->amend(i,y); }
_TX void amend(Xvec<Tx>* x, Xvec<int>& i, Xvec<Tx> y) { x->amend(i,y); }
//_TX void amend(Xvec<Tx>* x, Xvec<char> i, Tx y) { x->amend(i,y); }
_TX void amend(Xvec<Tx>* x, Xvec<char>& i, Tx y) { 
	emit("amend, v*, v&, tx");
	emit(x);
	x->amend(i,y); }
//_TX void amend(Xvec<Tx>* x, Xvec<char> i, Xvec<Tx> y) { x->amend(i,y); }
_TX void amend(Xvec<Tx>* x, Xvec<char>& i, Xvec<Tx> y) { x->amend(i,y); }
template<typename Tx,typename Ty> Xvec<Tx>* each(Xiter<Tx>& x, Xvec<Ty> y){ // return y according to x
	int n=x.len(),i=0; auto R=new Xvec<Tx>(n); 
	for(;i<n;i++)insert(R,y[x[i]]); return R; }
template<typename Tx,typename Ty>  Xvec<Tx>* each(Xiter<Tx>& x, Xvec<Ty>* y){ return each(x,*y); }
_TX Xvec<Tx>* each(Xiter<Tx>& x, Tx (*cb)(Tx,int)){ 
	int n=x.len(),i=0; auto R=new Xvec<Tx>(n); 
	for(;i<n;i++)insert(R,cb(x[i],i)); return R; }
_TX Xvec<Tx>* each(Xiter<Tx>& x, Xvec<Tx>* (*cb)(Xiter<Tx>&)) { return cb(x); }
_TX void emit(Xvec<Tx>& x,const char* s) { emit(s); emit(x); }
_TX void emit(Xvec<Tx>* x,const char* s) { emit(s); emit(x); }
_TX Xvec<Tx>* get(Xiter<Tx>& x, Xvec<Tx>*y) { 
	int n=y.len(),i; auto R=new Xvec<Tx>(n);
	for(i=0;i<n;i++)insert(R,x[y[i]]); return R; }
_TX int insert(Xvec<Tx>& x, Tx y) { return x.insert(y); }
_TX int insert(Xvec<Tx>* x, Tx y) { return x->insert(y); }
_TX int len(Xvec<Tx>& x) { return x.len(); }
_TX Tx over(Xiter<Tx>& x, Tx(*cb)(Tx,Tx)) {
	if(empty(x)) throw "length";
	Tx r=x[0]; int n=len(x),i; for(i=1;i<n;i++)r=cb(r,x[i]); return r;  }
_TX Xvec<Tx>* scan(Xiter<Tx>& x, Tx(*cb)(Tx,Tx)) {
	if(empty(x)) throw "length";
	int n=len(x),i; Tx last; auto r=new Xvec<Tx>(n); 
	insert(r,last=x[0]); for(i=1;i<n;i++)insert(r,last=cb(last,x[i])); return r;  }
_TX Xvec<Tx>* take(Xiter<Tx>& x, int n) {
	if(len(x)==0) return new Xvec<Tx>(0); 
	auto R=new Xvec<Tx>(abs(n));
	int xn=len(x),i=0;
	if (n<0) { n=abs(n)+1; i=xn-n+1; }
	for(; i<n; i++) insert(R,x[i % xn]);
	return R;
}

double test_xvec_f1(double x, int i) {
	return x*i;
}
Xvec<double>* test_xvec_f2(Xiter<double>& x) {
	auto r=new Xvec<double>(len(x));
	for(int i=0;i<len(x);i++) insert(r,x[i]*i);
	return r;
}
double test_xvec_f3(double x,double y) { emit(x,"f3/1"); emit(y,"f3/2"); return x*y; }
void test_xvec() {
	emit("test(xvec)");
	Xvec<int> v1(2); _test("xvec 1",v1.n,2); _test("xvec 2",v1._len,0);
	v1.insert(9); _test("xvec 3",v1._len,1); _test("xvec 4",v1.data[0],9); _test("xvec 5",v1.n,2);
	insert(v1,10); _test("xvec 6",v1._len,2); _test("xvec 7",v1.data[v1._len-1],10);
	Xstr v2(5,"Hello");
	v2.amend(1,'x'); _test("xvec amend 1",v2.data[1],'x');
	int i2[]={0,1}; int i3[]={55,66}; v1.amend(Xvec<int>(2,i2),Xvec<int>(2,i3));
	_test("xvec amend 2",v1[0],55); _test("xvec amend 3",v1[1],66);
	Xvec<double> v3(3); insert(v3,10.10); insert(v3,20.20); insert(v3,30.30);
	_test("xvec double 1",v3[0],10.10); _test("xvec double _len",v3._len,3);
	Xvec<double>* v4=each(v3,test_xvec_f1);
	_test("xvec each 1",v4->_len,v3._len); _test("xvec each 2",v4->data[0],0.0);
	_test("xvec each 3",v4->data[1],20.20); _test("xvec each 4",v4->data[2],60.60);
	delete v4;
	auto v5=each(v3,test_xvec_f2);
	_test("xvec each/all 1",v5->_len,v3._len); _test("xvec each/all 2",v5->data[0],0.0);
	_test("xvec each/all 3",v5->data[1],20.20); _test("xvec each/all 4",v5->data[2],60.60);
	delete v5;
	auto v6=over(v3,test_xvec_f3); _test("xvec over double",abs(v6),6181);
	Xvec<double>* v7=scan(v3,test_xvec_f3);
	_test("xvec scan/1",abs((*v7)[0]),10); _test("xvec scan/2",abs((*v7)[1]),204);
	_test("xvec scan/3",abs((*v7)[2]),6181); _test("xvec scan/4",len(v7),3);
	auto v8=take(v3,4);
	_test("take/1",len(v8),4); _test("take/2",v8->len(),4);
	_test("take/3",(*v8)[0],v3[0]); _test("take/4",(*v8)[1],v3[1]);
	_test("take/3a",(*v8)[2],v3[2]); _test("take/4a",(*v8)[3],v3[0]);
	auto v9=take(v3,-2);
	_test("take/5",len(v9),2); _test("take/6",v9->len(),2);
	_test("take/7",(*v9)[0],v3[1]); _test("take/8",(*v9)[1],v3[2]);
}
template <typename Tk,typename Tx> class Xmap : public Xiter<Tx> {
	public:
	Xmap(int n_) : key(n_),data(n_),n(n_),_len(0) {}; 
	Xmap(int n_, Tk k[], Tx x[]) : key(n_),data(n_),n(n_),_len(0) {
		for(int i=0;i<n_;i++) { key.insert(k[i]); data.insert(x[i]); } _len=n_; }
	//~Xmap(){delete key; delete data;}
	Tx operator[](Tk i) { return data[key.find(i)]; }
	Tx operator[](Tk* i) { return data[key.find(*i)]; }
	Tx operator[](int i) { return data[i]; }
	void amend(Tk x,Tx y) { int i=key.find(x); if(i!=-1) data.amend(i,y); }
	void amend(Tk* x,Tx y) { amend(*x,y); }
	void amend(Xvec<Tk> x,Xvec<Tx> y) {
		if (x._len!=y._len) throw "length"; for(int i=0;i<x._len;i++) amend(x[i],y[i]);
	}
	int find(Tx x) { for (int i=0; i<n; i++) if(data[i]==x) return i; return -1; }
	int insert(Tk x,Tx y) { if (_len>=n) return -1; key.insert(x); data.insert(y); return _len++; }
	int insert(Tk* x,Tx y) { return insert(*x,y); }
	int len() { return _len; }
	void repr(OS& o) { o << "map(" << _len << "," << key << "," << data << ")"; }
	Xvec<Tk> key; Xvec<Tx> data; int n,_len; char* tag="map"; };
_TX class Xdict : public Xmap<Xsym,Tx> {
	public:
	typedef Xmap<Xsym,Tx> super;
	Xdict(int n):Xmap<Xsym,Tx>(n){};
	Xdict(int n,Xsym k[],Tx x[]):Xmap<Xsym,Tx>(n,k,x){};
	void repr(OS& o) { o << "dict(" << super::_len << "," << super::key << "," << super::data << ")"; }
	char* tag="dict";
};

void test_xmap() {
	emit("test(xmap)");
	Xmap<Xsym,int> v1(3);
	_test("v1 empty", v1._len, 0); _test("v1 len",v1.len(),0); _test("v1 n", v1.n, 3);
	long i1[]={1, 2, 3, 4};
	double d1[]={1.1, 2.2, 3.3, 4.4};
	Xmap<long,double> v2(4, i1, d1);
	_test("v2 1",v2._len,4); _test("v2 2",v2.n,4);
	_test("v2 3",v2[long(1)],1.1); _test("v2 4",v2[long(4)],4.4);
	_test("v4 5",len(v2),4); _test("v4 6",v2.len(),4);
	v2.amend(long(3), 9.9); _test("v2 5",v2[long(3)],9.9);
	Xdict<int> v3(2); _test("v3 1",v3._len,0); _test("v3 2",v3.n,2);
	Xdict<int> v4(3);
	Xsym x1("Hello"); Xsym x2("Goodbye");
	int idx1=v4.insert(x1,33),idx2=v4.insert(x2,55);
	_test("v4 1",v4.n,3); _test("v4 2",v4._len,2); _test("v4 3",v4[x1],33); _test("v4 4",v4[x2],55);
	v4.amend(x2,88); _test("v4 5",v4[x2],88);
	v4.insert(new Xsym("barf"),111); _test("v4 6",v4[new Xsym("barf")],111);
	v4.amend(new Xsym("barf"),999); _test("v4 6-amend",v4[new Xsym("barf")],999);
}
class Xlist : public Xvec<Xany*> {
	public:
	Xlist(int sz):Xvec<Xany*>(sz){};
	void repr(OS& o){o<<"list("<<len()<<",";int n=len(),i;for(i=0;i<n;i++){data[i]->repr(o);if(i<n-1)o<<":";}o<<")";}
};
_TX int insert(Xlist& x, Tx y) { return x.insert(y); }
_TX int insert(Xlist* x, Tx y) { return x->insert(y); }
void test_xlist() {
	emit("test(xlist)");
	Xlist L(5); 
	Xsym s1("abc"); Xsym s2("defghi");
	Xvec<int> v(3); insert(v,9); insert(v,8); insert(v,7);
	L.insert(&s1); insert(L, &s2); insert(L,&v); L.insert(&s2);
	_test("xlist1",len(L),4); _test("xlist2",*(Xsym*)L[0]==s1,true);
	_test("xlist3",*(Xsym*)L[1]==s2,true); _test("xlist4",(*(Xvec<int>*)L[2])[0]==v[0],true);
	_test("xlist5",*(Xsym*)L[3]==s2,true); _test("xlist6",L.len(),4);
}
class Xlinklist : public Xiter<Xany*> {
	public:
	typedef Xlinklist* list;
	Xlinklist():item(nullptr),next(nullptr){};
	Xlinklist(int sz):item(nullptr),next(nullptr){};
	Xlinklist(Xany* ptr):item(ptr),next(nullptr){};
	int find(Xany* ptr) {
		if(item && item==ptr) return true;
		if(next) return next->find(ptr); else return false;
	}
	int insert(Xany* ptr) {
		if(item==nullptr) { item=ptr; return 0; }
		if(next==nullptr) { next=new Xlinklist(ptr); return 1; }
		else return 1+next->insert(ptr);
	}
	Xany* get(int i){ 
		if(i==0) { if(item) return item; else throw "index"; }
		if(next==nullptr) throw "index"; else return next->get(i-1); }
	Xany* operator[](int i){return get(i);}
	int len() { 
		if(item==nullptr) return 0; 
		if(next) return 1+next->len();
		else return 1;
	}
	void repr(OS& o) { o<<"("; if(item) { item->repr(o); if(next) { o<<":"; next->repr(o); } } o<<")"; }
	Xany* item; Xlinklist* next;
};
int insert(Xlinklist& x,Xany* y) { return x.insert(y); }
int insert(Xlinklist* x,Xany* y) { return x->insert(y); }
int len(Xlinklist& x) { return x.len(); }
int len(Xlinklist* x) { return x->len(); }
void test_xlinklist() {
	emit("test(xlinklist)");
	Xlinklist L;
	_test("LL/1",len(L),0); _test("LL/2",L.len(),0);
	Xvec<int> a(3); insert(a,5);insert(a,6);insert(a,7);
	insert(L,&a);
	_test("LL/3",len(L),1); _test("LL/4",((Xvec<int>*)L[0])->len(),3);
	Xsym s("Blah"); insert(L,&s); _test("LL/5",(Xsym*)L[1],&s);
}

_TXN class Xarray : public Xmutable<Tx> {
	public:
	Xarray():n(N),_len(0){};
	Xarray(int sz):n(N),_len(0){};
	Xarray(int n_,const Tx x[]) : n(N) { _len=min(N,n_); for(int i=0;i<_len;i++)data[i]=x[i]; };
	Tx operator[](int i) {return data[i];}
	void amend(Xvec<int> x,Xvec<Tx> y) { for(int i=0;i<x._len;i++) amend(x[i],y[i]); };
	void amend(int i,Tx y) { if(i>-1 && i<_len) data[i]=y; };
	int find(Tx x) { for (int i=0; i<_len; i++) if(data[i]==x) return i; return -1; }
	int insert(Tx x) { if (_len>=n) throw "length"; data[_len++]=x; return _len-1; }
	int len() { return _len; }
	void repr(OS& o) { 
		o<<"array("<<_len<<",("; 
		for(int i=0;i<_len;i++) { o<<data[i]; if(i<_len-1) o<<","; } o<<"))"; }
	//virtual int insert(Tx x)=0;
	Tx data[N];
	int _len,n;
};
_TXN int insert(Xarray<Tx,N>& x,Tx y){return x.insert(y);}
_TXN int insert(Xarray<Tx,N>* x,Tx y){return x->insert(y);}
void test_xarray() {
	emit("test(xarray)");
	auto x=Xarray<int,10>(10);
	_test("xa/1",len(x),0);_test("xa/2",x.len(),0);_test("xa/3",empty(x),true);
	insert(x,44); insert(x,55); insert(x,66);
	_test("xa/4",len(x),3); _test("xa/5",x[1],55); _test("xa/6",x[2],66);
	amend(x,0,1);
	_test("xa/7",x[0],1);
}
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
	test_xrange();
	test_xsym();
	test_xvec();
	test_xmap();
	test_genfn();
	test_xlist();
	test_xlinklist();
	test_xarray();
	emit("tests passed");
}
void parse(){
	Xstr base(1); insert(base,' ');
	auto charmap=take(base,256);
	emit(charmap);
	char nums[]="0123456789"; Xstr num(strlen(nums),nums);
	emit(num);
	amend(charmap,num,'n');
	emit(charmap,"num");
	char ops[]="+-/*"; Xstr op(strlen(ops),ops);
	emit(op);
	amend(charmap,op,'o');
	emit(charmap,"op");
	char dels[]="{}()[]'\""; Xstr del(strlen(dels),dels);
	emit(dels);
	amend(charmap,del,'{');
	emit(charmap,"final");
	char code[]="{1+23}";
	Xstr s(strlen(code),code);
	emit(s);
	auto r=each(s, charmap);
	emit(r);

	/*
	 * x="abcdef"
	 *
	 */
}
int main() {
	test();
	//parse();
	emit("exiting");
	return 0;
}

/*
 
 xxx single item value xsingle<int>
 xxx ponder delete behavior visavis xlist
 xxx dict tag <- ??

 types of functions:
 atomic: +, *, ..
 scalar: sum, count, ..
 generative: open, read, ..     // .. all others

	
	"0123456789"->"nums".
	"1+2" state (nums:"n",
	
	xxx 


*/
