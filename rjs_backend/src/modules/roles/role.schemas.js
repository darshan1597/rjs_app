import { z } from "zod";
import { PERMISSIONS } from "./permission-catalog.js";

const empty = z.object({});
const permission = z.enum(PERMISSIONS);
const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(80),
        description: z.string().max(300).default(""),
        permissions: z.array(permission).default([]),
    }),
    params: empty,
    query: empty,
});

const updateRoleSchema = z.object({
    body: z.object({
            name: z.string().min(2).max(80).optional(),
            description: z.string().max(300).optional(),
            permissions: z.array(permission).optional(),
        }).refine((value) => Object.keys(value).length > 0),
    params: z.object({ roleId: z.string().regex(/^[a-f\d]{24}$/i) }),
    query: empty,
});

export { createRoleSchema, updateRoleSchema };
