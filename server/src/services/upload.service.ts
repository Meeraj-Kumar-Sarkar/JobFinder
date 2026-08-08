import { firebaseStorage } from "../config/firebase";

import { generateFileName } from "../utils/generateFileName";

export async function uploadResume(file: Express.Multer.File) {
  const fileName = generateFileName(file.originalname);

  const blob = firebaseStorage.file(fileName);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  await blob.makePublic();

  return blob.publicUrl();
}
