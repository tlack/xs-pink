_TX class Xtree : public Xany {
	public: 
	Xvec<int> parents;
	Xvec<Tx> data;
	int last,n;
	Xtree(int size) : parents(size), data(size), last(0), n(size) { };
	Tx operator[](const int i) { return data[i]; };
	Xvec<Tx> operator[](Xvec<int> x) { Xvec<Tx> r(len(x)); for(int i=0;i<x.len();i++) insert(r,data[x[i]]); return r; }
	void amend(const int idx, const int parent, Tx y) { if(idx>n) throw "limit"; data.amend(data, idx, y); parents[idx]=parent; }
	void amend(const int idx, Tx y) { if(idx>n) throw "limit"; data.amend(data, idx, y); }
	Xvec<int> children(const int parent) {
		int sz=0;        for(int i=0;i<last;i++) if(parents[i]==parent) sz++;
		Xvec<int> r(sz); for(int i=0;i<last;i++) if(parents[i]==parent) insert(r, i);
		return r;
	};
	int adopt(const int parent, const int child) { parents[child]=parent; return child; };
	int adopt(const int parent, Xvec<int>& children) { for(int i=0;i<children.len();i++) parents[children[i]]=parent; return parent; };
	void deep(const int parent, 
			void (*f)(Xtree* x, const int child, void* opt_data), 
			bool recurse, void* opt_data) {
		for (int i=0; i<last; i++) {
			if(parents[i]==parent) { 
				f(this,i,opt_data); if (recurse && i) deep(i, f, recurse, opt_data); }
		} }
	Tx get(int i) { return data[i]; }
	int insert(const int parent, Tx data_) { int i=data.insert(data_); parents.insert(parent); last=i+1; return i; }
	Xvec<int> leaves() { return except(til(last), parents); }
	int len() { return parents.len(); }
	Xvec<int> path(const int child) { return recurse(parents, child); };
	int parent(const int child) { return parents[child]; }
	int pred(const int child) {
		// previous child key, of the siblings of this child (i.e., same parent)
		// returns self if first child
		int thispar=parents[child],lastkey=child;
		for(int i=0;i<child;i++) if(parent[i]==thispar) lastkey=i;
		return lastkey;
	}
	void repr(OS& o) { o<<"tree("; for(int i=0;i<last;i++) { o<<i<<":"<<get(i); if(i<last-1)o<<",";} o<<")"; }
	int succ(const int child) {
		// next child key, of the siblings of this child (i.e., same parent)
		// returns self if first child
		int thispar=parents[child],lastkey=child;
		for(int i=child+1;i<last;i++) {
			if(parent[i]==thispar) return i;
		}
		return child;
	}
};
_TX int insert(Xtree<Tx>& x, int i, Tx d) { return x.insert(i,d); }
_TX int insert(Xtree<Tx>* x, int i, Tx d) { return x->insert(i,d); }
_TX int len(Xtree<Tx>& x) { return x.len(); }
_TX int len(Xtree<Tx>* x) { return x->len(); }

static int test_xt_deep_n = 0;
_TX void test_xt_deep(Xtree<Tx>* x, int child, void* data) {
	emit(child,"visiting");
	test_xt_deep_n++;
}

void test_xtree() {
	emit("test(xtree)");
	auto xt=Xtree<Xsym*>(20);
	auto s1=Xsym("Coco"),s2=Xsym("Molly"),s3=Xsym("Josef"),s4=Xsym("Arca");
	int i1=insert(xt,0,&s1),i2=insert(xt,0,&s2),i3=insert(xt,1,&s3),i4=insert(xt,1,&s4);
	_test("xtree1",xt.len(),4); _test("xtree2",xt.parent(i4),1);
	auto p1=xt.path(i4); _test("xtree3",len(p1),2); _test("xtree4",p1[0],1); _test("xtree5",p1[1],0);
	auto p2=xt.leaves(); _test("xtree6",len(p2),2); _test("xtree7",p2[0],2); _test("xtree8",p2[1],3);
	xt.deep(0, test_xt_deep, false, nullptr);
	_test("xtree/deep0",test_xt_deep_n,2);
	test_xt_deep_n=0;
	xt.deep(0, test_xt_deep, true, nullptr);
	_test("xtree/deep1",test_xt_deep_n,4);
	emit("test(xtree) done");
}


