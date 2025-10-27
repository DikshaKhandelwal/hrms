import { ResumeData } from './types';

// Common technical skills list
const COMMON_SKILLS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'Go', 'Rust', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'Bash',
  
  // Web Technologies
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
  'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap', 'jQuery',
  
  // Databases
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite', 'Cassandra',
  'DynamoDB', 'Firebase', 'Supabase',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub', 'GitLab',
  'CI/CD', 'Terraform', 'Ansible', 'Linux', 'Unix',
  
  // Data Science & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas',
  'NumPy', 'Keras', 'NLP', 'Computer Vision', 'Data Analysis', 'Statistics',
  
  // Mobile
  'Android', 'iOS', 'React Native', 'Flutter', 'Xamarin',
  
  // Other
  'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Selenium',
  'Testing', 'Unit Testing', 'Integration Testing', 'UI/UX', 'Figma', 'Sketch'
];

/**
 * Extract text from a file (PDF or DOCX)
 * For now, this is a placeholder - in production you'd use libraries like pdf.js or mammoth.js
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // For PDF files
  if (file.type === 'application/pdf') {
    try {
      // In a real implementation, use pdf.js or pdf-parse
      const text = await file.text();
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  }
  
  // For DOCX files
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      // In a real implementation, use mammoth.js
      const text = await file.text();
      return text;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      return '';
    }
  }
  
  // For plain text files
  if (file.type === 'text/plain') {
    return await file.text();
  }
  
  return '';
}

/**
 * Extract skills from resume text by matching against known skills
 */
export function extractSkills(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const foundSkills: string[] = [];
  
  for (const skill of COMMON_SKILLS) {
    const skillLower = skill.toLowerCase();
    // Match whole word boundaries
    const regex = new RegExp(`\\b${skillLower}\\b`, 'i');
    if (regex.test(normalizedText)) {
      foundSkills.push(skill);
    }
  }
  
  // Remove duplicates
  return [...new Set(foundSkills)];
}

/**
 * Extract years of experience from resume text
 */
export function extractExperience(text: string): number {
  const patterns = [
    /(\d+)\+?\s+years?\s+(?:of\s+)?experience/i,
    /experience\s+(?:of\s+)?(\d+)\s+years?/i,
    /worked\s+for\s+(\d+)\s+years?/i,
    /(\d+)\s+years?\s+in/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

/**
 * Parse a resume file to extract relevant information
 */
export async function parseResume(file: File): Promise<ResumeData> {
  const text = await extractTextFromFile(file);
  
  return {
    raw_text: text,
    skills: extractSkills(text),
    years_experience: extractExperience(text),
  };
}

/**
 * Calculate skill match percentage
 */
export function calculateSkillMatch(resumeSkills: string[], jobSkills: string[]): {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  const jobSkillsLower = jobSkills.map(s => s.toLowerCase().trim()).filter(s => s);
  
  const matched: string[] = [];
  const missing: string[] = [];
  
  for (const jobSkill of jobSkills) {
    const jobSkillLower = jobSkill.toLowerCase().trim();
    if (resumeSkillsLower.includes(jobSkillLower)) {
      matched.push(jobSkill);
    } else {
      missing.push(jobSkill);
    }
  }
  
  const matchPercentage = jobSkillsLower.length > 0 
    ? Math.round((matched.length / jobSkillsLower.length) * 100)
    : 0;
  
  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

/**
 * Calculate experience match percentage
 */
export function calculateExperienceMatch(
  resumeYears: number,
  jobLevel: string
): number {
  const levelLower = jobLevel.toLowerCase();
  
  let requiredYears = 0;
  if (levelLower.includes('entry')) {
    requiredYears = 0;
  } else if (levelLower.includes('mid')) {
    requiredYears = 2;
  } else if (levelLower.includes('senior')) {
    requiredYears = 5;
  }
  
  if (resumeYears >= requiredYears) {
    return 100;
  }
  
  if (requiredYears > 0 && resumeYears > 0) {
    return Math.min(Math.round((resumeYears / requiredYears) * 70), 80);
  }
  
  if (requiredYears === 0) {
    return 100;
  }
  
  return 10;
}
