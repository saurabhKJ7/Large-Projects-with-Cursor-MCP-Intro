"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizer = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("./logger");
const IMAGE_SIZES = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
};
const IMAGE_QUALITY = 80;
const OUTPUT_FORMAT = 'webp';
class ImageOptimizer {
    constructor(outputDir = 'public/images') {
        this.outputDir = outputDir;
    }
    async ensureOutputDir(size) {
        const dir = path_1.default.join(this.outputDir, size);
        await promises_1.default.mkdir(dir, { recursive: true });
        return dir;
    }
    getOptimizedPath(originalPath, size) {
        const filename = path_1.default.basename(originalPath, path_1.default.extname(originalPath));
        return path_1.default.join(size, `${filename}.${OUTPUT_FORMAT}`);
    }
    async optimizeImage(inputPath, sizes = ['medium']) {
        try {
            const image = (0, sharp_1.default)(inputPath);
            const metadata = await image.metadata();
            if (!metadata.width || !metadata.height) {
                throw new Error('Could not read image dimensions');
            }
            const results = {};
            await Promise.all(sizes.map(async (size) => {
                const targetWidth = IMAGE_SIZES[size];
                const outputDir = await this.ensureOutputDir(size);
                const outputPath = this.getOptimizedPath(inputPath, size);
                const fullOutputPath = path_1.default.join(outputDir, path_1.default.basename(outputPath));
                await image
                    .resize(targetWidth, null, {
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                    .webp({ quality: IMAGE_QUALITY })
                    .toFile(fullOutputPath);
                results[size] = outputPath;
            }));
            logger_1.logger.info(`Successfully optimized image: ${inputPath}`);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error optimizing image:', error);
            throw error;
        }
    }
    async optimizeBatch(inputPaths, sizes = ['medium']) {
        const results = {};
        await Promise.all(inputPaths.map(async (inputPath) => {
            try {
                results[inputPath] = await this.optimizeImage(inputPath, sizes);
            }
            catch (error) {
                logger_1.logger.error(`Error optimizing image ${inputPath}:`, error);
            }
        }));
        return results;
    }
    static async generatePlaceholder(inputPath) {
        try {
            const placeholder = await (0, sharp_1.default)(inputPath)
                .resize(20, null, { fit: 'inside' })
                .blur()
                .webp({ quality: 20 })
                .toBuffer();
            return `data:image/webp;base64,${placeholder.toString('base64')}`;
        }
        catch (error) {
            logger_1.logger.error('Error generating placeholder:', error);
            throw error;
        }
    }
}
exports.ImageOptimizer = ImageOptimizer;
//# sourceMappingURL=imageOptimizer.js.map