const mongoose = require("mongoose");
const Order = require("./order.model");
const OrderProduct = require("./order-product.model");
const { generateUniqueOrderRef } = require("../../util/orderUtils");

exports.createOrder = async (orderData) => {
  const { user, products, paymentIntentId, deliveryAddress, total } = orderData;

  const orderType = determineOrderType(products);

  // Start a database transaction
  const session = await Order.startSession();
  session.startTransaction();

  try {
    if (!user || !products || !paymentIntentId) {
      throw new Error("Missing required order information.");
    }
    // Generate a unique order reference
    const orderRef = await generateUniqueOrderRef();

    // Create the order
    const newOrder = await Order.create(
      [
        {
          user,
          orderRef,
          deliveryAddress,
          total,
          status: "pending",
          paymentIntentId,
          type: orderType,
        },
      ],
      { session }
    );

    const orderProducts = products.map((product) => {
      const orderProduct = {
        orderId: newOrder[0]._id,
        product: product._id,
        quantity: product.quantity,
        unitPrice: product.variation?.price || product.price,
        totalPrice:
          (product.variation?.price || product.price) * product.quantity,
        discount: product?.discount || 0,
        isMultiBuyApplied: product?.isMultiBuyApplied || false,
      };

      return orderProduct;
    });

    await OrderProduct.insertMany(orderProducts, { session });

    await session.commitTransaction();
    session.endSession();

    return newOrder[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Order Processing Failed:", error);
    throw new Error(error.message || "Order processing failed.");
  }
};

exports.getOrders = async (filters, page = 1, limit = 10) => {
  try {
    const filterQuery = buildFilterQuery(filters);

    const skip = (page - 1) * limit;

    // Fetch orders with pagination and filters applied
    const orders = await Order.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalOrders = await Order.countDocuments(filterQuery);

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders,
      totalOrders,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    throw new Error("Error fetching orders: " + error.message);
  }
};

const determineOrderType = (products) => {
  let orderType = "GSL"; // Default to GSL

  // Check for the product types in the hierarchy
  for (let product of products) {
    if (product.type === "NON-PGD") {
      return "NON-PGD";
    }
    if (product.type === "PGD" && orderType !== "NON-PGD") {
      orderType = "PGD";
    }
    if (
      product.type === "PM" &&
      orderType !== "PGD" &&
      orderType !== "NON-PGD"
    ) {
      orderType = "PM";
    }
    if (product.type === "GSL" && orderType === "GSL") {
      orderType = "GSL";
    }
  }

  return orderType;
};

const buildFilterQuery = (filters) => {
  let query = {};

  if (filters.type && Array.isArray(filters.type) && filters.type.length > 0) {
    query.type = { $in: filters.type };
  }

  if (filters.orderRef) {
    query.orderRef = { $regex: filters.orderRef, $options: "i" }; // Case-insensitive search
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.customer) {
    query.$or = [
      {
        "deliveryAddress.firstName": {
          $regex: filters.customer,
          $options: "i",
        },
      },
      {
        "deliveryAddress.lastName": { $regex: filters.customer, $options: "i" },
      },
    ];
  }

  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  return query;
};

// const buildFilterQuery = (filters) => {
//   const query = {};

//   // Order ID (Exact match)
//   if (filters.orderRef) query.orderRef = filters.orderRef;

//   // Customer Name (Case-insensitive partial match)
//   if (filters.customer) {
//     query.$or = [
//       {
//         "deliveryAddress.firstName": {
//           $regex: filters.customer,
//           $options: "i",
//         },
//       },
//       {
//         "deliveryAddress.lastName": { $regex: filters.customer, $options: "i" },
//       },
//     ];
//   }

//   // Date Range
//   if (filters.startDate || filters.endDate) {
//     query.createdAt = {};
//     if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
//     if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
//   }

//   return query;
// };
