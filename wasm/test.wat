(module
	(import "sys" "emit" (func $emiti (param i32)))
	(import "sys" "mem" (memory 1))

	;;(data $mem $ti (i32.const 1)))

	;;(func $make (export "make") (param $x i32) 

	(func $typeof (export "type") (param $x i32) (result i32)
		(i32.shr_u (get_local $x) (i32.const 24))
	)

	(func $til (export "til") (param $x i32) (param $r i32) (result i32)
		(% make $i i32 1 %)
		(% make $rx i32 4 %)
		(% copy 0 $i %)
		(% copy $r $rx %)

		(% amend $rx @t_int %)
		(% next $rx %)

		(% amend $rx $x %)
		(% next $rx %)

		(block (loop $loop
				(call $emiti (get_local $i))
				(% amend $rx $i %)
				(% next $rx %)
				(% next $i %)
				(br_if 1 (i32.eq (get_local $i) (get_local $x)))
				(br 0)
			))
		(get_local $r)
	)
	(func $find (export "find") 
		(param $x i32) (param $y i32) (result i32)
		(i32.const -1)
	)
	(func (export "main")
		(call $emiti (i32.const 65))
		(call $til (i32.const 7) (i32.const 0))
		drop)
	(func (export "start")
		(call $emiti (i32.const 666))
	)
)

