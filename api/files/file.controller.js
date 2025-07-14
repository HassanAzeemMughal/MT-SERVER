const fileService = require("./file.service");
const multer = require("multer");
const multerStorage = require("multer-storage-cloudinary");
const File = require("./file.model");

// Configure Multer with Cloudinary storage
const upload = multer({ dest: "uploads/" }); // Temporary storage for processing

class FileController {
  async upload(req, res) {
    try {
      const { folder } = req.body;
      if (!folder) {
        return res.json({
          success: false,
          message: "Folder name is required.",
        });
      }

      const fileData = await fileService.uploadFile(req.file, folder);
      res.status(200).json({ success: true, data: fileData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Remove File Handler
  async remove(req, res) {
    const { id } = req.body;
    try {
      const file = await File.findOne({ _id: id });
      const response = await fileService.deleteFile(file.publicId);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { fileId, folder } = req.body;
      if (!fileId) {
        return res.json({ success: false, message: "File ID is required." });
      }
      const file = await File.findOne({ _id: fileId });

      const updatedFileData = await fileService.updateFile(
        req.file,
        file.publicId,
        folder || "general"
      );
      res.status(200).json({ success: true, data: updatedFileData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTransformedUrl(req, res) {
    const { publicId, width, height } = req.query;
    try {
      const url = fileService.getTransformedUrl(publicId, {
        width,
        height,
        crop: "fill",
      });
      res.status(200).json({ success: true, url });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async convertToWebp() {
    const files = await File.find({
      folder: "products",
      url: { $not: /\.webp($|\?)/i }, // Find non-WebP images
    });

    console.log(`Found ${files.length} images to convert`);
    await fileService.convertToWebp(files);

    console.log("Conversion complete!");
  }
}

module.exports = new FileController();
