public class pract {
    public static void main(String arg[]){
        animal d=new dog();
        d.sound();
        

    }
}
class animal{
    void sound(){
        System.out.println("Animal makes sound");

    }
}
class dog extends animal{
    void sound(){
        System.out.println("Bark");
    }
}
class cat extends animal{
    void sound(){
        System.out.println("meow");
    }
}