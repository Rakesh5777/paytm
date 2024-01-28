import mongoose from "mongoose";

export interface IAccount extends mongoose.Document {
    userId: string,
    balance: number
}

const AcountsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    }
})

export const Account = mongoose.model<IAccount>('Accounts', AcountsSchema);