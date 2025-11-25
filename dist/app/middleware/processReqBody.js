"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAndBodyProcessorUsingDiskStorage = void 0;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
// Define upload configuration with maxCount
const uploadFields = [
    { name: 'images', maxCount: 5 },
    { name: 'media', maxCount: 3 },
    { name: 'documents', maxCount: 3 },
];
const fileAndBodyProcessorUsingDiskStorage = () => {
    const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadsDir))
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const folderPath = path_1.default.join(uploadsDir, file.fieldname);
            if (!fs_1.default.existsSync(folderPath))
                fs_1.default.mkdirSync(folderPath, { recursive: true });
            cb(null, folderPath);
        },
        filename: (req, file, cb) => {
            const extension = path_1.default.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
            cb(null, filename);
        },
    });
    const fileFilter = (req, file, cb) => {
        var _a;
        try {
            const allowedTypes = {
                images: ['image/jpeg', 'image/png', 'image/jpg'],
                media: ['video/mp4', 'audio/mpeg'],
                documents: ['application/pdf'],
            };
            const fieldType = file.fieldname;
            if (!((_a = allowedTypes[fieldType]) === null || _a === void 0 ? void 0 : _a.includes(file.mimetype))) {
                return cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid file type for ${file.fieldname}`));
            }
            cb(null, true);
        }
        catch (err) {
            cb(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'File validation failed'));
        }
    };
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: 20 * 1024 * 1024, files: 10 },
    }).fields(uploadFields);
    return (req, res, next) => {
        upload(req, res, async (error) => {
            var _a, _b;
            if (error)
                return next(error);
            try {
                if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data)
                    req.body = JSON.parse(req.body.data);
                if (req.files) {
                    const processedFiles = {};
                    const fieldsConfig = new Map(uploadFields.map(f => [f.name, f.maxCount]));
                    for (const [fieldName, files] of Object.entries(req.files)) {
                        const maxCount = (_b = fieldsConfig.get(fieldName)) !== null && _b !== void 0 ? _b : 1;
                        const fileArray = files;
                        const paths = [];
                        for (const file of fileArray) {
                            const filePath = `/${fieldName}/${file.filename}`;
                            // Optimize images
                            if (fieldName === 'images' &&
                                file.mimetype.startsWith('image/')) {
                                try {
                                    const fullPath = path_1.default.join(uploadsDir, fieldName, file.filename);
                                    let sharpInstance = (0, sharp_1.default)(fullPath).resize(800);
                                    if (file.mimetype === 'image/png')
                                        sharpInstance = sharpInstance.png({ quality: 80 });
                                    else
                                        sharpInstance = sharpInstance.jpeg({ quality: 80 });
                                    await sharpInstance.toFile(fullPath + '.optimized');
                                    fs_1.default.unlinkSync(fullPath);
                                    fs_1.default.renameSync(fullPath + '.optimized', fullPath);
                                }
                                catch (err) {
                                    console.error('Image optimization failed:', err);
                                }
                            }
                            // Handle video duration (disabled to avoid ffprobe dependency in serverless)
                            let duration = undefined;
                            // File info with extracted duration for videos
                            const fileInfo = {
                                url: filePath,
                                size: file.size,
                                type: file.mimetype.startsWith('image')
                                    ? 'image'
                                    : file.mimetype.startsWith('video')
                                        ? 'video'
                                        : 'document',
                                duration,
                            };
                            paths.push(fileInfo);
                        }
                        processedFiles[fieldName] = maxCount > 1 ? paths : paths[0];
                    }
                    req.body = { ...req.body, ...processedFiles };
                }
                next();
            }
            catch (err) {
                next(err);
            }
        });
    };
};
exports.fileAndBodyProcessorUsingDiskStorage = fileAndBodyProcessorUsingDiskStorage;
