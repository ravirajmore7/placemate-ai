type RepositorySignal = {
  name: string;
  description?: string | null;
  primaryLanguage?: string | null;
  languages?: string[];
  stars?: number;
  forks?: number;
  openIssues?: number;
  hasReadme?: boolean;
  hasLiveDemo?: boolean;
  topics?: string[];
  lastUpdatedAt?: Date | string | null;
};

type ProjectSignal = {
  description?: string | null;
  techStack?: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
};

export const TECH_SKILLS = [
  "Java",
  "Python",
  "C++",
  "C",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "NestJS",
  "Spring Boot",
  "FastAPI",
  "Django",
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Git",
  "GitHub",
  "REST APIs",
  "GraphQL",
  "Machine Learning",
  "Pandas",
  "NumPy",
  "Data Structures",
  "Algorithms",
  "DSA",
  "Dynamic Programming",
  "Graphs",
  "Trees",
  "System Design",
  "DBMS",
  "Linux",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Communication",
  "Problem Solving",
  "Aptitude"
];

const ACTION_VERBS = ["built", "created", "designed", "implemented", "optimized", "improved", "deployed", "automated", "reduced", "increased"];
const SOFT_SKILLS = ["communication", "leadership", "teamwork", "ownership", "collaboration", "presentation", "problem solving"];

export function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function levelFromScore(score: number) {
  if (score <= 40) return "Beginner";
  if (score <= 60) return "Improving";
  if (score <= 80) return "Placement Ready";
  return "Highly Competitive";
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = String(value ?? "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

export function normalizeSkill(value: string) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

export function extractSkillsFromText(text = "") {
  const normalized = ` ${text.toLowerCase()} `;
  return TECH_SKILLS.filter((skill) => {
    const pattern = normalizeSkill(skill).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9+#])${pattern}([^a-z0-9+#]|$)`, "i").test(normalized);
  });
}

export function extractSoftSkills(text = "") {
  const normalized = text.toLowerCase();
  return SOFT_SKILLS.filter((skill) => normalized.includes(skill));
}

export function analyzeResumeText(text: string, profileSkills: string[] = []) {
  const cleanText = text.trim();
  const lower = cleanText.toLowerCase();
  const detectedSkills = uniqueStrings([...extractSkillsFromText(cleanText), ...profileSkills]);
  const missingSections = [
    ["Contact information", /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cleanText) || /\+?\d[\d\s-]{8,}/.test(cleanText)],
    ["Education", /education|b\.?tech|degree|university|institute|college/i.test(cleanText)],
    ["Skills", /skills|technologies|technical/i.test(cleanText) || detectedSkills.length >= 3],
    ["Projects", /project|github|deployed|portfolio/i.test(cleanText)],
    ["Experience", /experience|intern|worked|employment/i.test(cleanText)],
    ["Achievements", /achievement|award|certification|rank|winner/i.test(cleanText)]
  ].filter(([, present]) => !present).map(([section]) => section as string);

  const actionVerbHits = ACTION_VERBS.filter((verb) => lower.includes(verb)).length;
  const quantifiedImpact = (cleanText.match(/\b\d+%|\b\d+\+|\b\d+x|\b\d+\s?(users|records|requests|seconds|ms|students|rows)\b/gi) ?? []).length;
  const links = (cleanText.match(/https?:\/\/|github\.com|linkedin\.com/gi) ?? []).length;

  const contactScore = clampScore((/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cleanText) ? 5 : 0) + (/\+?\d[\d\s-]{8,}/.test(cleanText) ? 5 : 0));
  const educationScore = /education|b\.?tech|degree|university|institute|college/i.test(cleanText) ? 10 : 4;
  const skillsScore = clampScore(Math.min(15, detectedSkills.length * 3));
  const projectsScore = clampScore(/project/i.test(cleanText) ? 12 + Math.min(8, links * 2 + actionVerbHits) : 5);
  const experienceScore = /experience|intern|worked|employment/i.test(cleanText) ? 10 : 4;
  const certificationScore = /certification|achievement|award|rank|winner/i.test(cleanText) ? 10 : 3;
  const formattingScore = clampScore(cleanText.length > 600 ? 10 : cleanText.length > 250 ? 7 : 4);
  const impactScore = clampScore(Math.min(10, quantifiedImpact * 3 + actionVerbHits));
  const linksScore = clampScore(Math.min(5, links * 2));
  const resumeScore = clampScore(contactScore + educationScore + skillsScore + projectsScore + experienceScore + certificationScore + formattingScore + impactScore + linksScore);
  const atsScore = clampScore(55 + detectedSkills.length * 4 - missingSections.length * 5 + (links > 0 ? 5 : 0));

  const weakPoints = [
    ...(quantifiedImpact < 2 ? ["Project bullets need more measurable impact"] : []),
    ...(actionVerbHits < 3 ? ["Use stronger action verbs in project and experience bullets"] : []),
    ...(links === 0 ? ["Add GitHub, LinkedIn, or live project links"] : []),
    ...(detectedSkills.length < 5 ? ["Add a clearer technical skills section"] : [])
  ];

  return {
    resumeScore,
    atsScore,
    detectedSkills,
    missingSections,
    weakPoints,
    suggestions: [
      ...(missingSections.length ? [`Add missing sections: ${missingSections.join(", ")}`] : []),
      "Add numbers such as users, latency, accuracy, dataset size, or percentage improvement",
      "Link each major project to GitHub and a live demo where possible",
      "Use action verbs and make the first page ATS-readable"
    ],
    sectionScores: {
      contactScore,
      educationScore,
      skillsScore,
      projectsScore,
      experienceScore,
      certificationScore,
      formattingScore,
      impactScore,
      linksScore
    }
  };
}

