import express from 'express';
import rootRouter from './routes';
import cors from 'cors';
import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://rakeshreddyk5777:p8E3dHlixv08HZeV@paytm.5qomuwo.mongodb.net/paytm').then(() => {
    console.log('connected to db');
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter);

app.listen(5000, () => {
    console.log('started and listening at 5000');
})