import mongoose from "mongoose";

const MONGO_URL=process.env.MONGO_URI!
if(!MONGO_URL)
{
    throw new Error("please define mongo uri in env variables");
}

let cached=global.mongoose