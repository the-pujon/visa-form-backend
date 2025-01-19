"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndCompress = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const folderPath = path_1.default.join(process.cwd(), "images");
        if (!fs_1.default.existsSync(folderPath)) {
            fs_1.default.mkdirSync(folderPath, { recursive: true });
        }
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    },
});
const upload = (0, multer_1.default)({ storage });
const uploadAndCompress = (req, res, next) => {
    const multerMiddleware = upload.single("file");
    multerMiddleware(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return next(err);
        }
        if (!req.file) {
            // return next(new Error("No file uploaded"));
            next();
            return null;
        }
        try {
            const compressedFilePath = path_1.default.join(req.file.destination, `compressed-${req.file.filename}`);
            yield (0, sharp_1.default)(req.file.path)
                .resize(1200)
                .jpeg({ quality: 80 })
                .toFile(compressedFilePath);
            fs_1.default.unlinkSync(req.file.path);
            req.file.path = compressedFilePath;
            req.file.filename = `compressed-${req.file.filename}`;
            next();
        }
        catch (error) {
            next(error);
        }
    }));
};
exports.uploadAndCompress = uploadAndCompress;
