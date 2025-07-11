const mongoose = require("mongoose");
const User = require("./user.model");
const Roles = require("../roles/roles.model");
const userService = require("./auth.service");
const authService = require("./auth.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "mobilTech";
const mailService = require("../../util/MailService");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const EmailVerification = require("./EmailVerification.model");
const ResetPassword = require("./reset-password.model");
const { check, validationResult } = require("express-validator");
const { saveFile } = require("../../util/Helper");
const baseUrl = process.env.REDIRECT_PAGE;

const userAdd = async (req, res) => {
  try {
    const { firstName, lastName, email, password, dob, role, status } =
      req.body;

    // ✅ Email format
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return res.json({
        success: false,
        message: "Invalid email format",
      });
    }

    // ✅ Check in parallel (better performance)
    const [existingUser, roleData] = await Promise.all([
      User.findOne({ email }),
      Roles.findById(role),
    ]);

    if (existingUser) {
      return res.json({
        success: false,
        message: "User with the same email already exists",
      });
    }

    if (!roleData) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const photo = req.file ? saveFile(req.file) : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    let payload = {
      firstName: firstName,
      lastName: lastName,
      email,
      dob,
      password: hashedPassword,
      role: roleData._id,
      status,
      photo,
    };

    // Create new user
    const newUser = new User(payload);
    await newUser.save();
    res
      .status(201)
      .json({ success: true, message: "User created successfully", newUser });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { name, page, limit } = req.query; // name is the combined search term
    const filter = {};

    if (name && name.trim() !== "") {
      filter.$or = [
        { firstName: { $regex: name.trim(), $options: "i" } }, // Search by firstName
        { lastName: { $regex: name.trim(), $options: "i" } }, // Search by lastName
      ];
    }

    // Prepare pagination if page and limit are provided
    let users;
    let totalUsers;
    let totalPages = 1;

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      users = await userService.getUsers(filter, skip, parseInt(limit));
      totalUsers = await User.countDocuments(filter);
      totalPages = Math.ceil(totalUsers / parseInt(limit));
    } else {
      users = await userService.getUsers(filter);
      totalUsers = users.length;
      totalPages = 1; // No pagination if no limit is applied
    }

    const usersWithRoleNames = users.map((user) => {
      if (user.role && user.role.name) {
        user.roleName = user.role.name;
      }
      return user;
    });
    res.status(200).json({
      users: usersWithRoleNames,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const userUpdate = async (req, res) => {
  const { firstName, lastName, email, dob, role, status } = req.body;
  const { id } = req.params;

  const errors = [];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.json({ success: false, message: "Invalid user ID" });
  }

  if (!email || !/^[\w.-]+@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
    errors.push("Invalid or missing email");
  }

  if (!role || !mongoose.Types.ObjectId.isValid(role)) {
    errors.push("Invalid role ID");
  }

  let statusValue = Array.isArray(status) ? status[0] : status;
  if (!["active", "inactive"].includes(statusValue)) {
    errors.push("Invalid status value");
  }

  if (errors.length > 0) {
    return res.json({ success: false, errors });
  }

  try {
    const [roleData, existingUser] = await Promise.all([
      Roles.findById(role),
      User.findById(id),
    ]);

    if (!existingUser) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!roleData) {
      return res.json({ success: false, message: "Role not found" });
    }

    const emailExists = await User.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      return res.json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    let photo = existingUser.photo;

    if (req.file) {
      photo = saveFile(req.file);
    }
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.email = email;
    existingUser.dob = dob;
    existingUser.role = roleData._id;
    existingUser.status = statusValue;
    existingUser.photo = photo;

    await existingUser.save();

    const populatedUser = await User.findById(id).populate("role");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: populatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exist with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dob: null,
      role: null,
      isVerified: false,
    };

    const user = await authService.register(payload);

    const data = { user: { id: user._id } };
    const authToken = jwt.sign(data, JWT_SECRET);

    // const verificationToken = authToken;
    // const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token in EmailVerification model
    // await new EmailVerification({
    //   userId: user._id,
    //   verificationToken,
    //   verificationTokenExpires: tokenExpiration,
    // }).save();

    // // Send verification email
    // const verificationLink = `${process.env.REDIRECT_PAGE}/verify-email/?token=${verificationToken}`;
    // const emailResponse = await mailService.handleVerificationEmail({
    //   firstName,
    //   email,
    //   verificationLink,
    // });

    // if (!emailResponse.success) {
    //   return res.status(500).json({
    //     success: false,
    //     message: `Email sending failed: ${emailResponse.error}`,
    //   });
    // }

    res.status(201).json({
      success: true,
      message: `Welcome ${firstName}, you have signed up successfully!`,
      user,
      authToken,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred",
      error: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or missing token" });
    }

    const verificationEntry = await EmailVerification.findOne({
      verificationToken: token,
    });

    if (!verificationEntry) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired token" });
    }

    // Check if token is expired
    if (verificationEntry.verificationTokenExpires < new Date()) {
      await EmailVerification.deleteOne({ verificationToken: token });
      return res
        .status(400)
        .json({ success: false, error: "Verification token has expired" });
    }

    // Find the user and update isVerified
    const user = await User.findById(verificationEntry.userId);
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ success: false, message: "User is already verified." });
    }

    user.isVerified = true;
    await user.save();

    if (user.isVerified) {
      return res.json({
        success: true,
        redirectUrl: `${process.env.REDIRECT_PAGE}/login/?status=verified`,
      });
    }

    // res.json({
    //   success: true,
    //   message: "Email verified successfully. You can now log in!",
    // });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

