import mongoose from "mongoose";
const messageSchema = new mongoose.Schema(
    {
        senderType: {
            type: String,
            enum: ["CUSTOMER", "DRIVER", "EMPLOYEE"],
            required: true,
        },
        senderName: String,
        text: { 
            type: String, 
            required: true 
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        },
    },
    { _id: true },
);
const schema = new mongoose.Schema(
    {
        ticketNumber: { 
            type: String, 
            required: true, 
            unique: true, 
            index: true 
        },
        requesterType: {
            type: String,
            enum: ["CUSTOMER", "DRIVER"],
            required: true,
        },
        requesterName: { 
            type: String, 
            required: true 
        },
        requesterPhone: String,
        requesterEmail: String,
        subject: { 
            type: String, 
            required: true 
        },
        category: {
            type: String,
            enum: ["BOOKING", "PAYMENT", "DRIVER", "ACCOUNT", "SAFETY", "OTHER"],
            required: true,
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM",
            index: true,
        },
        status: {
            type: String,
            enum: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"],
            default: "OPEN",
            index: true,
        },
        bookingId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Booking" 
        },
        driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
        profileChangeArea: { type: String, enum: ["PERSONAL", "PHOTO", "DOCUMENTS", "VEHICLE", "BANK"] },
        reviewDecision: { type: String, enum: ["APPROVED", "REJECTED"] },
        reviewNote: String,
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminAccount" },
        assignedEmployeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminAccount",
        },
        messages: { type: [messageSchema], default: [] },
    },
    { timestamps: true },
);

const SupportTicket = mongoose.model("SupportTicket", schema);
export { SupportTicket };
