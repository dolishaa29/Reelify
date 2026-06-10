import { connectToDatabse } from "@/lib/dbconnection";
import { NextRequest , NextResponse} from "next/server";
import User from "@/models/user"
 
export async function POST(request: NextRequest)
{
    try{
       const {email,password}=await request.json()
       if(!email || !password)
       {
        return NextResponse.json({error:"Email and password are required"},
            {status:400}
        )
       }

       await connectToDatabse()
       const exist=await User.findOne({email});
       if(exist)
       {
        return NextResponse.json({error:"User already registered with this email"},
            {status:400}
        );
       }

       await User.create({
        email, password
       })

       return NextResponse.json({
        error:"User Created Successfully"
       },
    {status:400});

    }
    catch(error)
    {
      console.error("Registration error",error);
      return NextResponse.json({
        error:"Failed to Register User"
      },
    {status:400});
    }
}