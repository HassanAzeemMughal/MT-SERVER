const User = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "mobilTech";

const register = async (payload) => {
  try {
    const newUser = new User({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      dob: null,
      role: null,
      otp: null,
      otpExpiration: null,
    });

    await newUser.save();

    const user = await User.findOne({ _id: newUser._id }).select("-password");
    // .populate("Roles");
    return user;
  } catch (error) {
    throw error;
  }
};

const getUsers = async (filter = {}, skip = 0, limit = 10) => {
  try {
    return await User.find(filter)
      .skip(skip)
      .limit(limit)
      .populate("role", "name");
  } catch (error) {
    throw new Error("Error fetching user: " + error.message);
  }
};

// const getUserFromAuthorization = async (req) => {
//   try {
//     const accessToken = req.headers["authorization"]?.split(" ")[1];
//     console.log("=======accessToken", accessToken);
//     if (!accessToken) {
//       return null;
//     }
//     const decodedToken = jwt.verify(accessToken, JWT_SECRET);
//     const userId = decodedToken.id;
//     const user = await User.findById(userId).populate("role");

//     return user;
//   } catch (error) {
//     return null;
//   }
// };

module.exports = {
  register,
  getUsers,
};
