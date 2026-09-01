import User from "../schemas/userSchema.js";

// Create New User
export const createUser = async ({
  full_name,
  email,
  password,
  role,
  phone,
  profile_image,
}) => {
  const user = await User.create({
    full_name,
    email,
    password,
    role: role || "student",
    phone: phone || null,
    profile_image: profile_image || null,
  });

  return { insertId: user._id };
};

// Find User By Email
export const findUserByEmail = async (email) => {
  return await User.findOne({ email }).lean();
};

// Find User By ID
export const findUserById = async (id) => {
  return await User.findById(id).lean();
};

// Update User OTP
export const updateUserOTP = async (id, otp, expiry) => {
  return await User.findByIdAndUpdate(id, {
    otp_code: otp,
    otp_expiry: expiry,
  });
};

// Clear User OTP
export const clearUserOTP = async (id) => {
  return await User.findByIdAndUpdate(id, {
    otp_code: null,
    otp_expiry: null,
  });
};