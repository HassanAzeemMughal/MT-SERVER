// src/api/categories/category.service.js
const Roles = require("./roles.model");
const { ObjectId } = require("mongoose").Types;

const createRoles = async (Data) => {
  try {
    const roles = new Roles(Data);
    return await roles.save();
  } catch (error) {
    throw new Error("Error creating roles: " + error.message);
  }
};

const getRoles = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await Roles.find(filter).skip(skip).limit(limit);
  } catch (error) {
    throw new Error("Error fetching roles: " + error.message);
  }
};

const getRolesBySlug = async (slug) => {
  try {
    // Query database using "slug" field instead of "_id"
    const role = await Roles.findOne({ slug });
    return role;
  } catch (error) {
    throw new Error(`Error fetching role by slug: ${error.message}`);
  }
};

const updateRoles = async (slug, Data) => {
  if (!slug) {
    throw new Error("Invalid role slug");
  }
  try {
    return await Roles.findOneAndUpdate({ slug }, Data, { new: true });
  } catch (error) {
    throw new Error("Error updating roles: " + error.message);
  }
};

const deleteRoles = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid roles ID");
  }
  try {
    return await Roles.findByIdAndDelete(id);
  } catch (error) {
    throw new Error("Error deleting roles: " + error.message);
  }
};

module.exports = {
  createRoles,
  getRoles,
  getRolesBySlug,
  updateRoles,
  deleteRoles,
};