const userDelete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.json({
        success: false,
        message: "User ID is required.",
      });
    }

    const deleteUser = await User.findByIdAndDelete(id);
    if (!deleteUser) {
      return res.json({ success: false, message: "user not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: deleteUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        success: false,
        error: "Email and password is required",
      });
    }

    const user = await User.findOne({ email })
      .populate("role")
      .select("+password");

    if (!user) {
      return res.json({ success: false, error: "Email address is invalid" });
    }

    // if (!user.isVerified) {
    //   return res.json({
    //     success: false,
    //     error:
    //       "Email not verified. Please verify your email before logging in.",
    //   });
    // }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const authToken = jwt.sign({ user: { id: user._id } }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      success: true,
      message: "Login successfully",
      user: userWithoutPassword,
      authToken,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      error: `Error during login: ${error.message}`,
    });
  }
};

const OtpLogin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: false, error: "Email is required" });
  }

  let user = await User.findOne({ email: email });

  if (!user) {
    return res.json({ success: false, error: "Email address is invalid" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000);
  const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiration = otpExpiration;
  await user.save();

  // Send the OTP email
  const subject = "Mobil Tech OTP";
  const body = `
    <p>Dear ${user.firstName || "User"},</p>
    <p>Your One-Time Password (OTP) for accessing your mobiltech account is: <strong style="font-size: 20px;">${otp}</strong></p>
    <p>Please use this OTP within the next 10 minutes to complete your login.</p>
    <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
    <p>Best regards,<br>The MobilTech Team</p>
  `;

  try {
    await mailService.sendingEmail(email, subject, body);
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error: "Failed to send OTP email" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.json({ success: false, error: "Email and OTP are required" });
  }

  // Find the user by email
  let user = await User.findOne({ email: email }).select("-password");

  if (!user) {
    return res.json({ success: false, error: "Email address is invalid" });
  }

  // Check if the OTP matches and hasn't expired
  if (user.otp !== otp) {
    return res.json({ success: false, error: "Invalid OTP" });
  }

  if (new Date() > new Date(user.otpExpiration)) {
    return res.json({ success: false, error: "OTP has expired" });
  }

  // OTP is valid and not expired, proceed with the next steps
  user.otp = null; // Optionally clear OTP after verification
  user.otpExpiration = null;
  await user.save();

  const data = { user: { id: user._id } };
  const authToken = jwt.sign(data, JWT_SECRET);

  return res.json({
    success: true,
    message: "OTP verified successfully",
    user,
    authToken,
  });
};

// const ForgotPassword = async (req, res) => {
//   const { email } = req.body;

//   await check("email").notEmpty().withMessage("Email is required").run(req);

//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Please enter all required fields.",
//       errors: errors.array(),
//     });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Email not found." });
//     }

//     // const companyLogo = `${IMGUPLOADPATHLive}/logo.png`;

//     // Generate a secure reset code
//     const resetCode =
//       crypto.randomBytes(5).toString("hex") +
//       crypto.createHash("md5").update(email).digest("hex");

//     const token = generateRandomString(64);
//     const currentTime = new Date();
//     // Add one hour to the current time in UTC
//     currentTime.setUTCHours(currentTime.getUTCHours() + 2);
//     const existingResetCode = await ResetPassword.find({
//       email: email,
//       expiry: { $gt: new Date() }, // Find documents where expiry > currentTime
//     });
//     if (existingResetCode.length > 0) {
//       await Promise.all(
//         existingResetCode.map((code) =>
//           ResetPassword.findByIdAndDelete(code?._id)
//         )
//       );
//     }
//     let resetPayload = {
//       email: email,
//       code: resetCode,
//       expiry: currentTime,
//     };
//     const resetPassword = await ResetPassword.create(resetPayload);
//     logger.info(`Reset code for ${email}: ${resetCode}`);

//     if (resetPassword) {
//       const base_url = baseUrl;
//       const url = `${base_url}/reset/password/${resetCode}`;
//       const emailResponse = await mailService.handleForgotPasswordEmail({
//         firstName,
//         email,
//         url,
//       });
//       if (!emailResponse.success) {
//         console.warn("Email sending failed:", emailResponse.error);
//       }

//       res.status(201).json({
//         success: true,
//         message: "",
//       });
//     }
//   } catch (error) {
//     console.error("Error adding user:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

const ForgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({ success: "false", message: "Email is required" });
  }

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if email is valid
  if (!emailRegex.test(email)) {
    return res.json({ success: "false", message: "Invalid email format" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: "false", message: "Email not found." });
    }

    const resetCode =
      crypto.randomBytes(5).toString("hex") +
      crypto.createHash("md5").update(email).digest("hex");
    const expiryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await ResetPassword.deleteMany({ email, expiry: { $lt: new Date() } });

    const resetPayload = { email, code: resetCode, expiry: expiryTime };
    await ResetPassword.create(resetPayload);

    const base_url = baseUrl;
    const resetUrl = `${base_url}/resetpassword/?token=${resetCode}`;
    const emailResponse = await mailService.handleForgotPasswordEmail({
      firstName: user?.firstName,
      email,
      url: resetUrl,
    });

    if (!emailResponse.success) {
      return res
        .status(500)
        .json({ success: "false", message: "Failed to send reset email." });
    }

    res
      .status(200)
      .json({ success: "true", message: "Reset link sent to email." });
  } catch (error) {
    console.error("Forgot Password Error:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`,
    });
  }
};

