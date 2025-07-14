const attributeService = require("./attributes.service");
const Attribute = require("./attributes.model");
const mongoose = require("mongoose");

const createAttribute = async (req, res) => {
  try {
    const attributeData = req.body;
    const existingAttribute = await Attribute.findOne({
      name: attributeData.name,
    });
    if (existingAttribute) {
      return res.json({
        success: false,
        message: "Attribute with name already exists.",
      });
    }
    const attribute = await attributeService.createAttribute(attributeData);
    res.status(201).json({
      success: true,
      message: "Attribute created successfully",
      attribute,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttributes = async (req, res) => {
  try {
    const { name, page, limit } = req.query;
    const filter = {};

    if (name && name.trim() !== "") {
      filter.name = { $regex: name.trim(), $options: "i" };
    }

    let attributes;
    let totalAttributes;
    let totalPages = 1;

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      attributes = await attributeService.getAttributes(
        filter,
        skip,
        parseInt(limit)
      );
      totalAttributes = await Attribute.countDocuments(filter);
      totalPages = Math.ceil(totalAttributes / parseInt(limit));
    } else {
      attributes = await attributeService.getAttributes(filter);
      totalAttributes = attributes.length;
      totalPages = 1;
    }

    res.status(200).json({
      attributes,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to fetch all attributes

// Controller to get a attribute by ID

const getAttributeById = async (req, res) => {
  try {
    const attribute = await attributeService.getAttributeById(req.params.id);
    if (!attribute) {
      return res
        .status(404)
        .json({ success: false, message: "Attribute not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        name: attribute.name,
        values: attribute.values,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to update a attribute
const updateAttribute = async (req, res) => {
  try {
    const attributeData = req.body;
    const { id } = req.params;

    const existingAttribute = await Attribute.findOne({
      name: attributeData.name,
      _id: { $ne: id },
    });

    if (existingAttribute) {
      return res.status(400).json({
        success: false,
        message: "Attribute with this name already exists.",
      });
    }

    // Ensure values are processed correctly
    const values = attributeData.values || [];

    const updatedAttribute = await Attribute.findByIdAndUpdate(
      id,
      {
        name: attributeData.name,
        values: values.filter((val) => val.trim() !== ""),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAttribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Attribute updated successfully",
      data: updatedAttribute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Controller to delete a attribute
const deleteAttribute = async (req, res) => {
  try {
    const attribute = await attributeService.deleteAttribute(req.params.id);
    if (!attribute) {
      return res.json({ success: false, message: "attribute not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "attribute deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteAttributeValue = async (req, res) => {
  try {
    const { attributeId, value } = req.body;

    if (!attributeId || !value) {
      return res.status(400).json({
        success: false,
        message: "Attribute ID and value are required",
      });
    }

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    // Filter out the value to delete
    attribute.values = attribute.values.filter((v) => v !== value);

    // If no values left, add an empty one to prevent empty array
    if (attribute.values.length === 0) {
      attribute.values = [""];
    }

    await attribute.save();

    res.status(200).json({
      success: true,
      message: "Value deleted successfully",
      attribute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createAttribute,
  getAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
  deleteAttributeValue,
};
