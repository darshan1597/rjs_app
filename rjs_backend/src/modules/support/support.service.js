import { AppError } from "../../common/errors/app-error.js";
import { SupportTicket } from "./support-ticket.model.js";
async function listTickets({ page, limit, search, status, priority }) {
    const f = {};
    if (status) f.status = status;
    if (priority) f.priority = priority;
    if (search) {
        const v = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        f.$or = [
            { ticketNumber: { $regex: v, $options: "i" } },
            { requesterName: { $regex: v, $options: "i" } },
            { subject: { $regex: v, $options: "i" } },
        ];
    }
    const [items, total] = await Promise.all([
        SupportTicket.find(f)
        .sort({ priority: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
        SupportTicket.countDocuments(f),
    ]);
    return {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}
async function updateTicket(id, data, admin) {
    const update = { ...data, assignedEmployeeId: admin.id };
    if (data.reply) delete update.reply;
    const push = data.reply
        ? {
            messages: {
                senderType: "EMPLOYEE",
                senderName: admin.name,
                text: data.reply,
            },
        }
        : undefined;
    const item = await SupportTicket.findByIdAndUpdate(
        id,
        {
            ...(Object.keys(update).length && { $set: update }),
            ...(push && { $push: push }),
        },
        { new: true },
    );
    if (!item)
        throw new AppError(404, "TICKET_NOT_FOUND", "Support ticket was not found");
    return item;
}
export { listTickets, updateTicket };
