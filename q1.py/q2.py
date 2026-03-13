S="Hi there 5 how are 3 you 2 doing ?"
sum1=0
for i in S:
    if i.isdigit():
        sum1+=int(i)
print(sum1)