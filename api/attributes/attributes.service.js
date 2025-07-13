// src/api/categories/category.service.js
const Attribute = require("./attributes.model");
const { ObjectId } = require("mongoose").Types;

const createAttribute = async (Data) => {
  try {
    const attribute = new Attribute(Data);
    return await attribute.save();
  } catch (error) {
    throw new Error("Error creating attribute: " + error.message);
  }
};

const getAttributes = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await Attribute.find(filter).skip(skip).limit(limit);
  } catch (error) {
    throw new Error("Error fetching categories: " + error.message);
  }
};

const getAttributeById = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid attribute ID");
  }
  try {
    return await Attribute.findById(id).select("name values");
  } catch (error) {
    throw new Error("Error fetching Attribute: " + error.message);
  }
};

const updateAttribute = async (id, data) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid Attribute ID");
  }
  try {
    return await Attribute.findByIdAndUpdate(
      id,
      {
        name: data.name,
        values: data.values,
      },
      { new: true, runValidators: true }
    );
  } catch (error) {
    throw new Error("Error updating Attribute: " + error.message);
  }
};

const deleteAttribute = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid Attribute ID");
  }
  try {
    return await Attribute.findByIdAndDelete(id);
  } catch (error) {
    throw new Error("Error deleting Attribute: " + error.message);
  }
};

module.exports = {
  createAttribute,
  getAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
};
