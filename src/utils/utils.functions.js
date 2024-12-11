import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { TOTP } from "totp-generator";
import natural from "natural";

const generatePresignedUrl = (imgType = "profile") => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const options = {
    folder: `project/${imgType}`,
    timestamp: timestamp,
    upload_preset: "ml_default",
  };

  const signature = cloudinary.utils.api_sign_request(
    options,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    ...options,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY,
    postUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUDNAME}/auto/upload`,
  };
};

const generateHmacSignature = (message) => {
  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET)
    .update(message)
    .digest("base64");
};

const verifyOTP = (userOTP, secret) => {
  console.log(userOTP, secret);
  const currentTimestamp = Date.now();
  const validCodes = [];

  for (let i = -1; i <= 1; i++) {
    const timestamp = currentTimestamp + i * 30000;
    const { otp } = TOTP.generate(secret, { timestamp });
    validCodes.push(otp);
  }
  const ans = Boolean(validCodes.includes(userOTP));
  console.log(ans);
  return ans;
};

const decodeAuthHeaderToken = (req) => {
  const authToken = req.headers?.authorization;
  if (!(authToken && authToken.startsWith("Bearer "))) {
    return { error: "Bearer Token Required" };
  }
  const token = authToken.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (decoded) {
    return decoded;
  } else {
    return { error: "Token Invalid or expired" };
  }
};

const calculateCosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b ** 2, 0));
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
};

const tokenizeText = (text) => {
  const tokenizer = new natural.WordTokenizer();
  return tokenizer.tokenize(text.toLowerCase()); // Lowercase for normalization
};

const createVector = (tokens, vocabulary) => {
  const vector = Array(vocabulary.length).fill(0);
  tokens.forEach((token) => {
    const index = vocabulary.indexOf(token);
    if (index !== -1) {
      vector[index] += 1; // Increment frequency
    }
  });
  return vector;
};

const getCombinedVector = (title, subtitle, description) => {
  const titleTokens = tokenizeText(title);
  const subtitleTokens = tokenizeText(subtitle);
  const descriptionTokens = tokenizeText(description);

  const allTokens = [...titleTokens, ...subtitleTokens, ...descriptionTokens];
  const vocabulary = Array.from(new Set(allTokens));

  const titleVector = createVector(titleTokens, vocabulary);
  const subtitleVector = createVector(subtitleTokens, vocabulary);
  const descriptionVector = createVector(descriptionTokens, vocabulary);

  function combineVectors(...vectors) {
    return vectors.reduce(
      (acc, vector) => acc.map((val, idx) => val + vector[idx]),
      Array(vectors[0].length).fill(0)
    );
  }

  const precomputedVector = combineVectors(
    titleVector,
    subtitleVector,
    descriptionVector
  );
  return precomputedVector;
};

function normalizeValue(value, min, max) {
  return (value - min) / (max - min);
}

export {
  generatePresignedUrl,
  generateHmacSignature,
  verifyOTP,
  decodeAuthHeaderToken,
  normalizeValue,
  getCombinedVector,
};
