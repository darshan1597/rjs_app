import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { AppError } from '../../common/errors/app-error.js';
import { authenticateAdmin, requireEmployee } from '../admins/admin-auth.middleware.js';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const tourPackageUploadDirectory = path.resolve(moduleDirectory, '../../../uploads/tour-packages');
const driverUploadDirectory = path.resolve(moduleDirectory, '../../../uploads/drivers');
const vehicleUploadDirectory = path.resolve(moduleDirectory, '../../../uploads/vehicles');
fs.mkdirSync(tourPackageUploadDirectory, { recursive: true });
fs.mkdirSync(driverUploadDirectory, { recursive: true });
fs.mkdirSync(vehicleUploadDirectory, { recursive: true });
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const driverFileTypes = new Set([...imageTypes, 'application/pdf']);
const createStorage = (destination) => multer.diskStorage({
  destination,
  filename(req, file, callback) {
    const extension = ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' })[file.mimetype];
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});
const tourPackageUpload = multer({ storage: createStorage(tourPackageUploadDirectory), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter(req, file, callback) { callback(imageTypes.has(file.mimetype) ? null : new AppError(422, 'INVALID_IMAGE_TYPE', 'Use a JPG, PNG or WebP image'), imageTypes.has(file.mimetype)); } });
const driverFileUpload = multer({ storage: createStorage(driverUploadDirectory), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter(req, file, callback) { callback(driverFileTypes.has(file.mimetype) ? null : new AppError(422, 'INVALID_DRIVER_FILE_TYPE', 'Use a JPG, PNG, WebP or PDF file'), driverFileTypes.has(file.mimetype)); } });
const vehicleImageUpload = multer({ storage: createStorage(vehicleUploadDirectory), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter(req, file, callback) { callback(imageTypes.has(file.mimetype) ? null : new AppError(422, 'INVALID_IMAGE_TYPE', 'Use a JPG, PNG or WebP image'), imageTypes.has(file.mimetype)); } });
const mediaRouter = express.Router();
mediaRouter.use(authenticateAdmin, requireEmployee);
mediaRouter.post('/tour-package-image', tourPackageUpload.single('image'), (req, res, next) => {
  if (!req.file) return next(new AppError(422, 'IMAGE_REQUIRED', 'Choose an image to upload'));
  return res.status(201).json({ success: true, data: { url: `/api/v1/media/tour-package-images/${req.file.filename}`, fileName: req.file.originalname } });
});
mediaRouter.post('/driver-file', driverFileUpload.single('file'), (req, res, next) => {
  if (!req.file) return next(new AppError(422, 'DRIVER_FILE_REQUIRED', 'Choose a driver file to upload'));
  return res.status(201).json({ success: true, data: { url: `/api/v1/media/driver-files/${req.file.filename}`, fileName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size } });
});
mediaRouter.post('/vehicle-image', vehicleImageUpload.single('image'), (req, res, next) => {
  if (!req.file) return next(new AppError(422, 'IMAGE_REQUIRED', 'Choose a vehicle image to upload'));
  return res.status(201).json({ success: true, data: { url: `/api/v1/media/vehicle-images/${req.file.filename}`, fileName: req.file.originalname } });
});
const tourPackageImages = express.static(tourPackageUploadDirectory, { immutable: true, maxAge: '30d', fallthrough: false });
const driverFiles = express.static(driverUploadDirectory, { immutable: true, maxAge: '30d', fallthrough: false });
const vehicleImages = express.static(vehicleUploadDirectory, { immutable: true, maxAge: '30d', fallthrough: false });
export { driverFiles, mediaRouter, tourPackageImages, vehicleImages };
