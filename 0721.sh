N=0721
g++ \
	-Wall -Wno-unused-variable -Wno-reorder -Wno-write-strings \
	-std=c++11 -g \
	$N.cpp -o $N 2>&1 && ./$N



