const rolesService = require("./roles.service");
const { createSlug } = require("../../util/Helper");
const Roles = require("./roles.model");
const User = require("../users/user.model");
const mongoose = require("mongoose");

// Controller to create a new brand
const createRoles = async (req, res) => {
  const { name, permissions } = req.body;

  try {
    if (!permissions || permissions.length === 0) {
      return res.status(400).json({
        success: "false",
        message: "Permissions are required.",
      });
    }

    const existingRole = await Roles.findOne({ name });
    if (existingRole) {
      return res.status(409).json({
        success: "false",
        message: `Role with name "${name}" already exists.`,
      });
    }

    let payload = {
      name,
      slug: name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, ""),
      permissions,
    };

    const roles = await rolesService.createRoles(payload);

    if (roles) {
      return res.status(201).json({
        success: "true",
        message: "Role created successfully.",
        roles,
      });
    } else {
      return res.status(500).json({
        success: "false",
        message: "Failed to create role, please try again.",
      });
    }
  } catch (error) {
    console.error("Error creating role:", error.message);
    res.status(500).json({
      success: "false",
      message:
        error.message || "Internal Server Error. Please try again later.",
    });
  }
};

// Controller to fetch all brands
const getRoles = async (req, res) => {
  try {
    const { name, page, limit } = req.query; // Don't set defaults for page and limit
    const filter = {};

    if (name && name.trim() !== "") {
      filter.name = { $regex: name.trim(), $options: "i" }; // Case-insensitive partial match
    }

    // Prepare pagination if page and limit are provided
    let roles;
    let totalBrands;
    let totalPages = 1;

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      roles = await rolesService.getRoles(filter, skip, parseInt(limit));
      totalBrands = await Roles.countDocuments(filter);
      totalPages = Math.ceil(totalBrands / parseInt(limit));
    } else {
      roles = await rolesService.getRoles(filter);
      totalBrands = roles.length;
      totalPages = 1; // No pagination if no limit is applied
    }

    // For each role, count the number of users associated with it
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ role: role._id }); // Count users by role ID
        return { ...role.toObject(), userCount }; // Add user count to role object
      })
    );

    res.status(200).json({
      roles: rolesWithUserCount,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get a category by ID
const getRolesBySlug = async (req, res) => {
  try {
    // Get slug from URL parameter
    const { slug } = req.params;

    // Fetch role using slug
    const role = await rolesService.getRolesBySlug(slug);

    if (!role) {
      return res.status(404).json({
        success: "false",
        message: "Role not found with the given slug",
      });
    }

    res.status(200).json({
      success: "true",
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      error: error.message || "Internal server error",
    });
  }
};

// Controller to update a category
const updateRoles = async (req, res) => {
  try {
    const { slug } = req.params;

    if (slug === "admin") {
      return res.status(400).json({
        success: "false",
        message: "Admin role cannot be updated",
      });
    }

    const roles = await rolesService.updateRoles(slug, req.body);
    if (!roles) {
      return res
        .status(404)
        .json({ success: "false", message: "roles not found" });
    }
    res
      .status(200)
      .json({ success: "true", message: "Roles updated successfully", roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete a category
const deleteRoles = async (req, res) => {
  try {
    const deleteThis = await rolesService.deleteRoles(req.params.id);
    if (!deleteThis) {
      return res
        .status(404)
        .json({ success: "false", message: "Roles not found" });
    }
    res
      .status(200)
      .json({ success: "true", message: "Roles deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRoles,
  getRoles,
  getRolesBySlug,
  updateRoles,
  deleteRoles,
};
