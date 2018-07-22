xs/pink
=======

These are some bits and pieces of a programming language called `pink`.

It is part of a series of experiments (called `xs`) at creating a simplified,
fast, not-shitty version of a previous language experiment called `XXL`. 

It descends from the heritage of APL and K/Q, but adopts a more humanistic
perspective to lower the learning curve.

Ideally, pink would be like "vector FORTH with English words."

## Status

Just notes and scraps of code. Not usable or near complete.

## Design goals

* Target embedded systems, written in barbarian C++
* Strictly left to right with no precedence.
* `.` ends the line.
* All values are vectors. A scalar is just a vector(1).
* Functions have one or two args, named x and y.
* Functions may be strongly typed.
* Few built in well known functions (called verbs) which work across many types
* You can create as many of your own types as you want. 
* Strongly typed functions allow you to override built in verbs for your own types.
* Lambdas are strings.
* Everything is just a function. 
	* Comments are calls to the `rem` function. 
	* Conditionals and all logic are functions.
* Whitespace has no meaning (as god intended)
* Built in tree type, implemented as a `[parent(n),data(n)]` vector, 
	should be very fast and easy to use for most operations.
* Lexer with builtins over()/scan().
* Parser implemented using immediate verbs.
* Embraces immutability and pass by value.
* Erlang-style process mailboxes (mapped to plain functions and async style; many writers, single blocking reader).
* Networking via same mailbox model with reader/writer/control processes.
* For now: uses `malloc()` sparingly. (I hope)
* State machine verb

## Example Code

Assign a variable named `x` with a value of 10 and echo it.
```
	rem "assign a variable".
	10 is "x". rem "the `is` verb takes two arguments".
	show x. rem "the `show` verb only takes one".
```
Imagine manipulating TSV file (in a simple manner for our purposes). It contains:
```
	name,age,gender
	tom,39,m
	arca,5,f
	milo,3,m
```
Read the file as a vector of chars, split into lines, remove the header line, 
and for each of the rest, split again into columns (using the tab character). 
Save into `cols`.
```
	open "students.txt" read split "\n" drop 1 each "split '\t'" is "cols".
```
`cols` should now contain something like:
```
	(("tom","39","m"),("arca","5","f"),("milo","3","m"))
```
As you note there, the lambda function passed to each is a string. This is a topic I'm exploring.


