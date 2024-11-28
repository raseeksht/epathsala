import express from "express";
import cors from "cors";
import "dotenv/config";
import { dbConnect } from "./config/dbConfig.js";
import path from "path";
import { fileURLToPath } from "url";

import { errorMiddleware } from "./middlewares/errors.middlewares.js";
import userRoutes from "./routes/user.routes.js";
import urlRoutes from "./routes/url.routes.js";
// import organizationRoutes from "./routes/organization.routes.js";
import courseRoutes from "./routes/course.routes.js";
import postsRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import videoRoutes from "./routes/videos.routes.js";
import paymentRoutes from "./routes/paymentConfirmation.routes.js";
import categoryRoutes from "./routes/category.routes.js";

dbConnect();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  console.log("hello world");
  res.send("hello world");
});

app.use("/api/users", userRoutes);
app.use("/api/url", urlRoutes);
// app.use("/api/organization", organizationRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/category", categoryRoutes);

app.use(errorMiddleware);

app.listen(8000, () => {
  console.log("server running on port 8000");
});
