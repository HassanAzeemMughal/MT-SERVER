const productService = require("./product.service"); // Import the product service
const { validationResult } = require("express-validator"); // For validation (optional)
const { createSlug, saveFile } = require("../../util/Helper");
const path = require("path");
const fs = require("fs");
const Product = require("./product.model");
const mongoose = require("mongoose");

const createProduct = async (req, res) => {
  try {
    const payload = req.body;
    // const images = req.files;

    // 1. Convert comma-separated strings to arrays
    if (typeof payload.categories === "string") {
      payload.categories = payload.categories.split(",");
    }

    // Parse attributes from JSON string
    if (typeof payload.attributes === "string") {
      try {
        payload.attributes = JSON.parse(payload.attributes);
      } catch (e) {
        payload.attributes = [];
      }
    }

    // 2. Handle images
    // Convert comma-separated images to array of ObjectIds
    if (typeof payload.images === "string") {
      payload.images = payload.images
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    // Calculate offerPrice if price and discount are provided
    if (payload.price && payload.discount) {
      payload.offerPrice =
        payload.price - payload.price * (payload.discount / 100);
    }

    // Generate slug safely
    payload.slug = createSlug(payload.name);
    payload.createdBy = null;

    // Proceed to product creation if no errors
    const newProduct = await productService.createProduct(payload);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error in createProduct controller:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProducts = async (req, res) => {
  try {
    const { name, category, type, page, limit } = req.query; // Don't set defaults for page and limit
    const filter = {};

    if (name && name.trim() !== "") {
      filter.name = { $regex: name.trim(), $options: "i" }; // Case-insensitive partial match
    }
    if (category && category.trim() !== "") {
      filter.categories = { $in: [category.trim()] }; // Match category in the array
    }
    if (type && type.trim() !== "") {
      filter.type = type.trim();
    }

    // Prepare pagination if page and limit are provided
    let products;
    let totalProducts;
    let totalPages = 1;

    if (page && limit) {
      // If both page and limit are provided, apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      products = await productService.getProducts(
        filter,
        skip,
        parseInt(limit)
      );

      // Get total count for pagination
      totalProducts = await Product.countDocuments(filter);
      totalPages = Math.ceil(totalProducts / parseInt(limit));
    } else {
      // If no page and limit, just fetch all matching categories
      products = await productService.getProducts(filter);
      totalProducts = products.length;
      totalPages = 1;
    }

    const addProductList = await Product.find({});
    res.status(200).json({
      addProductList,
      products,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const images = req.files;

    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const imagesToDelete = payload.imagesToDelete
      ? payload.imagesToDelete.split(",")
      : [];

    await Promise.all(
      imagesToDelete.map((imagePath) => {
        const filePath = path.join(__dirname, "..", "public", imagePath);
        if (fs.existsSync(filePath)) {
          return fs.promises.unlink(filePath);
        }
        return Promise.resolve();
      })
    );

    const existingImages = payload.existingImages
      ? payload.existingImages.split(",")
      : [];

    const newImageUrls = await Promise.all(
      (images || []).map((file) => saveFile(file))
    );

    payload.images = [...existingImages, ...newImageUrls];

    delete payload.existingImages;
    delete payload.imagesToDelete;

    const price = parseFloat(payload.price);
    let discount = payload.discount;

    if (!discount || discount === "null") {
      discount = null;
    } else {
      discount = parseFloat(discount);
      if (isNaN(discount)) discount = null;
    }

    payload.discount = discount;

    if (!isNaN(price) && discount !== null) {
      payload.offerPrice = price - price * (discount / 100);
    } else {
      payload.offerPrice = null;
    }

    if (payload.name) {
      payload.slug = createSlug(payload.name);
    }

    if (typeof payload.attributes === "string") {
      try {
        payload.attributes = JSON.parse(payload.attributes);
      } catch {
        payload.attributes = [];
      }
    }

    if (payload.brands && !Array.isArray(payload.brands)) {
      payload.brands = [payload.brands];
    }

    if (payload.brands) {
      payload.brands = payload.brands
        .filter((brand) => mongoose.Types.ObjectId.isValid(brand))
        .map((brand) => new mongoose.Types.ObjectId(brand));
    }

    const updatedProduct = await productService.updateProduct(id, payload);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// const getProductBySlug = async (req, res) => {
//   const { productSlug } = req.params;
//   try {
//     let product = await productService.getProductBySlug(productSlug);
//     res.status(200).json({ product });
//   } catch (error) {
//     console.error("Error fetching product:", error);
//     res.status(500).json({ error: "Failed to fetch product", error });
//   }
// };

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.deleteProduct(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: "false", message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: "true", message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteProductTagsIndexBased = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;

    console.log("Received request to remove tag:", tag, "from product ID:", id);

    const product = await productService.deleteProductTagsIndexBased(id, tag);

    if (!product) {
      return res.status(404).json({ error: "Product or Tag not found" });
    }

    res
      .status(200)
      .json({ message: "Product tag deleted successfully", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchTrendingProducts = async (req, res) => {
  try {
    const products = await productService.fetchTrendingProducts();
    res.json({ success: "true", products });
  } catch (error) {
    res.status(500).json({ success: "false", message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProById,
  updateProduct,
  deleteProduct,
  deleteProductTagsIndexBased,
  fetchTrendingProducts,
};
