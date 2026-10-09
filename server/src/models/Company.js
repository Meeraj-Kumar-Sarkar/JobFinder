import { Schema, model } from "mongoose";

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: String,

    website: String,

    logo: String,

    industry: String,

    location: String,

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employees: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

export default model("Company", CompanySchema);
