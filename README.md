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

## Verbs 

Some ideas for a vocabulary. 

Also considering a short/symbol form of each verb. Pretty ugly choices presented below.

```
CODE                 RESULT           SHORT VERB

(3,6,9) is "x".                       (3,6,9)->"x"
(5,10) is "y".
x amend (2,0).       (3,6,0).         x!(2,0)
x drop 1.            (3,6)            x__1
x except 3.          (6,9)            x%%3
x find 6.            1                x??6
x get 1.             6                x@1
x len.               3                x#
x take 4.            (3,6,9,3)        x^^4
x where 3.           0                
x list.              [3,6,9]          ():x       NB. General list, I guess?

Iteration verbs:

'x*25' get 3.        75               x @ 3      NB. Get is also apply; dunno about dyad"
x each 'x*2'.        (6,12,18)        x @@ 'x*2'

'x*y' is 'mul';                                  NB. these names are awful
x:y eachleft'mul'    15,30,30,60,45,90           NB. gen list w/ :
x:y eachright'mul'   15,30,45,30,60,90
x:(y,2)eachboth'mul' 15,60,18                    NB. must be same length

x over '+'.          18               x @/ '+'   NB. i hate the word reduce, but..
x scan '+'.          (9,18)           x @\ '+'   NB. i know of no English terms for these
x recurse '....'                                 NB. 'exhaust' or fixed pt/repeat-til-stable
x where 'odd x'.     (0,2) 

rem "aside: eval code in local context, set vars; discard result in expr".
x take 1 aside '... -> "ans" reverse',ans -> "biganswer".
```