export function analyzeJobDescriptionText(text: string, existingRequired: string[] = []) {
  const extracted = uniqueStrings([...existingRequired, ...extractSkillsFromText(text)]);
  const preferred = TECH_SKILLS.filter((skill) => {
    const normalized = text.toLowerCase();
    return normalized.includes(`preferred ${skill.toLowerCase()}`) || normalized.includes(`nice to have ${skill.toLowerCase()}`);
  });
  const lower = text.toLowerCase();
  const roleCategory = lower.includes("frontend")
    ? "Frontend"
    : lower.includes("backend")
      ? "Backend"
      : lower.includes("data") || lower.includes("machine learning")
        ? "Data / AI"
        : lower.includes("qa") || lower.includes("test")
          ? "QA"
          : "Software Engineering";
  const difficultyLevel = extracted.some((skill) => ["System Design", "Kubernetes", "AWS", "Dynamic Programming", "Graphs"].includes(skill))
    ? "Advanced"
    : extracted.length >= 5
      ? "Intermediate"
      : "Beginner";
  const keywords = uniqueStrings([...extracted, ...extractSoftSkills(text), roleCategory]);

  return {
    extractedSkills: extracted,
    requiredSkills: extracted,
    preferredSkills: uniqueStrings(preferred),
    roleCategory,
    difficultyLevel,
    keywords,
    softSkills: extractSoftSkills(text)
  };
}

