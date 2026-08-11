import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "./config";

export const MAX_CHART_IMAGES = 3;
export const MAX_CHART_BYTES = 8 * 1024 * 1024;

function assertOwner(uid: string) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) throw new Error("Authenticated user does not own this path.");
}

export async function uploadTradeCharts(uid: string, tradeId: string, files: readonly File[]) {
  assertOwner(uid);
  if (files.length > MAX_CHART_IMAGES) throw new Error("A trade can have at most three chart images.");
  for (const file of files) {
    if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
    if (file.size > MAX_CHART_BYTES) throw new Error("Each chart image must be 8 MB or smaller.");
  }
  return Promise.all(files.map(async file => {
    const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "image";
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const chartRef = ref(storage, `users/${uid}/trades/${tradeId}/charts/${id}.${extension}`);
    await uploadBytes(chartRef, file, { contentType: file.type });
    return getDownloadURL(chartRef);
  }));
}

export async function deleteChartUrls(uid: string, urls: readonly string[]) {
  assertOwner(uid);
  await Promise.all(urls.map(url => deleteObject(ref(storage, url)).catch(error => console.warn("Could not remove chart image.", error))));
}

export async function deleteTradeCharts(uid: string, tradeId: string) {
  assertOwner(uid);
  const folder = ref(storage, `users/${uid}/trades/${tradeId}/charts`);
  const files = await listAll(folder);
  await Promise.all(files.items.map(item => deleteObject(item)));
}
