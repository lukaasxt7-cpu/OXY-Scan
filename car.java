class ncar {
    String mirror;
    String color;
    int seat;
    ncar(){}
    ncar(int s){
        this.seat=s;
    }
    void accelerate(){
        System.out.println("this is normall speed good brakes");
    }
    void print(){
        System.out.println(seat);
    }
}
class mercedes extends ncar{
        void accelerate(){
            System.out.println("benz has high speed");
            super.accelerate();
        }
}

public class car{
    public static void main(String[] args){
        mercedes s1=new mercedes();
        s1.mirror="auto fold";
        s1.accelerate();
        ncar s2 = new ncar(5);
        s2.print();

    }}

