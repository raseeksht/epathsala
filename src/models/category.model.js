import mongoose, { mongo } from "mongoose";

const categorySchena = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const categoryModel = mongoose.model("Category", categorySchena);

export default categoryModel;