const ValidateToken = async (req, res) => {
  console.log("===== req.body", req.body); // Log full body

  const { token } = req.body;
  console.log("=====token", token);
  try {
    const resetCode = await ResetPassword.findOne({ code: token });
    if (!resetCode) {
      return res.status(400).json({ status: "fail", message: "Invalid Link!" });
    }

    if (resetCode.expiry < new Date()) {
      return res
        .status(400)
        .json({ status: "fail", message: "Link has expired!" });
    }

    return res.status(200).json({
      status: "success",
      message: "Code found!",
      data: { email: resetCode.email },
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

const ResetPasswords = async (req, res) => {
  const { email, newPassword, confirmNewPassword, token } = req.body;
  try {
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match!",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Account does not exist on this email.",
      });
    }

    const resetCode = await ResetPassword.findOne({ code: token });
    if (!resetCode) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await ResetPassword.findOneAndDelete({ code: token });

    return res.status(200).json({
      status: "success",
      message: "Password Updated",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params; // Extract id from params
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: "false", message: "User not found" });
    }
    res.status(200).json({ success: "true", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfileSetting = async (req, res) => {
  const {
    id,
    firstName,
    lastName,
    email,
    dob,
    phone,
    country,
    city,
    companyName,
    postcode,
    addressLine1,
    addressLine2,
  } = req.body;
  console.log("=====id", id);

  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Validate required fields dynamically
    const missingFields = [];
    if (!firstName) missingFields.push("First Name");
    if (!lastName) missingFields.push("Last Name");
    if (!email) missingFields.push("Email");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        firstName,
        lastName,
        email,
        dob,
        phone,
        country,
        city,
        postcode,
        companyName,
        addressLine1,
        addressLine2,
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  const { userId, passwords } = req.body;
  const { currentPassword, newPassword, confirmPassword } = passwords;

  // Validation
  await check("passwords.currentPassword")
    .notEmpty()
    .withMessage("Current password is required")
    .run(req);

  await check("passwords.confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed.",
      errors: errors.array(),
    });
  }

  try {
    // Find user by userId from the request payload
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found.",
      });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        status: "fail",
        errorCode: "404",
        message: "Current password is incorrect.",
      });
    }

    // Check if new password is at least 8 characters long
    if (newPassword.length < 8) {
      return res.json({
        status: "fail",
        errorCode: "406",
        message: "password must be at least 8 characters long.",
      });
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.json({
        status: "fail",
        errorCode: "405",
        message: "New password and Confirm password do not match.",
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const changeProfilePic = async (req, res) => {
  const { photo, id } = req.body;
  console.log("==== req.body ====", photo, id);

  try {
    if (!id) {
      return res.json({ success: false, message: "User ID is required" });
    }

    if (!photo) {
      return res.json({ success: false, message: "No image uploaded" });
    }

    // const fileName = saveFile(photo); // Assuming saveFile handles storage

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { photo: photo },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile picture updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);

    return res.json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getChatUsers = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find({});

    // Get the admin role from the Role collection
    const adminRole = await Roles.findOne({ name: "Admin" });
    console.log("adminRole", adminRole);

    // Filter users to exclude admins
    const filteredUsers = users.filter(
      (user) => user.role && user.role.equals(adminRole._id) === false
    );

    res.status(200).json({ chatUser: filteredUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  OtpLogin,
  userAdd,
  getUsers,
  userUpdate,
  userDelete,
  verifyOtp,
  verifyEmail,
  ForgotPassword,
  ResetPasswords,
  ValidateToken,
  updateProfileSetting,
  getUserById,
  changePassword,
  changeProfilePic,
  getChatUsers,
};
