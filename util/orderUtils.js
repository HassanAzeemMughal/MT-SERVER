const Order = require('../api/orders/order.model');

exports.generateUniqueOrderRef = async () => {
  let orderRef;
  let isUnique = false;

  while (!isUnique) {
    orderRef = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const existingOrder = await Order.findOne({ orderRef });
    if (!existingOrder) {
      isUnique = true;
    }
  }

  return orderRef;
};