export function scoreGitHub(repositories: RepositorySignal[], profile: { publicRepos?: number; followers?: number; following?: number }) {
  const now = Date.now();
  const repoCount = repositories.length;
  const languageCount = new Set(repositories.flatMap((repo) => [repo.primaryLanguage, ...(repo.languages ?? [])].filter(Boolean).map(String))).size;
  const withReadme = repositories.filter((repo) => repo.hasReadme).length;
  const withLiveDemo = repositories.filter((repo) => repo.hasLiveDemo).length;
  const community = repositories.reduce((sum, repo) => sum + (repo.stars ?? 0) + (repo.forks ?? 0), 0) + (profile.followers ?? 0);
  const recentlyUpdated = repositories.filter((repo) => {
    if (!repo.lastUpdatedAt) return false;
    const updated = new Date(repo.lastUpdatedAt).getTime();
    return now - updated < 1000 * 60 * 60 * 24 * 180;
  }).length;

  const score = clampScore(
    Math.min(10, profile.publicRepos ? 10 : 4) +
      Math.min(20, repoCount * 4) +
      Math.min(20, recentlyUpdated * 5) +
      Math.min(10, languageCount * 2.5) +
      Math.min(15, withReadme * 3) +
      Math.min(10, withLiveDemo * 4) +
      Math.min(5, community) +
      Math.min(10, repositories.filter((repo) => (repo.topics ?? []).length > 0 || (repo.openIssues ?? 0) > 0).length * 2)
  );

  return {
    score,
    strengths: [
      ...(recentlyUpdated >= 2 ? ["Good recent project activity"] : []),
      ...(languageCount >= 3 ? ["Multiple technology stacks used"] : []),
      ...(withReadme >= 2 ? ["Repository documentation is visible"] : []),
      ...(withLiveDemo > 0 ? ["At least one project has deployment proof"] : [])
    ],
    weaknesses: [
      ...(repoCount < 3 ? ["Low number of public repositories"] : []),
      ...(withReadme < Math.min(repoCount, 3) ? ["Some repositories are missing README files"] : []),
      ...(withLiveDemo === 0 ? ["Few projects have live demo links"] : []),
      ...(community < 3 ? ["Low open-source community proof"] : [])
    ],
    suggestions: [
      "Add README files with screenshots and setup steps",
      "Add live demo links for your strongest projects",
      "Pin your best repositories and add clear project descriptions",
      "Use repository topics to make your tech stack searchable"
    ]
  };
}

export function scoreLeetCode(input: {
  totalSolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  contestRating?: number | null;
  topicStats?: Record<string, number>;
}) {
  const totalSolved = input.totalSolved ?? 0;
  const mediumSolved = input.mediumSolved ?? 0;
  const hardSolved = input.hardSolved ?? 0;
  const topicCoverage = Object.keys(input.topicStats ?? {}).length;
  const score = clampScore(
    Math.min(25, totalSolved / 8) +
      Math.min(25, mediumSolved / 3) +
      Math.min(10, hardSolved * 2) +
      Math.min(15, totalSolved / 12) +
      Math.min(15, input.contestRating ? (input.contestRating - 1200) / 35 : 4) +
      Math.min(10, topicCoverage * 2)
  );

  return {
    score,
    strengths: [
      ...(totalSolved >= 100 ? ["Good total problem count"] : ["Basic DSA foundation present"]),
      ...(mediumSolved >= 40 ? ["Healthy medium problem practice"] : []),
      ...(input.contestRating ? ["Contest participation is visible"] : [])
    ],
    weaknesses: [
      ...(mediumSolved < 40 ? ["Medium problem count is low"] : []),
      ...(hardSolved < 8 ? ["Hard problem exposure is low"] : []),
      ...(topicCoverage < 4 ? ["Topic coverage needs more depth"] : [])
    ],
    suggestions: [
      "Solve 30 medium problems across arrays, trees, graphs, and DP",
      "Attempt weekly contests to build speed",
      "Maintain a 30-day streak before major drives",
      "Review weak topics after every mock test"
    ]
  };
}

export function scoreHackerRank(input: {
  problemSolvingScore?: number;
  pythonScore?: number;
  javaScore?: number;
  sqlScore?: number;
  certifications?: string[];
  testScores?: Array<Record<string, unknown>>;
}) {
  const languageScore = Math.max(input.pythonScore ?? 0, input.javaScore ?? 0);
  const testScore = Math.max(0, ...(input.testScores ?? []).map((item) => Number(item.score ?? item.value ?? 0)));
  const score = clampScore(
    (input.problemSolvingScore ?? 0) * 0.25 +
      languageScore * 0.2 +
      (input.sqlScore ?? 0) * 0.2 +
      Math.min(15, (input.certifications?.length ?? 0) * 7.5) +
      Math.min(20, testScore * 0.2)
  );

  return {
    score,
    strengths: [
      ...((input.sqlScore ?? 0) >= 70 ? ["Good SQL score"] : []),
      ...(languageScore >= 70 ? ["Programming language basics are strong"] : []),
      ...((input.certifications?.length ?? 0) > 0 ? ["Verified certification signal present"] : [])
    ],
    weaknesses: [
      ...((input.problemSolvingScore ?? 0) < 60 ? ["Problem-solving section needs improvement"] : []),
      ...((input.certifications?.length ?? 0) === 0 ? ["No verified certification uploaded"] : []),
      ...((input.sqlScore ?? 0) < 60 ? ["SQL score needs improvement"] : [])
    ],
    suggestions: [
      "Complete SQL certification",
      "Practice 10 medium problem-solving tasks",
      "Upload test result proof if available",
      "Keep language-specific badges current"
    ]
  };
}

