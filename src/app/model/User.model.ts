import mongoose, { Document, Schema } from 'mongoose';


export interface Message extends Document {
    content : string;
    createdAt : Date;
}
export interface Message {
  _id: string;
  content: string;
  senderName?: string;
  createdAt: Date;
}
const MessageSchema: Schema<Message> = new Schema({
    content:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        required: true,
        default: Date.now
    }
})

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    isVerified: boolean;
    isAcceptingMessages: boolean;
    messages: Message[];
}

const UserSchema: Schema<User> = new Schema({
    username:{
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Email is invalid'] // Simple email regex validation
    },
    password:{
        type: String,
        required: [true, 'Password is required']
    },
    verifyCode:{
        type: String,
        required: false
    },
    verifyCodeExpiry:{
        type: Date,
        required: false
    },
    isVerified:{
        type: Boolean,
        required: true,
        default: false
    },
    isAcceptingMessages:{
        type: Boolean,
        required: true,
        default: true   
    },
    messages:[MessageSchema]
},{
    timestamps: true
})


export const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>('User', UserSchema);

export default UserModel;


