import { Logger } from "@aws-lambda-powertools/logger";
import DOMPurify from "dompurify";
import { fileTypeFromBuffer } from "file-type";
import isSvg from "is-svg";

class ImageService {
  private static readonly logger = new Logger({ serviceName: "ImageService" });

  static async getType(imgBuffer: Buffer) {
    this.logger.info("Getting image type", { imgBuffer });

    const fileType = await fileTypeFromBuffer(imgBuffer);
    if (!fileType) {
      if (isSvg(imgBuffer.toString())) {
        return "svg";
      }

      this.logger.error("Error getting image type");
      throw new Error("Error getting image type");
    }

    this.logger.info("Got image type", { fileType });
    return fileType.ext;
  }

  static sanitizeSvg(imgBuffer: string) {
    const svgStr = imgBuffer.toString();
    const sanitizedSvgStr = DOMPurify.sanitize(svgStr);
    return Buffer.from(sanitizedSvgStr);
  }
}

export default ImageService;
