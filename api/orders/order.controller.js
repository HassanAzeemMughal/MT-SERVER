const mongoose = require("mongoose");
const orderService = require("./order.service");
const Order = require("./order.model");
const OrderProduct = require("./order-product.model");
const Product = require("../products/product.model");
const mailService = require("../../util/MailService");
const User = require("../users/user.model.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const handleStripeError = (error) => {
  console.error(`Stripe Error [${error.type}]:`, error.message);

  const errorMap = {
    StripeCardError: "Your card has been declined.",
    StripeInvalidRequestError: "Invalid request to Stripe API.",
    StripeAPIError: "Stripe API error. Please try again later.",
    StripeConnectionError: "Network communication with Stripe failed.",
    StripeAuthenticationError: "Authentication with Stripe failed.",
  };

  return (
    errorMap[error.type] || "An unexpected error occurred. Please try again."
  );
};

const createPaymentIntent = async (req, res) => {
  try {
    const { pmId, amount } = req.body;

    if (isNaN(amount)) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    const roundAmount = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: roundAmount,
      currency: "gbp",
      payment_method: pmId,
    });
    const clientSecret = paymentIntent?.client_secret;
    const status = paymentIntent?.status;

    if (clientSecret) {
      res.json({ success: true, clientSecret, status });
    } else {
      res.json({ success: false, error: "Failed to create payment intent." });
    }
  } catch (error) {
    res.json({ success: false, error: handleStripeError(error) });
  }
};

const createOrder = async (req, res) => {
  try {
    const { user, products, paymentIntentId, deliveryAddress, total } =
      req.body;

    if (!user || !products || !paymentIntentId || !deliveryAddress || !total) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required order details." });
    }

    const orderData = {
      user,
      products,
      paymentIntentId,
      deliveryAddress,
      total,
    };

    let updatedUser = null;

    if (deliveryAddress?.saveDeliveryAddress) {
      updatedUser = await User.findOneAndUpdate(
        { _id: user },
        {
          $set: {
            phone: deliveryAddress.phone,
            city: deliveryAddress.city,
            country: deliveryAddress.country,
            addressLine1: deliveryAddress.addressLine1,
            addressLine2: deliveryAddress.addressLine2,
            postcode: deliveryAddress.postcode,
            note: deliveryAddress.note,
          },
        },
        { new: true, runValidators: true }
      );
    }

    const order = await orderService.createOrder(orderData);

    // const orderSummary = products
    //   .map((product) => `${product.name}`)
    //   .join("<br/>");

    // const shippingAddress = `${deliveryAddress.addressLine1}, ${
    //   deliveryAddress.addressLine2 || ""
    // } <br/>${deliveryAddress.city}, ${deliveryAddress.country}, ${
    //   deliveryAddress.postcode
    // }`;

    // const completeOrderLink = `${process.env.REDIRECT_PAGE}/order/complete/${order?.orderRef}`;

    // const emailResponse = await mailService.handleCompleteOrderEmail({
    //   firstName: updatedUser.firstName,
    //   email: updatedUser.email,
    //   verificationLink: completeOrderLink,
    //   orderId: order?.orderRef, // Assuming order has an 'id' property
    //   orderDate: new Date().toLocaleDateString(), // Get current date
    //   totalAmount: parseFloat(total.toFixed(2)), // Total amount of the order
    //   orderSummary: orderSummary, // Order items list
    //   shippingAddress: shippingAddress, // Shipping address
    // });

    // if (!emailResponse.success) {
    //   console.warn("Email sending failed:", emailResponse.error);
    // }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error creating order:", error);
    // Handling different error types
    let errorMessage = "Internal Server Error";
    if (error.name === "ValidationError") {
      errorMessage = "Invalid input data.";
    } else if (error.code === 11000) {
      errorMessage = "Duplicate entry detected.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({ success: false, message: errorMessage });
  }
};

// const getOrders = async (req, res) => {
//   const { page = 1, limit = 10 } = req.query;
//   const filters = req.query;

//   try {
//     const { orders, totalOrders, totalPages, currentPage } =
//       await orderService.getOrders(filters, parseInt(page), parseInt(limit));

