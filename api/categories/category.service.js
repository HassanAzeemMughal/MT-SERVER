// src/api/categories/category.service.js
const Category = require("./category.model");
const Product = require("../products/product.model");
const Brand = require("../brands/brand.model");
const { ObjectId } = require("mongoose").Types;
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const createCategory = async (categoryData) => {
  try {
    const category = new Category(categoryData);
    return await category.save();
  } catch (error) {
    throw new Error("Error creating category: " + error.message);
  }
};

const getCategories = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await Category.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("parent", "_id title");
  } catch (error) {
    throw new Error("Error fetching categories: " + error.message);
  }
};

const fetchCategoriesWithHierarchy = async () => {
  return await Category.find({}).sort({ createdAt: -1 }).populate("parent");
};

const getParentCategories = async () => {
  try {
    return await Category.find({ parent: null });
  } catch (error) {
    throw new Error("Error fetching categories: " + error.message);
  }
};

const getCategoryById = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }
  try {
    return await Category.findById(id).populate("parent");
  } catch (error) {
    throw new Error("Error fetching category: " + error.message);
  }
};

const updateCategory = async (id, categoryData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }
  try {
    return await Category.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id), // Ensure id is a valid ObjectId
      categoryData,
      { new: true }
    );
  } catch (error) {
    throw new Error("Error updating category: " + error.message);
  }
};

const deleteCategory = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid category ID");
  }
  try {
    return await Category.findByIdAndDelete(id);
  } catch (error) {
    throw new Error("Error deleting category: " + error.message);
  }
};

async function formatChildCat(childCategories) {
  try {
    if (!childCategories || childCategories.length === 0) {
      return [];
    }

    return childCategories.map((child) => {
      if (!child) {
        throw new Error("Child category is undefined or null.");
      }
      return {
        _id: child._id,
        title: child.title,
        slug: child.slug,
        parent: child.parent,
        image: child.image ? child.image : null,
      };
    });
  } catch (error) {
    throw new Error(error.message || "Failed to fetch child categories.");
  }
}

async function getChildCategories(categoryId) {
  try {
    const childCategories = await Category.find({ parent: categoryId })
      .populate("parent", "title slug")
      .populate("image");
    if (!childCategories || childCategories.length === 0) {
      return [];
    }

    return childCategories.map((child) => {
      if (!child) {
        throw new Error("Child category is undefined or null.");
      }
      return {
        _id: child._id,
        title: child.title,
        slug: child.slug,
        parent: child.parent,
        image: child.image ? child.image.url : null,
      };
    });
  } catch (error) {
    throw new Error(error.message || "Failed to fetch child categories.");
  }
}

// Format the category data into a clean response
function formatCategoryResponse(category) {
  return {
    category: {
      _id: category._id,
      title: category.title,
      slug: category.slug,
      parent: null,
      description: category.description || null,
      image: category.image ? category.image : null,
      status: category.status || "active",
    },
    siblingCategories: [],
    products: [],
  };
}

// Helper function to format category data
function formatCategoryData(category) {
  if (!category) {
    throw new Error("Category is undefined or null.");
  }
  return {
    _id: category._id,
    title: category.title,
    slug: category.slug,
    parent: category.parent === null ? null : category.parent,
    description: category.description || null,
    image: category.image ? category.image.url : null,
    seo: category.seo || {},
    status: category.status || "active",
  };
}

async function getProducts(categoryIds) {
  try {
    console.log("======categoryIds======", categoryIds);
    const productQuery = { categories: { $in: categoryIds } };
    const products = await Product.find({ categories: categoryIds })
      .populate("brands", "_id name slug")
      .select(
        "name slug price offerPrice discount color size deliveryTime stock status description images"
      );

    if (!products) {
      throw new Error("No products found.");
    }

    return products;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch products.");
  }
}

async function getCategoryDetails(slug) {
  try {
    const category = await Category.findOne({ slug: slug });

    if (!category || category === "") {
      throw new Error(`Parent category with slug '${slug}' not found.`);
    }

    const subCategories = await Category.find({
      parent: category._id,
    }).populate("parent", "title slug");

    if (subCategories.length === 0) {
      const response = formatCategoryResponse(category);
      return response;
    }

    const siblingCategories = await formatChildCat(subCategories);
    const subCategoryIds = subCategories.map((subCategory) => subCategory._id);
    const products = await getProducts(category._id);

    return {
      category: category,
      siblingCategories: siblingCategories,
      products: products || [],
    };
  } catch (error) {
    throw error;
  }
}

// async function getSubCategoryDetails(categorySlug, subCategorySlug) {
//   try {
//     const parentCategory = await Category.findOne({ slug: categorySlug })
//       .populate("parent", " title slug")
//       .populate("image", "url");
//     if (!parentCategory) {
//       throw new Error(`Parent category with slug '${categorySlug}' not found.`);
//     }

//     const subCategory = await Category.findOne({
//       slug: subCategorySlug,
//       parent: parentCategory._id,
//     })
//       .populate("parent", "title slug")
//       .populate("image", "url");
//     if (!subCategory) {
//       throw new Error(
//         `Subcategory with slug '${subCategorySlug}' not found under parent '${categorySlug}'.`
//       );
//     }

//     const [blogs] = await Promise.all([
//       Blog.find({ categories: subCategory._id, isPublished: true }).populate(
//         "image"
//       ),
//     ]);

//     const siblingCategories = await getChildCategories(parentCategory._id);
//     const products = await getProducts([subCategory._id]);

//     return {
//       category: formatCategoryData(subCategory),
//       siblingCategories,
//       products,
//       blogs: blogs || [],
//     };
//   } catch (error) {
//     throw error;
//   }
// }

module.exports = {
  createCategory,
  getCategories,
  getParentCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryDetails,
  // getSubCategoryDetails,
  fetchCategoriesWithHierarchy,
};
