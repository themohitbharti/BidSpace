import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { config } from "../config/envConfig";

export interface UserDocument extends mongoose.Document {
    username: string;
    email: string;
    fullName: string;
    googleId?: string;
    coverImage?: string;
    password: string;
    refreshToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;

    // Methods specific to instances of UserDocument
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): Promise<string>;
    generateRefreshToken(): Promise<string>;
}

const userSchema = new mongoose.Schema<UserDocument>({
    username: {
        type: String,
        required: function(): boolean {
            return !this.googleId; // Required only if not signed up via Google
        },
        lowercase:true,
        trim: true,
        index:true,
    },
    email: {
        type: String,
        required: true,
        unique:true,
        trim:true,
        lowercase:true,
    },
    fullName: {
        type: String,
        required: true,
        trim:true,
        index:true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    coverImage: {
        type: String,
    },
    password: {
        type: String,
        required: function(): boolean {
            return !this.googleId; // Required only if not signed up via Google
        },
    },
    refreshToken: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
} , {timestamps: true})

userSchema.pre<UserDocument>("save", async function(next) {
    if (!this.isModified("password")) return next();

    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.isPasswordCorrect = async function(password: string) {
    if (!this.password) {
        throw new Error('Password is undefined');
    }
    return bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken =  async function(){
    return jwt.sign(
        {
            _id : this._id,
            username: this.username,
            email: this.email,
        },

        config.ACCESS_TOKEN_SECRET,

        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id : this._id,
        },

        config.REFRESH_TOKEN_SECRET,

        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

// Define the unique index with a partial filter expression
// userSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $exists: true } } });

export const User = mongoose.model<UserDocument>("User" , userSchema)