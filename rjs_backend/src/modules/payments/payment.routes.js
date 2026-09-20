import express from "express";
import { validate } from "../../common/middleware/validate.js";
import {authenticateAdmin, requireEmployee, requireSuperAdmin,} from "../admins/admin-auth.middleware.js";
import {createRefundRequest, listPayments, retryPayout, reviewRefund,} from "./payment.controller.js";
import {createRefundSchema, listPaymentsSchema, payoutActionSchema, refundActionSchema,} from "./payment.schemas.js";

const paymentRouter = express.Router();

paymentRouter.use(authenticateAdmin);
paymentRouter.get("/", requireEmployee, validate(listPaymentsSchema), listPayments);
paymentRouter.post("/:paymentId/refunds", requireEmployee, validate(createRefundSchema), createRefundRequest);
paymentRouter.post("/payouts/:payoutId/retry", requireEmployee, validate(payoutActionSchema), retryPayout,);
paymentRouter.post("/refunds/:refundId/review", requireSuperAdmin, validate(refundActionSchema), reviewRefund,);

export { paymentRouter };
