import razorpay from "../lib/razorpay.js"; // Import Razorpay instance
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import crypto from "crypto";
import mongoose from "mongoose";
export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Invalid or empty products array" });
        }

        let totalAmount = 0;

        const items = products.map((product) => {
            const amount = product.price * 100; // Convert to paisa
            totalAmount += amount * product.quantity;

            return {
                productId: product._id, // Fixed reference to _id instead of id
                name: product.name,
                image: product.image,
                price: product.price,
                quantity: product.quantity || 1,
            };
        });

        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon && (!coupon.userId || coupon.userId.toString() === req.user._id.toString())) {
                totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
            }
        }
        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: totalAmount, // in paisa
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "",
                products: JSON.stringify(items),
            },
        });

        // Generate a new coupon if applicable
        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }

        res.status(200).json({
            id: order.id,
            amount: totalAmount / 100,
            currency: "INR",
            orderDetails: order,
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id=${order.id}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`
        });
        
    } catch (error) {
        console.error("Error creating Razorpay checkout session:", error);
        res.status(500).json({ message: "Error creating checkout session", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
            return res.status(400).json({ error: "Missing payment details" });
        }

        // console.log("Checkout Success Request Body:", req.body);

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY || "")
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        let existingOrder = await Order.findOne({
            $or: [{ razorpayPaymentId }, { razorpayOrderId }],
        });

        if (existingOrder) {
            return res.status(200).json({
                success: true,
                message: "Order already processed",
                orderId: existingOrder._id,
                totalAmount: existingOrder.totalAmount
            });
        }

        const order = await razorpay.orders.fetch(razorpayOrderId);
        if (!order || !order.notes) {
            return res.status(400).json({ error: "Order not found or missing metadata" });
        }

        const metadata = order.notes;

        let products;
        try {
            products = JSON.parse(metadata.products || "[]");
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid product metadata" });
        }

        try {
            const newOrder = new Order({
                user: metadata.userId || req.user._id,
                products: products.map((product) => ({
                    product: product.productId,
                    quantity: product.quantity || 1,
                    price: product.price,
                })),
                totalAmount: order.amount / 100,
                razorpayPaymentId,
                razorpayOrderId,
                paymentStatus: "completed",
            });

            await newOrder.save();

            if (metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: metadata.couponCode },
                    { isActive: false }
                );
            }

            return res.status(200).json({
                success: true,
                message: "Payment successful, order created, and coupon deactivated if used.",
                orderId: newOrder._id,
                totalAmount: newOrder.totalAmount
            });
        } catch (error) {
            if (error.code === 11000) {
                console.warn("Duplicate order detected, returning existing order.");
                const existingOrder = await Order.findOne({
                    $or: [{ razorpayPaymentId }, { razorpayOrderId }],
                });
                return res.status(200).json({
                    success: true,
                    message: "Order already processed",
                    orderId: existingOrder._id,
                    totalAmount: existingOrder.totalAmount
                });
            }
            throw error;
        }

    } catch (error) {
        console.error("Error processing successful checkout:", error.stack);
        res.status(500).json({ message: "Error processing successful checkout", error: error.message });
    }
};


async function createNewCoupon(userId) {
    await Coupon.findOneAndDelete({ userId });

    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        userId: userId,
    });

    await newCoupon.save();

    return newCoupon;
}