//     res.json({
//       success: true,
//       orders,
//       totalPages,
//       pagination: {
//         totalOrders,
//         totalPages,
//         currentPage,
//         pageSize: limit,
//       },
//     });
//   } catch (error) {
//     console.error("Error in getOrders controller:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const getOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  // const filters = req.query;
  const filters = {
    ...req.query,
    type: req.query.type?.split(","),
    startDate: req.query.startDate ? new Date(req.query.startDate) : null,
    endDate: req.query.endDate ? new Date(req.query.endDate) : null,
  };

  try {
    const { orders, totalOrders, totalPages, currentPage } =
      await orderService.getOrders(filters, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      orders,
      totalPages,
      pagination: {
        totalOrders,
        totalPages,
        currentPage,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error in getOrders controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the order by its ID and populate shippingMethod
    const order = await Order.findOne({ _id: id }).populate("shippingMethod");

    // Check if the order exists
    if (!order) {
      return res.json({ success: false, error: "Order not found" });
    }

    // Find all order products for the given order and populate product information
    const orderProducts = await OrderProduct.find({
      orderId: order._id,
    }).populate("product");

    const orderProductsApproved = await OrderProduct.find({
      status: "approved",
      orderId: order._id,
    }).populate("product");

    // Prepare arrays to store consultations for PM and PGD/NON PGD products
    const pmConsultation = [];
    const pomConsultation = [];

    const prescriptionProduct = await OrderProduct.find({
      orderId: order._id,
    }).populate({
      path: "product",
    });

    const dispencingProduct = await OrderProduct.find({
      orderId: order._id,
    }).populate({
      path: "product",
    });

    // Return the order, all order products, and the two different consultation arrays
    return res.json({
      success: true,
      order,
      prescriptionProduct: prescriptionProduct.filter((p) => p.product),
      dispencingProduct: dispencingProduct.filter((p) => p.product),
      product: orderProducts,
      product: orderProductsApproved,
      pmConsultation, // Consultations for PM products
      pomConsultation, // Consultations for PGD and NON PGD products (by indication)
    });
  } catch (error) {
    // Handle any errors during the process
    console.error(error);
    return res.json({ success: false, error: "Internal server error" });
  }
};

const getOrderByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    const userOrder = await Order.find({ user: id }).sort({ createdAt: -1 });

    if (!userOrder.length) {
      return res.json({
        success: false,
        message: "No orders found for this user",
      });
    }

    // Step 2: Extract order IDs
    const orderIds = userOrder.map((order) => order._id);
    // Step 3: Find Order Products for these order IDs
    const orderProducts = await OrderProduct.find({
      orderId: { $in: orderIds },
    });

    if (!orderProducts.length) {
      return res.json({
        success: false,
        message: "No order products found for this user",
      });
    }

    // Step 4: Extract Product IDs
    const productIds = [
      ...new Set(orderProducts.map((op) => op.product?.toString())),
    ]; // Ensure IDs are strings

    // Step 5: Fetch Product Details
    const products = await Product.find({ _id: { $in: productIds } });

    if (!products.length) {
      return res.json({
        success: false,
        message: "No products found for these order products",
      });
    }
    // Step 6: Merge Orders with Order Products and Product Details
    const mergedOrders = userOrder.map((order) => {
      // Get order products for this order
      const relatedOrderProducts = orderProducts.filter((op) =>
        op.orderId.equals(order._id)
      );

      // Get product details for each order product
      const relatedProducts = relatedOrderProducts.map((op) => {
        const productDetails = products.find(
          (p) => p._id.toString() === op.product.toString()
        );
        return {
          ...op.toObject(),
          productDetails: productDetails || null, // Handle missing product case
        };
      });

      // Merge into final response
      return {
        ...order.toObject(),
        orderProducts: relatedOrderProducts,
        products: relatedProducts,
      };
    });

    return res.json({
      success: true,
      userOrders: mergedOrders,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

const deliveredOrderHistory = async (req, res) => {
  try {
    const { userId, page = 1, limit = 5 } = req.query; // Default page 1, limit 5 orders per page

    if (!userId) {
      return res.json({ success: false, message: "User ID is required." });
    }

    const skip = (page - 1) * limit; // Calculate skip value for pagination

    // Fetch total delivered orders count for pagination
    const totalOrders = await Order.countDocuments({ user: userId });
    console.log("-======totalOrders", totalOrders);

    // Find paginated delivered orders
    const deliveredOrders = await Order.find({ user: userId })
      .populate("user")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }); // Sorting by latest orders

    if (!deliveredOrders.length) {
      return res.json({
        success: false,
        message: "No delivered orders found.",
        data: [],
        totalOrders: 0,
      });
    }

    // Get order IDs to fetch corresponding OrderProducts
    const orderIds = deliveredOrders.map((order) => order._id);

    // Find order products for the delivered orders and populate product details
    const orderProducts = await OrderProduct.find({
      orderId: { $in: orderIds },
    }).populate("product");

    // Map orders with their corresponding order products
    const ordersWithProducts = deliveredOrders.map((order) => ({
      ...order.toObject(),
      orderProducts: orderProducts.filter(
        (op) => op.orderId.toString() === order._id.toString()
      ),
    }));

    return res.json({
      success: true,
      message: "",
      data: ordersWithProducts,
      totalOrders: totalOrders, // Send total orders count for frontend pagination
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  createOrder,
  getOrders,
  getOrderById,
  getOrderByUserId,
  deliveredOrderHistory,
};
