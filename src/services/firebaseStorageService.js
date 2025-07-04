import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo:", error);
    throw new Error("Falha ao fazer upload do arquivo.");
  }
};

export const deleteFileByUrl = async (fileUrl) => {
  try {
    const url = new URL(fileUrl);
    const pathWithQuery = url.pathname.split('/o/')[1];
    const path = decodeURIComponent(pathWithQuery.split('?')[0]);

    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    if (error.code !== 'storage/object-not-found') {
      console.error("Erro ao excluir arquivo:", error);
      throw new Error("Falha ao excluir arquivo.");
    }
  }
};
