import { Schema, model } from "mongoose";

const creatorSchema = Schema({
  name: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const creatorModel = model("Creator", organizationSchema);

export { creatorModel };
