const categoryService = require("./category.service");
const { createSlug, saveFile } = require("../../util/Helper");
const Category = require("./category.model");
const mongoose = require("mongoose");

// Controller to create a new category
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const imageFile = req.file;

    if (!categoryData.title) {
      return res
        .status(400)
        .json({ success: "false", message: "Title is required." });
    }
    categoryData.slug = createSlug(categoryData.title);
    const existingCategory = await Category.findOne({
      slug: categoryData.slug,
    });
    if (existingCategory) {
      return res.status(400).json({
        success: "false",
        message: "Category with this slug already exists.",
      });
    }

    categoryData.image = saveFile(imageFile);

    categoryData.parent = categoryData.parent
      ? new mongoose.Types.ObjectId(categoryData.parent)
      : null;
    const category = await categoryService.createCategory(categoryData);
    res.status(201).json({
      success: "true",
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      message: "An unexpected error occurred while creating the category.",
      error: error.message,
    });
  }
};

// Controller to fetch all categories
const getCategories = async (req, res) => {
  try {
    const { name, parent, page, limit } = req.query; // Don't set defaults for page and limit
    const filter = {};

    if (name && name.trim() !== "") {
      filter.title = { $regex: name.trim(), $options: "i" }; // Case-insensitive partial match
    }
    if (parent && parent.trim() !== "") {
      filter.parent = parent.trim();
    }

    // Prepare pagination if page and limit are provided
    let categories;
    let totalCategories;
    let totalPages = 1;

    if (page && limit) {
      // If both page and limit are provided, apply pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      categories = await categoryService.getCategories(
        filter,
        skip,
        parseInt(limit)
      );

      // Get total count for pagination
      totalCategories = await Category.countDocuments(filter);
      totalPages = Math.ceil(totalCategories / parseInt(limit));
    } else {
      // If no page and limit, just fetch all matching categories
      categories = await categoryService.getCategories(filter);
      totalCategories = categories.length;
      totalPages = 1; // No pagination if no limit is applied
    }
    res.status(200).json({
      categories,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controller to fetch parent categories
const getParentCategories = async (req, res) => {
  try {
    const categories = await categoryService.getParentCategories();
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get a category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: "false", message: "Category not found" });
    }
    res.status(200).json({ success: "true", category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to update a category
const updateCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const { id } = req.params;
    const imageFile = req.file;

    if (!categoryData.title) {
      return res
        .status(400)
        .json({ success: "false", message: "Title is required." });
    }

    categoryData.slug = createSlug(categoryData.title);

    const existingCategory = await Category.findOne({
      slug: categoryData.slug,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: "false",
        message: "Category with this slug already exists.",
      });
    }

    categoryData.image = saveFile(imageFile);

    categoryData.parent = categoryData.parent
      ? new mongoose.Types.ObjectId(categoryData.parent)
      : null;

    const category = await categoryService.updateCategory(id, categoryData);
    if (!category) {
      return res
        .status(404)
        .json({ success: "false", message: "Category not found" });
    }
    res.status(200).json({
      success: "true",
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete a category
const deleteCategory = async (req, res) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: "false", message: "Category not found" });
    }
    res
      .status(200)
      .json({ success: "true", message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchCategoriesWithHierarchy = async (req, res) => {
  try {
    const categories = await categoryService.fetchCategoriesWithHierarchy();
    res.json({ success: "true", categories });
  } catch (error) {
    res.status(500).json({ success: "false", message: error.message });
  }
};

// async function getSubCategoryWithProducts(req, res) {
//   const { categorySlug, subCategorySlug } = req.params;
//   console.log(categorySlug, subCategorySlug);
//   try {
//     const data = await categoryService.getSubCategoryDetails(
//       categorySlug,
//       subCategorySlug
//     );
//     console.log("====data===== check", data);

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(404).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

async function getCategoryWithProducts(req, res) {
  const { categorySlug } = req.params;
  try {
    const data = await categoryService.getCategoryDetails(categorySlug);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createCategory,
  getCategories,
  getParentCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  // getSubCategoryWithProducts,
  getCategoryWithProducts,
  fetchCategoriesWithHierarchy,
};
