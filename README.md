# pink

This is an experimental programming language called `pink`. It is philosophically derivative of K/Q, XXL, and Forth. 

There is a Javascript interpreter at present. The goal is to use this interpreter to produce semi-smart WebAssembly binaries.

## status

1/5.

Everything herein subject to change or being broken.

Still gotta do cond() and friends

## goals

These haven't been achieved:

* Easy for non-programmers to pick up. Existing programmers should find some familiar pieces.

* Extremely uniform. As little to learn as possible. No "special forms" of syntax. Should be learnable
with a one-page cheat sheet.

* Flexible and adaptable. Good concept of user-defined types and constructs to make them easy to work with.

* Symbolic, not imperative. Inspired by aspect of Mathematica and Erlang, Pink
	allows for the expression of complex models of information and relationships.

* Based on vectors and verbs that penetrate deeply into their arguments so you
	don't have to write so many god damn explicit loops.

## syntax, semantics

Pink is very simple. Here are all the rules:

There is no precedence or order of operations.

The space character is all that really matters. It's 100% whitespace agnostic otherwise.

Code that can be executed, or functions in general parlance, are called often called verbs in Pink. 
All functions (verbs) have one or two parameters, refered to as `x` and `y` inside source code.

Most syntax that you see actually made up of regular verbs, and you can redefine them for your own user-defined types. 
(This even includes comments via `rem`, annoyingly.) 

You can name a value (or verb) anything, including punctuation.

There are only five special cased characters in the Pink parser itself: expressions with `(`..`)`, strings with
`"` or `'` (which can be nested to any odd-numbered depth such as `"hello"` or `'''hello'''`).

Therefore, when referring to things, you should use spaces around every name, even operators, except for these specific
case:

Before or after any number, or `( ) " ' ;`.

In cases like 'x y z', where x is a function taking one argument, and y is a function taking two arguments, y wins.

That's it!

### Example: Messing with values

In these examples I'm going to include the Pink prompt and the results as well.
Other examples may not include the prompt, and your prompt may look different.

Also, the prompt shows things like Javascript values right now, not Pink
values. Fix on the way.

First, we generate the first ten numbers (starting from 0):

```
0> 5 til
[0, 1, 2, 3, 4]
```
Now, we save it to a variable that we name:
```
1> 5 til is "numbers"
[0, 1, 2, 3, 4]
```

(If you're an adept programmer, you might note that the assignment statement
also returns its value, so that you can assign named values in the middle of an
expression without breaking your flow. I hate that in other languages!)

Let's add them all up. `over` takes some code on the right, and performs it "in
between" each value of the thing on the left.  Some other languages call this
`reduce`. Since we already created the name "numbers", we don't have to use
quotes anymore.  Unquoted names get replaced by their values, as you'd expect.

```
2> numbers over 'x + y'
10
```

Here we wrote our "code to be executed" as just a string. One of the things I'm
exploring in Pink is encouraging the user of strings as code. (Code can also be
verified, `parse`'d into a parse tree, and turned into an interpreting
Javascript function using the `compile` verb.)

Let's check out some more verbs that do stuff with our code. 

`each` applies your code (given in `y` again) for each item, and returns it.
```
3> numbers each 'x + 20'
[20, 21, 22, 23, 24]
```
(Note that `+` actually automatically accepts vectors for either argument, so we
are only using it as a means of exposition here.)

What if we didn't want to add 20? 

`eachleft` takes an array in x of two parts: the "left" values, and the "right"
value (i.e., `( (1,2,3) :: 6 )`), and calls your code with each item in x[0]
as `x`, and `x[1]` as `y`. We use `::` to stick together the two values so that
we are sure they don't get combined into one long vector.

```
4> numbers :: 10 eachleft 'x + y'
[10, 11, 12, 13, 14]
5> numbers :: 10 eachleft (+)
[10, 11, 12, 13, 14]
```
Also notice here that we used `(+)` to refer to a function without using a code
string. This only works when you enclose the function in a subexpression with
the parentheses.

`eachright` does the same, but with the `y` parameter to your code varying, and
`x` being fixed.
```
6> 7 :: numbers eachright (+)
[7, 8, 9, 10, 11]
```

### Example: Web server that serves HTML page

```
rem "Assign two configuration variables:";
'PORT' <- 8888;
'ROOT' <- './html/';
rem "fully qualify template name, tag as '$textfile', and get contents"
ROOT , 'layout.html' ## '$textfile' load -> 'layout'; 
'emit "serving request: ", x; layout' -> 'handler';
rem "pink_lib_web is a wrapper around Node's `HTTPServer`:";
'./pink_lib_web.js' importas '$web'; 
handler :: PORT ## '$web' -> 'webserver';
webserver load;
"web server launched on on " , PORT , " in " , ROOT emit;
```

Noteworthy in this sample:

* We're using the short forms of Pink verbs here.
* When you assign to a value to a variable, you specify its name as a string. 
* You can assign variables either as `x -> y` with `y -> 'x'`. You can also use `is` or `as`. 
* In Pink, code is written as simple strings. You are encouraged to go from a
	string, to its parse tree representation and back and forth, load and restore
	it, etc.
