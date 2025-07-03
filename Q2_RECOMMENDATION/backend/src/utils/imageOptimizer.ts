import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { logger } from './logger';

interface ImageSizes {
  thumbnail: number;
  small: number;
  medium: number;
  large: number;
}

const IMAGE_SIZES: ImageSizes = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
};

const IMAGE_QUALITY = 80;
const OUTPUT_FORMAT = 'webp';

export class ImageOptimizer {
  private outputDir: string;

  constructor(outputDir: string = 'public/images') {
    this.outputDir = outputDir;
  }

  private async ensureOutputDir(size: keyof ImageSizes) {
    const dir = path.join(this.outputDir, size);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private getOptimizedPath(originalPath: string, size: keyof ImageSizes): string {
    const filename = path.basename(originalPath, path.extname(originalPath));
    return path.join(size, `${filename}.${OUTPUT_FORMAT}`);
  }

  async optimizeImage(
    inputPath: string,
    sizes: Array<keyof ImageSizes> = ['medium']
  ): Promise<Record<string, string>> {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Could not read image dimensions');
      }

      const results: Record<string, string> = {};

      await Promise.all(
        sizes.map(async (size) => {
          const targetWidth = IMAGE_SIZES[size];
          const outputDir = await this.ensureOutputDir(size);
          const outputPath = this.getOptimizedPath(inputPath, size);
          const fullOutputPath = path.join(outputDir, path.basename(outputPath));

          await image
            .resize(targetWidth, null, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: IMAGE_QUALITY })
            .toFile(fullOutputPath);

          results[size] = outputPath;
        })
      );

      logger.info(`Successfully optimized image: ${inputPath}`);
      return results;
    } catch (error) {
      logger.error('Error optimizing image:', error);
      throw error;
    }
  }

  async optimizeBatch(
    inputPaths: string[],
    sizes: Array<keyof ImageSizes> = ['medium']
  ): Promise<Record<string, Record<string, string>>> {
    const results: Record<string, Record<string, string>> = {};

    await Promise.all(
      inputPaths.map(async (inputPath) => {
        try {
          results[inputPath] = await this.optimizeImage(inputPath, sizes);
        } catch (error) {
          logger.error(`Error optimizing image ${inputPath}:`, error);
        }
      })
    );

    return results;
  }

  static async generatePlaceholder(inputPath: string): Promise<string> {
    try {
      const placeholder = await sharp(inputPath)
        .resize(20, null, { fit: 'inside' })
        .blur()
        .webp({ quality: 20 })
        .toBuffer();

      return `data:image/webp;base64,${placeholder.toString('base64')}`;
    } catch (error) {
      logger.error('Error generating placeholder:', error);
      throw error;
    }
  }
} 