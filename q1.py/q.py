n=int(input("enter number"))
for i in range (1,n+1):
    c=1
    for j in range(n-i):
        print(" ",end="")

    for k in range(i):
        print(c,end=" ")
        c=c+1
    print()
for i in range(1,n):
    c=1
    for j in range(i):
        print(" ",end="")

    for k in range(n-i):
        print(c,end=" ")
        c=c+1
    print()    