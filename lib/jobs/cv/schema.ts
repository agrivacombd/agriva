export type CVLanguage = "bn" | "en";

export type CVProfile = {
  fullName: string;
  headline: string;
  phone: string;
  email: string;
  address: string;
  photoUrl: string;
  website: string;
  linkedIn: string;
  location: string;
};

export type CVExperience = {
  id: string;
  role: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type CVEducation = {
  id: string;
  qualification: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  details: string;
};

export type CVDocument = {
  version: 2;
  profile: CVProfile;
  summary: string;
  experience: CVExperience[];
  education: CVEducation[];
  skills: string[];
  languages: string[];
  certifications: string[];
  projects: Array<{ id: string; name: string; role: string; url: string; description: string }>;
  customSections: Array<{ id: string; title: string; content: string }>;
  settings: {
    template: string;
    language: CVLanguage;
    accentColor: string;
    pageSize: "A4";
  };
};

export type CVStorageState = {
  version: 2;
  document: CVDocument;
};

export const createEmptyCVDocument = (
  language: CVLanguage = "en",
  template = "classic",
): CVDocument => ({
  version: 2,
  profile: {
    fullName: "",
    headline: "",
    phone: "",
    email: "",
    address: "",
    photoUrl: "",
    website: "",
    linkedIn: "",
    location: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  customSections: [],
  settings: {
    template,
    language,
    accentColor: "#166534",
    pageSize: "A4",
  },
});
