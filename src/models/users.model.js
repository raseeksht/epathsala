import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    userType: {
      type: "String",
      enum: ["student", "teacher"],
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
    },
    number: {
      type: String,
    },
    address: {
      type: String,
    },
    municipality: {
      type: String,
    },
    district: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    use2FA: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "10d" });
};

userSchema.methods.generateRefreshToken = function (payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET);
};

const userModel = model("User", userSchema);

export { userModel };
