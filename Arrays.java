import java.util.*;
public class Arrays{
    public static void main(String[] args) {
        Scanner sc= new Scanner(System.in);
        System.out.println("Enter size of the array: ");
        int size = sc.nextInt();
        int Marks[] = new int[size];

        //input
        System.out.println("Enter values to be taken: ");
        for (int i=0;i<size;i++){
            Marks[i]=sc.nextInt();

        }
        System.out.println("Which item to search for: ");
        int A=sc.nextInt();

        //Output
        for (int i=0;i<size;i++){
            if (Marks[i] == A){
                
                System.out.println("Found at index: " + i);

            }
        
        }
        sc.close();
        

    }
}