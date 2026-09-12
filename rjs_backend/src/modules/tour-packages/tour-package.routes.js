import express from "express";
import { validate } from "../../common/middleware/validate.js";
import {
    authenticateAdmin,
    requireEmployee,
} from "../admins/admin-auth.middleware.js";
import {
    createTourPackage,
    getTourPackage,
    listTourPackages,
    updateTourPackage,
} from "./tour-package.controller.js";
import {
    createTourPackageSchema,
    listTourPackagesSchema,
    tourPackageParamsSchema,
    updateTourPackageSchema,
} from "./tour-package.schemas.js";

const tourPackageRouter = express.Router();

tourPackageRouter.use(authenticateAdmin, requireEmployee);
tourPackageRouter.get("/", validate(listTourPackagesSchema), listTourPackages);
tourPackageRouter.post("/", validate(createTourPackageSchema), createTourPackage,);
tourPackageRouter.get("/:packageId", validate(tourPackageParamsSchema), getTourPackage,);
tourPackageRouter.patch("/:packageId", validate(updateTourPackageSchema), updateTourPackage,);

export { tourPackageRouter };
