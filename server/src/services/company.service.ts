import Company from "../models/Company";

export async function createCompany(data: any) {
  return Company.create(data);
}

export async function getCompany(id: string) {
  return Company.findById(id).populate("owner");
}

export async function updateCompany(id: string, payload: any) {
  return Company.findByIdAndUpdate(id, payload, {
    new: true,
  });
}
