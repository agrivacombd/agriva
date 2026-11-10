import { migrateStoredEnvelope } from "@/lib/jobs/cv/migration";
import {
  CV_SCHEMA_VERSION,
  CV_STORAGE_KEY,
  type CVDocument,
  type CVLanguage,
} from "@/lib/jobs/cv/types";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type LoadedCV = {
  document: CVDocument | null;
  migrated: boolean;
};

export function loadCV(storage: StorageLike): LoadedCV {
  try {
    const raw = storage.getItem(CV_STORAGE_KEY);
    if (!raw) return { document: null, migrated: false };
    const parsed: unknown = JSON.parse(raw);
    const document = migrateStoredEnvelope(parsed);
    const migrated =
      Boolean(document) &&
      Boolean(parsed) &&
      typeof parsed === "object" &&
      (parsed as { schemaVersion?: unknown }).schemaVersion !== CV_SCHEMA_VERSION;
    return { document, migrated };
  } catch {
    return { document: null, migrated: false };
  }
}

export function saveCV(
  storage: StorageLike,
  document: CVDocument,
  options: { language: CVLanguage; template: string },
): boolean {
  try {
    storage.setItem(
      CV_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: CV_SCHEMA_VERSION,
        document,
        language: options.language,
        template: options.template,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
