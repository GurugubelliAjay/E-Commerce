// Create razorpay instance
import dotenv from 'dotenv';
dotenv.config();
import Razorpay from 'razorpay';
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});
export default razorpay