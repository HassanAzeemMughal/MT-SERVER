const axios = require("axios");
const sharp = require("sharp");
const Product = require("./product.model"); // Assuming Product model is in the models folder
const Category = require("../categories/category.model");
const mongoose = require("mongoose");
const Fuse = require("fuse.js");
const XLSX = require("xlsx");
const { createSlug } = require("../../util/Helper");

/**
 * Create a new product
 * @param {Object} payload - Product data from the request body
 * @returns {Promise<Object>} - The created product
 */
const createProduct = async (payload) => {
  try {
    const attributes = (payload.attributes || []).map((attr) => ({
      attribute: new mongoose.Types.ObjectId(attr.attribute),
      selectedValues: attr.selectedValues,
    }));

    const newProduct = new Product({
      name: payload.name,
      slug: payload.slug,
      categories: payload.categories,
      price: payload.price,
      offerPrice: payload.offerPrice,
      discount: payload.discount,
      stock_quantity: payload.stock_quantity,
      low_stock_alert: payload.low_stock_alert,
      deliveryTime: payload.deliveryTime,
      stock: payload.stock,
      brands: payload.brands,
      status: payload.status,
      description: payload.description,
      images: payload.images,
      createdBy: payload.createdBy,
      attributes: attributes,

      seo: {
        title: payload.seo_title,
        keywords: (payload.seo_keywords || "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        description: payload.seo_description,
      },
    });

    // Save the product to the database
    const product = await newProduct.save();

    return product;
  } catch (error) {
    throw new Error("Error creating product: " + error.message);
  }
};

const getProducts = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("categories", "title")
      .populate("brands", "name");
  } catch (error) {
    throw new Error("Error fetching categories: " + error.message);
  }
};

const getProductById = async (productId) => {
  const product = await Product.findById(productId).populate(
    "categories",
    "_id title"
  );
  if (!product) {
    throw new Error("Product not found.");
  }
  return product;
};
const updateProduct = async (id, payload) => {
  try {
    const attributes = (payload.attributes || []).map((attr) => ({
      attribute: new mongoose.Types.ObjectId(attr.attribute),
      selectedValues: attr.selectedValues,
    }));
    // Find the product by ID and update it with the new values
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name: payload.name,
        slug: payload.slug,
        categories: payload.categories,
        price: payload.price,
        offerPrice: payload.offerPrice,
        discount: payload.discount,
        stock_quantity: payload.stock_quantity,
        low_stock_alert: payload.low_stock_alert,
        deliveryTime: payload.deliveryTime,
        stock: payload.stock,
        brands: payload.brands,
        status: payload.status,
        description: payload.description,
        images: payload.images,
        createdBy: payload.createdBy,
        attributes: attributes,

        seo: {
          title: payload.seo_title,
          keywords: (payload.seo_keywords || "")
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          description: payload.seo_description,
        },
      },
      {
        new: true,
      }
    );

    // If the product is not found, throw an error
    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    return updatedProduct;
  } catch (error) {
    throw new Error("Error updating product: " + error.message);
  }
};

const deleteProduct = async (id) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      throw new Error("Product not found");
    }
    return deletedProduct;
  } catch (error) {
    throw new Error("Error deleting product: " + error.message);
  }
};

const deleteProductTagsIndexBased = async (id, tag) => {
  try {
    const product = await Product.findById(id);

    if (!product) {
      console.log("Product not found for ID:", id);
      return null;
    }

    console.log("Product tags before removal:", product.tags);
    console.log("Tag to remove:", tag);

    const tagIndex = product.tags.indexOf(tag);
    if (tagIndex === -1) {
      console.log("Tag not found in product tags!");
      return null;
    }

    product.tags.splice(tagIndex, 1);
    await product.save();

    console.log("Product tags after removal:", product.tags);
    return product;
  } catch (error) {
    console.error("Error in deleteProductTagsIndexBased:", error.message);
    throw new Error(error.message);
  }
};
const fetchTrendingProducts = async () => {
  return await Product.find({}).sort({ createdAt: -1 }).populate("categories");
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  deleteProductTagsIndexBased,
  fetchTrendingProducts,
};
