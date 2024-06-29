import mongoose from "mongoose";

const connectDB=  async (): Promise<void> => {
    try {
         const connect = await mongoose.connect(`${process.env.MONGODB_URL}` as string)
         console.log("MongoDB connected", connect.connection.host)
    } catch (error: any) {
        console.error("error: ", error);
        process.exit(1)
    }
}

export default connectDB