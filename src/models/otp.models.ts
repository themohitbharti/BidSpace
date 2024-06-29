import mongoose, { Document } from 'mongoose';

export interface OTPDocument extends Document {
    email: string;
    otp: string;
    createdAt: Date;
    expiresAt: Date;
}

const otpSchema = new mongoose.Schema<OTPDocument>({
    email: {
          type: String,
          required: true
         },
    otp: { 
         type: String,
         required: true
         },
    createdAt: { 
         type: Date,
         default: Date.now,
         expires: '10m'
         }, 
    expiresAt: { 
         type: Date,
         required: true
         }
});

export const OTP = mongoose.model<OTPDocument>('OTP', otpSchema);