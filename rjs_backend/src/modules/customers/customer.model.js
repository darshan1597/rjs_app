import mongoose from "mongoose";
const customerSchema = new mongoose.Schema(
    {
        phone: { 
            type: String, 
            required: true, 
            unique: true, 
            index: true 
        },
        name: { 
            type: String, 
            trim: true 
        },
        email: { 
            type: String, 
            trim: true, 
            lowercase: true 
        },
        status: { 
            type: String, 
            enum: ["ACTIVE", "BLOCKED"], 
            default: "ACTIVE" 
        },
        profileCompleted: { 
            type: Boolean, 
            default: false 
        },
        lastLoginAt: Date,
        favoritePlacesRevision: { type: Number, default: 0 },
    },
    { timestamps: true },
);
const otpSchema = new mongoose.Schema(
    {
        phone: { 
            type: String, 
            required: true, 
            index: true 
        },
        purpose: { 
            type: String, 
            enum: ["LOGIN"], 
            default: "LOGIN" 
        },
        expiresAt: { 
            type: Date, 
            required: true, 
            index: { expires: 0 } 
        },
        attempts: { 
            type: Number, 
            default: 0 
        },
        consumedAt: Date,
    },
    { timestamps: true },
);
const sessionSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
            index: true,
        },
        refreshTokenHash: { 
            type: String, 
            required: true, 
            select: false 
        },
        expiresAt: { 
            type: Date, 
            required: true, 
            index: { expires: 0 } 
        },
        revokedAt: Date,
        userAgent: String,
        ip: String,
    },
    { timestamps: true },
);
const Customer = mongoose.model("Customer", customerSchema);
const CustomerOtp = mongoose.model("CustomerOtp", otpSchema);
const CustomerSession = mongoose.model("CustomerSession", sessionSchema);
export { Customer, CustomerOtp, CustomerSession };
