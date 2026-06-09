import mongoose from "mongoose";
import { buffer } from "stream/consumers";

const MONGO_URL=process.env.MONGO_URI!
if(!MONGO_URL)
{
    throw new Error("please define mongo uri in env variables");
}

let cached=global.mongoose

if(!cached)
{
    cached=global.mongoose={conn:null , promise:null}
}

export async function connectToDatabse(){
    if(cached.conn)
    {
        return cached.conn
    }
    if(!cached.promise)
    {
        const opts={
            bufferCommands:true,
            maxPoolSize:10
        }
        mongoose.connect(MONGO_URL,opts)
        .then(()=>mongoose.connection)
    }

    try{
       cached.conn= await cached.promise
       
    }
    catch(error)
    {
        cached.promise=null;
        throw error
    }

    return cached.conn
}