* `importas` loads the Javascript code named in `x` and exposes its interface
	as a user-defined type given in `y`.  We use dollar signs when naming user
	types for clarity. This may be dropped in the future.
* The `pink_lib_web.js` module here defines a `load` function that expects
	an x parameter consisting of the handler callback code and the address to 
	bind the web server on, so:
* So we combine `handler` and `PORT` using
	`::`, and then tag it as a `$web` type.
* `::` (also known as `glue`) takes two un-alike things and puts
	them together in a vector. If we were to use `,` (or `insert`), and
	the types were the same, we would create one long vector, which
	would be chaos for `$web :: load`.
* `##` (or `make`) transforms values from one kind (type) to another. It's
	similar to a combination of `cast()` and parametized `new()` in other
	languages, because user defined types override `##` to create their own
	behaviors around instantiation of that type.
* Also note that we picked that name `$web` when we imported it with `importas` -
	user defined types do not have to know their own typename (when referred to
	in user code), which should avoid global conflicts. Maybe.

# All verbs thus far

`+` 
(missing all the others - ha)

`x amend y` 
Modify `x` according to `y`:

`x arity`
Tell you the number of arguments that the code in string `x` requires, either 1 or 2.

`x as y` or `x <- y`
Assign the name x to value y in the current scope. Use parentheses around y if it is a
complex expression.

`x compile`
Parse the code in string x and return function that, when invoked, will interpret it.
This is optional for most of the system iterator verbs like `each`, which know
what to do when given a string.

`x deep y`
For deeply glued values in x, perform y on each of the individual values, but not on the
overall vectors. An example:

```
0> 7,8,9 :: (1,2,3 glue (4,5,6)) deep 'x + 100'
result :
[ [ 107, 108, 109 ], [ [ 101, 102, 103 ], [ 104, 105, 106 ] ] ]
```

A complex example that illustrates that difference between `deep` and `wide`, outputting json for clarity:
```
0> 1,2,3 :: (4,5,6 :: (7, 8, 9)) -> "n"
1> n deep 'x , 1' make '$json'
{ '$json': '[[[1,1],[2,1],[3,1]],[[[4,1],[5,1],[6,1]],[[7,1],[8,1],[9,1]]]]' }
4> 1,2,3 :: (4,5,6 :: (7, 8, 9)) -> "n"; 
2> n wide 'x , 1' make '$json'
{ '$json': '[[1,2,3,1],[[4,5,6,1],[7,8,9,1],1]]' }
```

`x drop y`
Remove the first y items from x. If y is negative, remove the last y items from x.

`x each y`

`(x1::x2) eachboth y`

`(x1::x2) eachleft y`

`(x1::x2) eachright y`

`x emit` or `x ??`
Outputs x and returns value so you can continue expression.

`x get y`
Index x with y. For instance:
```
0> 5,6,7,8 get 2
7
```

`x importas y`
Load code library from file named in x, and give it the user-defined type y.

`x interp y`

`x ins y` or `x , y`
Combine x and y into one vector. If x and y are not of the same type, you should probably use
`glue` (also known as `::`) - see below.

`x is y` or `x -> y`
Assign the name y to value x in the current scope.

`x len`
Return length of vector x. If it's a single value, the length is 1.

`x key`
Return the indices of x. If x is a dictionary, these are its keys. Use
`x value` to get its corresponding values.

`x make y` or `x ## y`
Transform x into type y. 

`x glue y` or `x :: y`
Stick two unlike things together into one unit, which retaining the structure of both. The result is a vector, but it's a deeply structured one.
This is similar to making a linked list in other languages.

`x over y` 
Perform y between each of the values in x in sequence, returning final value.

`x parse`
Return Pink parse tree for code string in x. Use `interp` to run it.

`rem x` or `x rem`
A comment.

`x scan y`
Perform y over each of the values in x in sequence, accumulating and returning each of the return values.

`x take y`
Return the first y items of x. If y is negative, return the last y items of x (but not backward).

`x til`
Return the numbers 0, 1.. up to x-1.

`x type`
Return the type of x

`x wide y`
For deeply glued values in x, perform y on each of the individual vectors, but not the individual values themselves.

```
0> 7,8,9 :: (1,2,3 glue (4,5,6)) wide 'x , 777'
[ [ 7, 8, 9, 777 ],
  [ [ 1, 2, 3, 777 ], [ 4, 5, 6, 777 ], 777 ] ]
```

A complex example that illustrates that difference between `deep` and `wide`, outputting json for clarity:
```
0> 1,2,3 :: (4,5,6 :: (7, 8, 9)) -> "n"
1> n deep 'x , 1' make '$json'
{ '$json': '[[[1,1],[2,1],[3,1]],[[[4,1],[5,1],[6,1]],[[7,1],[8,1],[9,1]]]]' }
2> n wide 'x , 1' make '$json'
{ '$json': '[[1,2,3,1],[[4,5,6,1],[7,8,9,1],1]]' }
```


