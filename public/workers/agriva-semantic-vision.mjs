import {
  SEMANTIC_MODEL_ID,
  SEMANTIC_MODEL_CACHE_VERSION,
  MAX_SEMANTIC_CANDIDATES,
  SEMANTIC_VECTOR_DIMENSIONS,
  unitVector,
  cosineSimilarity,
  combinedVisualScore,
} from "./semantic-math.mjs";

// The worker is started only after an explicit user click. In particular,
// merely opening AGRIVA or performing an ordinary image-hash search does not
// download an ML model or call a paid inference service.
const TRANSFORMERS_ESM = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2";
const CACHE_DATABASE = "agriva-visual-embeddings-v1";
const CACHE_STORE = "vectors";
const CACHE_TTL = 14 * 24 * 60 * 60 * 1000;
const MAX_RUN_MS = 180_000;
let busy = false;
let cachedDbPromise;

function notify(payload) {
  self.postMessage(payload);
}

function openVectorCache() {
  if (cachedDbPromise) return cachedDbPromise;
  cachedDbPromise = new Promise((resolve) => {
    if (!("indexedDB" in self)) {
      resolve(null);
      return;
    }
    let request;
    try {
      request = indexedDB.open(CACHE_DATABASE, 1);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CACHE_STORE)) {
        request.result.createObjectStore(CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return cachedDbPromise;
}

async function readCachedEmbedding(key) {
  const db = await openVectorCache();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(CACHE_STORE, "readonly");
    const request = tx.objectStore(CACHE_STORE).get(key);
    request.onsuccess = () => {
      const item = request.result;
      if (item && typeof item.createdAt === "number" && Date.now() - item.createdAt < CACHE_TTL &&
        Array.isArray(item.vector) && item.vector.length === SEMANTIC_VECTOR_DIMENSIONS) {
        resolve(unitVector(item.vector));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

async function storeEmbedding(key, vector) {
  const db = await openVectorCache();
  if (!db) return;
  await new Promise((resolve) => {
    const tx = db.transaction(CACHE_STORE, "readwrite");
    const request = tx.objectStore(CACHE_STORE).put({
      createdAt: Date.now(),
      vector: Array.from(vector),
    }, key);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

function safeProduct(value) {
  if (!value || typeof value !== "object") return null;
  const { id, image_url, visualScore } = value;
  if (typeof id !== "string" || !/^[a-f0-9-]{20,40}$/i.test(id)) return null;
  if (typeof image_url !== "string" || image_url.length > 1200) return null;
  try {
    const url = new URL(image_url);
    if (url.protocol !== "https:" || url.username || url.password ||
      !url.pathname.startsWith("/storage/v1/object/public/product-images/") ||
      url.search || url.hash) return null;
  } catch {
    return null;
  }
  return { id, image_url, visualScore: Number.isFinite(visualScore) ? visualScore : 0 };
}

self.addEventListener("message", async (event) => {
  if (busy || event.data?.type !== "search") return;
  busy = true;
  const begun = Date.now();

  try {
    const photo = event.data.photo;
    if (typeof photo !== "string" || !photo.startsWith("data:image/jpeg;base64,") || photo.length > 400_000) {
      throw new Error("এই ছবিটি বিশ্লেষণ করা যাচ্ছে না।");
    }
    const products = (Array.isArray(event.data.products) ? event.data.products : [])
      .slice(0, MAX_SEMANTIC_CANDIDATES).map(safeProduct).filter(Boolean);
    if (products.length === 0) throw new Error("তুলনা করার মতো পণ্যের ছবি নেই।");

    notify({ type: "progress", stage: "model", done: 0, total: products.length });
    // Use the published, exact CDN package release. No server API key, paid
    // endpoint or uploaded user image is involved.
    const { pipeline } = await import(TRANSFORMERS_ESM);
    const extractor = await pipeline("image-feature-extraction", SEMANTIC_MODEL_ID, {
      device: "wasm",
      dtype: "q8",
      progress_callback: (progress) => {
        if (progress?.status === "progress" && Number.isFinite(progress.progress)) {
          notify({ type: "model-progress", percent: Math.max(0, Math.min(100, Math.round(progress.progress))) });
        }
      },
    });

    async function embed(source) {
      const tensor = await extractor(source);
      const vector = unitVector(tensor?.data);
      if (!vector) throw new Error("Image embedding response was invalid.");
      return vector;
    }

    const queryVector = await embed(photo);
    notify({ type: "progress", stage: "products", done: 0, total: products.length });
    let completed = 0;
    const results = [];

    for (const product of products) {
      if (Date.now() - begun > MAX_RUN_MS) break;
      try {
        const cacheKey = SEMANTIC_MODEL_CACHE_VERSION + "|" + product.image_url;
        let embedding = await readCachedEmbedding(cacheKey);
        if (!embedding) {
          embedding = await embed(product.image_url);
          await storeEmbedding(cacheKey, embedding);
        }
        const similarity = cosineSimilarity(queryVector, embedding);
        const score = combinedVisualScore(similarity, product.visualScore);
        if (similarity >= 0.18 && Number.isFinite(score)) {
          results.push({ id: product.id, score, semantic: similarity });
        }
      } catch {
        // Individual remote images may be inaccessible or corrupt. Never
        // fail all results if one public product image cannot be processed.
      } finally {
        completed++;
        notify({ type: "progress", stage: "products", done: completed, total: products.length });
      }
    }

    if (results.length === 0) {
      throw new Error("ছবির মিল নিশ্চিত করা যায়নি। সাধারণ ছবি-মিলের ফলাফল দেখানো হচ্ছে।");
    }
    results.sort((a, b) => b.score - a.score);
    notify({ type: "results", results: results.slice(0, 12), checked: completed, total: products.length });
  } catch (error) {
    notify({
      type: "error",
      message: error instanceof Error ? error.message : "উন্নত ছবি মিল এখন পাওয়া যাচ্ছে না।",
    });
  } finally {
    busy = false;
  }
});
