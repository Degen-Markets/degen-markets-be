import { Logger } from "@aws-lambda-powertools/logger";
import sharp from "sharp";

class ImageService {
  private static readonly logger = new Logger({ serviceName: "ImageService" });

  static async getType(imgBuffer: Buffer) {
    this.logger.info("Getting image type", { imgBuffer });
    const metadata = await sharp(imgBuffer).metadata();
    const fileType = metadata.format;

    if (!fileType) {
      this.logger.error("Error getting image type");
      throw new Error("Error getting image type");
    }

    this.logger.info("Got image type", { trial: fileType });
    return fileType;
  }

  static async convertTo(
    desiredFileType: "png",
    imgBuffer: Buffer,
  ): Promise<Buffer> {
    this.logger.info(`Converting image to ${desiredFileType}`, { imgBuffer });
    const pngBuffer = await sharp(imgBuffer)[desiredFileType]().toBuffer();
    this.logger.info(`Converted image to ${desiredFileType}`, { pngBuffer });
    return pngBuffer;
  }
}

export default ImageService;
