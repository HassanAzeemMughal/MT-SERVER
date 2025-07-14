const cloudinary = require("../../config/cloudinary");
const File = require("./file.model");
const sharp = require("sharp"); // Import sharp for image processing
const axios = require("axios");
const stream = require("stream");
const { promisify } = require("util");

class FileService {
  // Upload file to a specific folder
  async uploadFile(file, folder = "general") {
    try {
      // Check if the file is an image (mime type starts with 'image/')
      if (file.mimetype.startsWith("image/")) {
        // Convert the image to WebP format using sharp
        const convertedImageBuffer = await sharp(file.path)
          .webp() // Convert to WebP format
          .toBuffer(); // Get the converted image buffer

        // Use Cloudinary's upload_stream to upload the buffer directly
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "image", // Specify that it's an image
            },
            (error, result) => {
              if (error) {
                reject(error); // Reject on error
              } else {
                resolve(result); // Resolve on success
              }
            }
          );

          // Pipe the converted image buffer to the upload stream
          uploadStream.end(convertedImageBuffer);
        });

        // Save the file details to the Gallery model
        const fileEntry = await File.create({
          url: result.secure_url,
          publicId: result.public_id,
          folder,
        });

        return fileEntry; // Return the saved entry
      } else {
        // If it's not an image, upload as-is (without conversion)
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
        });

        // Save the file details to the Gallery model
        const fileEntry = await File.create({
          url: result.secure_url,
          publicId: result.public_id,
          folder,
        });

        return fileEntry; // Return the saved entry
      }
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  }

  // Remove file from Cloudinary and Gallery
  async deleteFile(publicId) {
    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);

      // Remove from Gallery model
      await File.findOneAndDelete({ publicId });
      console.log("file deleted");
      return { success: true, message: "File deleted successfully" };
    } catch (error) {
      throw new Error("File deletion failed: " + error.message);
    }
  }

  // Update file (upload new one and remove old one)
  async updateFile(file, publicId, folder = "general") {
    try {
      // Step 1: Remove the old file
      await this.deleteFile(publicId);

      // Step 2: Upload the new file (with potential conversion to WebP)
      const newFileData = await this.uploadFile(file, folder);

      return newFileData; // Return updated file data
    } catch (error) {
      throw new Error("File update failed: " + error.message);
    }
  }

  // Get transformed URLs (Optional)
  getTransformedUrl(publicId, options) {
    return cloudinary.url(publicId, options);
  }

  async convertToWebp(files) {
    for (const file of files) {
      try {
        // 2. Download original image
        const response = await axios.get(file.url, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data);

        // 3. Convert to WebP
        const webpBuffer = await sharp(buffer)
          .webp({ quality: 80 }) // Good quality at 80%
          .toBuffer();

        // 4. Upload to Cloudinary (same publicId to overwrite)
        const result = await cloudinary.uploader.upload(
          `data:image/webp;base64,${webpBuffer.toString("base64")}`,
          {
            public_id: file.publicId, // Overwrite original
            overwrite: true,
          }
        );

        // 5. Update database with new URL
        await File.updateOne({ _id: file._id }, { url: result.secure_url });

        console.log(`Converted ${file.publicId} to WebP`);
      } catch (error) {
        console.error(`Failed to convert ${file.publicId}:`, error.message);
      }
    }
  }
}

module.exports = new FileService();
