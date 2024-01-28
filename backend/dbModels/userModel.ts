import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    _id: string,
    userName: string,
    password: string,
    firstName: string,
    lastName: string,
    validatePassword: (password: string) => Promise<boolean>
}

const UserSchema = new mongoose.Schema<IUser>({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLenght: 50
    }
});

export const createHash = async (password: string) => await bcrypt.hash(password, 10);

UserSchema.methods.validatePassword = async function (passwordToValidate: string) {
    return await bcrypt.compare(passwordToValidate, this.password)
};

export const User = mongoose.model('User', UserSchema);

