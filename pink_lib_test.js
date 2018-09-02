emit(MAKERS)
emit(global)

function make_test(type) {
	module.exports = {
		'make': make(function(x) {
			emit(x,'pink_lib_test make()');
			return x;
		},'$f2'),
		'+': make(function(x,y) {
			x=$data(x); y=$data(y);
			emit([x,y],'pink_lib_test +()');
			return makelike((x + 2) + (y + 3),x);
		},'$f2')
	}
}

