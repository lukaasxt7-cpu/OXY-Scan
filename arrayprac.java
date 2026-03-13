import java.util.*;
public class arrayprac {
    public static void main(String arg[]){
        //scanner object
        Scanner sc=new Scanner(System.in);

        //creation of array
        System.out.println("Enter size of array: ");
        int size =sc.nextInt();
        int array[]=new int [size];

        //input
        System.out.println("Enter the numbers to the array: ");
        for(int i=0;i<size;i++){
            array[i]=sc.nextInt();
        }
        sc.close();

        //display
        for(int i=0;i<array.length;i++){
            System.out.println("The created array: ");
            System.out.print(array[i]+" ");
        }
        //sum
        int sum1=0;
        for(int i=0;i<array.length;i++){
            sum1+=array[i];
        }
        System.out.println("Sum of array:");
        System.out.println(sum1);

        //largest element
        int max1=array[0];
        for(int i=0;i<array.length;i++){
            if(max1<array[i]){
                max1 = array[i];

            }
            

        }
    }
}
