const http=require('http');
const pink=require('./pink.js');
function load(ctx) {
	emit('pink_lib_web.js::load()');
	let R={};
	R.load = pink.make(function(opts,ctx) {
		emit('pink_lib_web.js::load()::load()');
		opts=$data(opts);
		emit(opts,'web load');
		emit(tarray(opts));
		emit(len(opts));
		if(!tarray(opts) || len(opts)<2) return pink.make_err('web::load','type','options should be ["code",port]');
		let code=opts[0];
		if(!tfunc(code)) { 
			if(!tstr(code)) return pink.make_err('web::load','type','options[0] must be code; string or function');
			code=pink.compile(code);
			emit(code,'compiled code');
		}
		let ss=http.createServer({},function(req,res){
			emit('got web request');
			//emit(code.toString(),'calling');
			let o=code([req,res],ctx);
			emit(o,'http cb output');
			if($sym(o)=='$str') o=$data(o);
			if(!tstr(o)) res.write(je(o))
			else res.write(o);
			res.end();
		}).listen(opts[1]);
		emit(opts[1],'web server running on port '+opts[1]);
		return make(1,'$running');
	},'$f1');
	return R;
}
module.exports=load;
