import { Schema, model, Document, Types } from "mongoose";

export interface ICompany extends Document {
  name: string;
  description: string;

  website?: string;

  logo?: string;

  industry: string;

  location: string;

  owner: Types.ObjectId;

  employees: number;
}

const CompanySchema = new Schema<ICompany>(
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

export default model<ICompany>("Company", CompanySchema);
