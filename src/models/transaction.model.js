import { Schema, model } from "mongoose";

const TransactionSchema = new Schema({
  transactionCode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  transactionUuid: {
    type: String,
    required: true,
  },
  productCode: {
    type: String,
  },
  signature: {
    type: String,
  },
  fee: {
    type: Number,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const txnModel = model("Transaction", TransactionSchema);

export { txnModel };
