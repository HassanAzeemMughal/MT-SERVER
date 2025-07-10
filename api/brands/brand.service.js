// src/api/categories/category.service.js
const Brand = require("./brand.model");
const { ObjectId } = require("mongoose").Types;

const createBrand = async (Data) => {
  try {
    const brand = new Brand(Data);
    return await brand.save();
  } catch (error) {
    throw new Error("Error creating brand: " + error.message);
  }
};
//
const getBrands = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await Brand.find(filter).skip(skip).limit(limit);
  } catch (error) {
    throw new Error("Error fetching brands: " + error.message);
  }
};

const getBrandById = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }
  try {
    return await Brand.findById(id);
  } catch (error) {
    throw new Error("Error fetching brand: " + error.message);
  }
};

const updateBrand = async (id, Data) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid brand ID");
  }
  try {
    return await Brand.findByIdAndUpdate(id, Data, { new: true });
  } catch (error) {
    throw new Error("Error updating brand: " + error.message);
  }
};

const deleteBrand = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid brand ID");
  }
  try {
    return await Brand.findByIdAndDelete(id);
  } catch (error) {
    throw new Error("Error deleting brand: " + error.message);
  }
};

module.exports = {
  createBrand,
  getBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
