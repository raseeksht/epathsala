import express from "express";
import cors from 'cors';
import 'dotenv/config';
import { dbConnect } from "./config/dbConfig.js";

import { errorMiddleware } from "./middlewares/errors.middlewares.js";
import userRoutes from './routes/user.routes.js';
import urlRoutes from './routes/url.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import courseRoutes from "./routes/course.routes.js";



dbConnect();

const app = express()
app.use(express.json());
app.use(cors({ origin: "*" }));



app.get("/", (req, res) => {
    console.log("hello world")
    res.send("hello world")
})

app.use("/api/users", userRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/course", courseRoutes);

app.use(errorMiddleware)


app.listen(8000, () => {
    console.log("server running on port 8000")
})