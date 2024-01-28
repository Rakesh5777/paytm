import express from "express";
import { authMiddleWare } from "../middleware";
import { Account } from "../dbModels/accountModel";
import { z } from "zod";
import mongoose from "mongoose";

const accountRouter = express.Router();

accountRouter.post("/create-account", authMiddleWare, async (req, res) => {
    const userId = req.userId;
    const account = await Account.findById(userId);
    if (account) {
        return res.status(400).json({ message: "Account already exists" });
    }
    try {
        await Account.create({
            userId,
            balance: 0
        });
        res.json({
            message: "Account created successfully"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

const depositSchema = z.object({
    amount: z.number().int().positive()
})

accountRouter.post("/deposit", authMiddleWare, async (req, res) => {
    const result = depositSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(411).json({ message: 'Incorrect Inputs', error: result.error });
    }
    const userId = req.userId;
    const depositAmount = req.body.amount;
    const account = await Account.findOne({ userId });
    if (!account) {
        return res.status(404).json({ message: "Account not found" });
    }
    try {
        await account.updateOne({
            $inc: {
                balance: depositAmount
            }
        })
        res.json({
            message: "Deposit successful"
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
})

accountRouter.get("/balance", authMiddleWare, async (req, res) => {
    const userId = req.userId;
    const account = await Account.findOne({ userId });
    if (!account) {
        return res.status(404).json({ message: "Account not found" });
    }
    res.json({
        balance: account.balance
    })
});

const transferSchema = z.object({
    amount: z.number().int().positive(),
    to: z.string()
})

accountRouter.post("/transfer", authMiddleWare, async (req, res) => {
    const result = transferSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(411).json({ message: 'Incorrect Inputs', error: result.error });
    }
    const session = await mongoose.startSession();
    const fromUserId = req.userId;
    const toUserId = req.body.to;
    const transferAmount = req.body.amount;
    try {
        const fromAccount = await Account.findOne({ userId: fromUserId });
        const toAccount = await Account.findOne({ userId: toUserId });
        if (!fromAccount || !toAccount) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (fromAccount.balance < transferAmount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        session.startTransaction();

        await fromAccount.updateOne({
            $inc: {
                balance: -transferAmount
            }
        }, { session });

        await toAccount.updateOne({
            $inc: {
                balance: transferAmount
            }
        }, { session });

        await session.commitTransaction();
        await session.endSession();

        res.json({
            message: "Transfer successful"
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
        if (session.inTransaction()) await session.abortTransaction();
    }


})

export default accountRouter;