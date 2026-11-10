export type CVLanguage = "en" | "bn";

export type CVProfile = {
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
};

export type CVTextEntry = {
  id: string;
  content: string;
};

export type CVDocument = {
  schemaVersion: 2;
  profile: CVProfile;
  summary: string;
  experience: CVTextEntry[];
  education: CVTextEntry[];
  skills: CVTextEntry[];
  languages: CVTextEntry[];
  certifications: CVTextEntry[];
  settings: {
    language: CVLanguage;
    templateId: string;
  };
};

export type CVLegacyFlatData = {
  fullName?: unknown;
  headline?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  photoUrl?: unknown;
  summary?: unknown;
  experience?: unknown;
  education?: unknown;
  skills?: unknown;
  languages?: unknown;
  certifications?: unknown;
};

export type CVStoredEnvelopeV1 = {
  cv?: CVLegacyFlatData;
  template?: unknown;
  language?: unknown;
};

export type CVStoredEnvelopeV2 = {
  schemaVersion: 2;
  document: CVDocument;
  template?: unknown;
  language?: unknown;
};

export const CV_STORAGE_KEY = "agriva-cv-v1";
export const CV_SCHEMA_VERSION = 2;
export const DEFAULT_CV_TEMPLATE = "classic";

export function createEmptyCVDocument(language: CVLanguage = "en"): CVDocument {
  return {
    schemaVersion: CV_SCHEMA_VERSION,
    profile: {
      fullName: "",
      headline: "",
      phone: "",
      email: "",
      address: "",
      photoUrl: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    settings: {
      language,
      templateId: DEFAULT_CV_TEMPLATE,
    },
  };
}
