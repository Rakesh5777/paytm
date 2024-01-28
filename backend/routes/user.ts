import express, { Request, Response } from "express"
import { z } from 'zod';
import { IUser, createHash, User } from "../dbModels/userModel";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config";
import { authMiddleWare } from "../middleware";
import { FilterQuery } from "mongoose";
import { Account } from "../dbModels/accountModel";

const userRouter = express.Router();

const signupSchema = z.object({
    userName: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string()
})

userRouter.post('/signup', async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(411).json({ message: 'Incorrect Inputs', error: result.error });
    }

    try {
        const user = await User.create({
            userName: req.body.userName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: await createHash(req.body.password)
        })

        const userId = user._id;
        const token = jwt.sign({ userId }, JWT_SECRET);

        // create account for user
        await Account.create({
            userId,
            balance: 10000
        })

        res.json({
            message: "User created successfully",
            token
        })
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'ValidationError') {
                return res.status(400).send({
                    message: "Validation error: " + error.message
                });
            }

            if ('code' in error && error.code && error.code === 11000) {
                return res.status(400).send({
                    message: "Duplicate entry: The username already exists."
                });
            }
        }
        res.status(500).send({
            message: "Internal server error"
        });
    }

})

const signInSchema = z.object({
    userName: z.string().email(),
    password: z.string()
}).strict()

userRouter.post("/signin", async (req, res) => {
    const result = signInSchema.safeParse(req.body);
    if (!result.success) {
        res.status(411).json({
            message: "Incorrect inputs",
            error: result.error
        })
    }

    const user = await User.findOne({ userName: req.body.userName });
    if (!user) {
        return res.status(411).json({
            message: "user not found"
        })
    }

    const password = await user.validatePassword(req.body.password);

    if (!password) {
        return res.status(411).json({
            message: "password does not match"
        })
    }

    const userId = user._id;
    const token = jwt.sign({ userId }, JWT_SECRET);

    res.json({
        message: "User found",
        token
    })
})

const updateBody = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().optional()
}).strict()

userRouter.put("/", authMiddleWare, async (req, res) => {
    const result = updateBody.safeParse(req.body);
    if (!result.success) {
        return res.status(411).json({
            message: 'Invalid inputs',
            error: result.error
        })
    }

    if (req.body.hasOwnProperty('password')) {
        const textPassword = req.body.password;
        req.body.password = await createHash(textPassword);
    }

    await User.updateOne({ _id: req.userId }, req.body)

    res.json({
        message: "update succesful"
    })
})

userRouter.get("/bulk", authMiddleWare, async (req: Request<{}, {}, {}, { filter: string }>, res: Response) => {
    const { filter = '' } = req.query;
    const userId = req.userId;
    const regex = new RegExp(filter as string, 'i');

    let query: FilterQuery<IUser> = { _id: { $ne: userId } };

    if (filter) {
        query.$or = [{ firstName: regex }, { lastName: regex }];
    }

    const users = await User.find(query).select(['firstName', 'lastName', 'userName']);

    res.send(users)
})

export default userRouter;

