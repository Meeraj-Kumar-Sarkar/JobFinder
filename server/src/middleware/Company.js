import Company from "../models/Company.js";

export const create_company = async (req, res) => {
  try {
    const {
      name,
      description,
      website,
      logo,
      industry,
      location,
      owner,
      employees,
    } = req.body;
    const company = await Company.create({
      name,
      description,
      website,
      logo,
      industry,
      location,
      owner,
      employees,
    });
    console.log("Company is added successfully!!");
    return res.status(200).json({ message: "successfully added company" });
  } catch (e) {
    console.log("Error", e);
    return res.status(500).json({ message: "unsuccessfull" });
  }
};
