const brandService = require("./brand.service");
const { createSlug } = require("../../util/Helper");
const Brand = require("./brand.model");
const mongoose = require("mongoose");

// Controller to create a new brand
const createBrand = async (req, res) => {
  try {
    const payload = req.body;
    payload.slug = createSlug(payload.name);
    const existingBrand = await Brand.findOne({ slug: payload.slug });
    if (existingBrand) {
      return res.status(400).json({
        success: "false",
        message: "brand with this slug already exists.",
      });
    }
    const brand = await brandService.createBrand(payload);
    res
      .status(201)
      .json({ success: "true", message: "Brand created successfully", brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to fetch all brands
const getBrands = async (req, res) => {
  try {
    const { name, page, limit } = req.query; // Don't set defaults for page and limit
    const filter = {};

    if (name && name.trim() !== "") {
      filter.name = { $regex: name.trim(), $options: "i" }; // Case-insensitive partial match
    }

    // Prepare pagination if page and limit are provided
    let brands;
    let totalBrands;
    let totalPages = 1;

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      brands = await brandService.getBrands(filter, skip, parseInt(limit));
      totalBrands = await Brand.countDocuments(filter);
      totalPages = Math.ceil(totalBrands / parseInt(limit));
    } else {
      brands = await brandService.getBrands(filter);
      totalBrands = brands.length;
      totalPages = 1; // No pagination if no limit is applied
    }

    res.status(200).json({
      brands,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get a category by ID
const getBrandById = async (req, res) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    if (!brand) {
      return res
        .status(404)
        .json({ success: "false", message: "brand not found" });
    }
    res.status(200).json({ success: "true", brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to update a category
const updateBrand = async (req, res) => {
  try {
    const payload = req.body;
    const { id } = req.params;

    payload.slug = createSlug(payload.name);

    const existingBrand = await Brand.findOne({
      slug: payload.slug,
      _id: { $ne: id },
    });

    if (existingBrand) {
      return res.status(400).json({
        success: "false",
        message: "brand with this slug already exists.",
      });
    }

    const brand = await brandService.updateBrand(id, payload);
    if (!brand) {
      return res
        .status(404)
        .json({ success: "false", message: "brand not found" });
    }
    res
      .status(200)
      .json({ success: "true", message: "Brand updated successfully", brand });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete a category
const deleteBrand = async (req, res) => {
  try {
    const brand = await brandService.deleteBrand(req.params.id);
    if (!brand) {
      return res
        .status(404)
        .json({ success: "false", message: "brand not found" });
    }
    res
      .status(200)
      .json({ success: "true", message: "brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