export function scoreProjectQuality(projects: ProjectSignal[]) {
  if (!projects.length) return 0;
  const total = projects.reduce((sum, project) => {
    return sum + clampScore(
      25 +
        Math.min(25, (project.techStack?.length ?? 0) * 6) +
        (project.githubUrl ? 20 : 0) +
        (project.liveUrl ? 20 : 0) +
        (project.description && project.description.length > 80 ? 10 : 4)
    );
  }, 0);
  return clampScore(total / projects.length);
}

export function calculateSkillProof(input: {
  placementReadinessScore: number;
  resumeScore: number;
  githubScore: number;
  leetcodeScore: number;
  hackerRankScore: number;
  projectScore: number;
  skillVerificationScore: number;
}) {
  const overallScore = clampScore(
    input.placementReadinessScore * 0.2 +
      input.resumeScore * 0.2 +
      input.githubScore * 0.15 +
      input.leetcodeScore * 0.15 +
      input.hackerRankScore * 0.1 +
      input.projectScore * 0.1 +
      input.skillVerificationScore * 0.1
  );

  return {
    overallScore,
    level: levelFromScore(overallScore),
    breakdown: input,
    suggestions: [
      ...(input.resumeScore < 70 ? ["Improve resume structure, impact metrics, and proof links"] : []),
      ...(input.githubScore < 70 ? ["Improve GitHub README quality and live demos"] : []),
      ...(input.leetcodeScore < 70 ? ["Increase medium DSA practice and contest consistency"] : []),
      ...(input.skillVerificationScore < 70 ? ["Add proof for claimed skills through projects or certifications"] : [])
    ]
  };
}

export function proofLevel(confidenceScore: number) {
  if (confidenceScore >= 80) return "Strong Proof";
  if (confidenceScore >= 55) return "Medium Proof";
  if (confidenceScore >= 25) return "Weak Proof";
  return "No Proof Found";
}

export function buildRoadmap(durationDays: number, target: string, weakSkills: string[]) {
  const weeks = Math.max(1, Math.ceil(durationDays / 7));
  const focus = weakSkills.length ? weakSkills : ["DSA", "Resume", "GitHub", "Interview"];
  const categories = ["DSA", "Resume", "GitHub", "Project", "Interview", "SQL", "Communication"];
  const dailyTasks = Array.from({ length: durationDays }, (_, index) => {
    const skill = focus[index % focus.length];
    const category = categories[index % categories.length];
    return {
      day: index + 1,
      title: `Day ${index + 1}: strengthen ${skill}`,
      description: category === "DSA"
        ? `Solve 2 focused problems on ${skill} and review mistakes.`
        : category === "Resume"
          ? `Improve resume bullets with measurable proof for ${target}.`
          : category === "GitHub"
            ? `Update README, topics, and demo links for one project related to ${skill}.`
            : category === "Interview"
              ? `Practice interview answers and explain one ${skill} project clearly.`
              : `Complete one practical task for ${skill}.`,
      category,
      priority: index < 7 ? "HIGH" : index < 21 ? "MEDIUM" : "LOW"
    };
  });

  return {
    title: `${durationDays}-day roadmap for ${target}`,
    weeks: Array.from({ length: weeks }, (_, index) => {
      const start = index * 7;
      return {
        week: index + 1,
        goal: `Close ${focus[index % focus.length]} gaps`,
        tasks: dailyTasks.slice(start, start + 7)
      };
    }),
    dailyTasks
  };
}
