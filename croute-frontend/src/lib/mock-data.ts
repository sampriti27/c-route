// Sample PROFILE INPUT only — used by the "Fill Example Profile" convenience button
// on the Profile page to speed up demos. This never stands in for a backend response;
// all scored data (routes, breakdowns, skill gaps, roadmap, CRO explanations) comes
// from the live API.

export interface ExtractedSkill {
  name: string;
  category: "Technical" | "Domain" | "Soft";
  proficiency: "Strong" | "Moderate" | "Basic";
}

export const SAMPLE_EXTRACTED_SKILLS: ExtractedSkill[] = [
  { name: "Excel", category: "Technical", proficiency: "Strong" },
  { name: "Financial Modeling", category: "Domain", proficiency: "Strong" },
  { name: "SQL", category: "Technical", proficiency: "Basic" },
  { name: "PowerPoint", category: "Soft", proficiency: "Strong" },
  { name: "Data Analysis", category: "Technical", proficiency: "Moderate" },
  { name: "Stakeholder Reporting", category: "Soft", proficiency: "Strong" },
];

export const SAMPLE_BACKGROUND_TEXT = `I have 3 years of experience as a Junior Finance Executive. I work with Excel daily for financial modelling and reporting. I have some SQL knowledge from an online course, and I use PowerPoint for stakeholder presentations. I'm comfortable with data analysis and have started exploring Power BI. My goal is to move into a more analytical role — either business analytics or data analytics.`;
