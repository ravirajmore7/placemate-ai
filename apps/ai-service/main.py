from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    import fitz  # PyMuPDF
except Exception:  # pragma: no cover - optional local dependency
    fitz = None


app = FastAPI(title="PlaceMate AI SkillProof Service", version="0.2.0")

TECH_SKILLS = [
    "Java",
    "Python",
    "C++",
    "C",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "Spring Boot",
    "FastAPI",
    "SQL",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "Git",
    "GitHub",
    "REST APIs",
    "GraphQL",
    "Machine Learning",
    "Pandas",
    "NumPy",
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
    "Aptitude",
]

SOFT_SKILLS = ["communication", "leadership", "teamwork", "collaboration", "presentation", "ownership"]
ACTION_VERBS = ["built", "created", "designed", "implemented", "optimized", "improved", "deployed", "automated"]


class ResumePayload(BaseModel):
    resume_text: Optional[str] = Field(default=None, alias="resumeText")
    file_path: Optional[str] = Field(default=None, alias="filePath")
    student_profile_data: Dict[str, Any] = Field(default_factory=dict, alias="studentProfileData")

    class Config:
        populate_by_name = True


class TextPayload(BaseModel):
    text: str = ""
    job_description: Optional[str] = Field(default=None, alias="jobDescription")

    class Config:
        populate_by_name = True


class MatchPayload(BaseModel):
    resume_text: str = Field(default="", alias="resumeText")
    job_description: str = Field(default="", alias="jobDescription")
    student_profile_data: Dict[str, Any] = Field(default_factory=dict, alias="studentProfileData")

    class Config:
        populate_by_name = True


class SkillProofPayload(BaseModel):
    placement_readiness_score: int = Field(default=0, alias="placementReadinessScore")
    resume_score: int = Field(default=0, alias="resumeScore")
    github_score: int = Field(default=0, alias="githubScore")
    leetcode_score: int = Field(default=0, alias="leetcodeScore")
    hacker_rank_score: int = Field(default=0, alias="hackerRankScore")
    project_score: int = Field(default=0, alias="projectScore")
    skill_verification_score: int = Field(default=0, alias="skillVerificationScore")

    class Config:
        populate_by_name = True


class FakeSkillPayload(BaseModel):
    profile_skills: List[str] = Field(default_factory=list, alias="profileSkills")
    resume_skills: List[str] = Field(default_factory=list, alias="resumeSkills")
    github_skills: List[str] = Field(default_factory=list, alias="githubSkills")
    project_tech_stacks: List[str] = Field(default_factory=list, alias="projectTechStacks")
    coding_profile_data: Dict[str, Any] = Field(default_factory=dict, alias="codingProfileData")

    class Config:
        populate_by_name = True


class RoadmapPayload(BaseModel):
    student_profile: Dict[str, Any] = Field(default_factory=dict, alias="studentProfile")
    target_company: Optional[str] = Field(default=None, alias="targetCompany")
    target_drive: Optional[str] = Field(default=None, alias="targetDrive")
    weak_skills: List[str] = Field(default_factory=list, alias="weakSkills")
    duration: int = 30

    class Config:
        populate_by_name = True


def clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def level(score: int) -> str:
    if score <= 40:
        return "Beginner"
    if score <= 60:
        return "Improving"
    if score <= 80:
        return "Placement Ready"
    return "Highly Competitive"


def unique(values: List[str]) -> List[str]:
    seen = set()
    output = []
    for value in values:
        clean = str(value).strip()
        if not clean:
            continue
        key = clean.lower()
        if key in seen:
            continue
        seen.add(key)
        output.append(clean)
    return output


def extract_pdf_text(path: str) -> str:
    if not path:
        return ""
    file_path = Path(path)
    if not file_path.exists():
        return ""
    if file_path.suffix.lower() != ".pdf" or fitz is None:
        return file_path.read_text(encoding="utf-8", errors="ignore") if file_path.suffix.lower() in {".txt", ".md"} else ""
    doc = fitz.open(file_path)
    return "\n".join(page.get_text("text") for page in doc)


def extract_skills(text: str) -> List[str]:
    lowered = f" {text.lower()} "
    skills = []
    for skill in TECH_SKILLS:
        token = re.escape(skill.lower().replace(".", ""))
        normalized_text = lowered.replace(".", "")
        if re.search(rf"(^|[^a-z0-9+#]){token}([^a-z0-9+#]|$)", normalized_text):
            skills.append(skill)
    return unique(skills)


def extract_soft_skills(text: str) -> List[str]:
    lowered = text.lower()
    return [skill.title() for skill in SOFT_SKILLS if skill in lowered]


def analyze_resume_text(text: str, profile_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty resume text")

    profile_data = profile_data or {}
    profile_skills = [skill.get("name", "") for skill in profile_data.get("skills", []) if isinstance(skill, dict)]
    detected_skills = unique(extract_skills(text) + profile_skills)
    missing_sections = []
    checks = {
        "Contact information": bool(re.search(r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}", text, re.I))
        and bool(re.search(r"\+?\d[\d\s-]{8,}", text)),
        "Education": bool(re.search(r"education|b\.?tech|degree|university|college|institute", text, re.I)),
        "Skills": bool(re.search(r"skills|technologies|technical", text, re.I)) or len(detected_skills) >= 3,
        "Projects": bool(re.search(r"project|github|deployed|portfolio", text, re.I)),
        "Experience": bool(re.search(r"experience|intern|employment|worked", text, re.I)),
        "Achievements": bool(re.search(r"achievement|award|certification|rank|winner", text, re.I)),
    }
    for section, present in checks.items():
        if not present:
            missing_sections.append(section)

    action_hits = sum(1 for verb in ACTION_VERBS if verb in text.lower())
    impact_hits = len(re.findall(r"\b\d+%|\b\d+\+|\b\d+x|\b\d+\s?(users|records|requests|students|rows|ms)\b", text, re.I))
    links = len(re.findall(r"https?://|github\.com|linkedin\.com", text, re.I))

    contact_score = 10 if checks["Contact information"] else 5 if "@" in text else 0
    education_score = 10 if checks["Education"] else 4
    skills_score = min(15, len(detected_skills) * 3)
    projects_score = 18 if checks["Projects"] and links else 13 if checks["Projects"] else 5
    experience_score = 10 if checks["Experience"] else 4
    certification_score = 10 if checks["Achievements"] else 3
    formatting_score = 10 if len(text) > 600 else 7 if len(text) > 250 else 4
    impact_score = min(10, impact_hits * 3 + action_hits)
    links_score = min(5, links * 2)
    resume_score = clamp(
        contact_score
        + education_score
        + skills_score
        + projects_score
        + experience_score
        + certification_score
        + formatting_score
        + impact_score
        + links_score
    )
    ats_score = clamp(55 + len(detected_skills) * 4 - len(missing_sections) * 5 + (5 if links else 0))
    weak_points = []
    if impact_hits < 2:
        weak_points.append("Project bullets need more measurable impact")
    if links == 0:
        weak_points.append("Missing GitHub, LinkedIn, or live project links")
    if len(detected_skills) < 5:
        weak_points.append("Technical skills section is too thin")

    return {
        "resumeScore": resume_score,
        "atsScore": ats_score,
        "detectedSkills": detected_skills,
        "missingSections": missing_sections,
        "weakPoints": weak_points,
        "suggestions": [
            "Add measurable outcomes such as users, accuracy, latency, or dataset size",
            "Link major projects to GitHub and live demos",
            "Use strong action verbs in project and internship bullets",
            "Keep formatting simple for ATS parsing",
        ],
        "sectionScores": {
            "contactScore": contact_score,
            "educationScore": education_score,
            "skillsScore": skills_score,
            "projectsScore": projects_score,
            "experienceScore": experience_score,
            "certificationScore": certification_score,
            "formattingScore": formatting_score,
            "impactScore": impact_score,
            "linksScore": links_score,
        },
    }


def analyze_jd(text: str) -> Dict[str, Any]:
    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty job description")
    required = extract_skills(text)
    lowered = text.lower()
    preferred = [skill for skill in TECH_SKILLS if f"preferred {skill.lower()}" in lowered or f"nice to have {skill.lower()}" in lowered]
    role_category = (
        "Frontend"
        if "frontend" in lowered
        else "Backend"
        if "backend" in lowered
        else "Data / AI"
        if "machine learning" in lowered or "data" in lowered
        else "Software Engineering"
    )
    difficulty = "Advanced" if {"System Design", "Kubernetes", "AWS", "Dynamic Programming", "Graphs"} & set(required) else "Intermediate" if len(required) >= 5 else "Beginner"
    return {
        "requiredSkills": required,
        "preferredSkills": unique(preferred),
        "keywords": unique(required + extract_soft_skills(text) + [role_category]),
        "roleCategory": role_category,
        "difficultyLevel": difficulty,
    }


@app.get("/")
def health() -> Dict[str, Any]:
    return {
        "service": "placemate-ai-service",
        "status": "ok",
        "stage": 2,
        "capabilities": ["resume-analysis", "skill-extraction", "jd-analysis", "matching", "skillproof", "roadmaps"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/analyze-resume")
def analyze_resume(payload: ResumePayload) -> Dict[str, Any]:
    text = payload.resume_text or extract_pdf_text(payload.file_path or "")
    return analyze_resume_text(text, payload.student_profile_data)


@app.post("/extract-skills")
def extract_skills_endpoint(payload: TextPayload) -> Dict[str, Any]:
    text = payload.text or payload.job_description or ""
    return {
        "skills": extract_skills(text),
        "technologies": [skill for skill in extract_skills(text) if skill not in {"Communication", "Problem Solving", "Aptitude"}],
        "softSkills": extract_soft_skills(text),
        "roleCategory": analyze_jd(text)["roleCategory"] if text.strip() else "Unknown",
    }


@app.post("/analyze-job-description")
def analyze_job_description(payload: TextPayload) -> Dict[str, Any]:
    return analyze_jd(payload.job_description or payload.text)


@app.post("/match-resume-with-jd")
def match_resume_with_jd(payload: MatchPayload) -> Dict[str, Any]:
    resume = analyze_resume_text(payload.resume_text, payload.student_profile_data)
    jd = analyze_jd(payload.job_description)
    resume_skills = set(skill.lower() for skill in resume["detectedSkills"])
    required = jd["requiredSkills"]
    matched = [skill for skill in required if skill.lower() in resume_skills]
    missing = [skill for skill in required if skill.lower() not in resume_skills]
    match_score = clamp(
        (len(matched) / max(len(required), 1)) * 35
        + resume["resumeScore"] * 0.2
        + resume["atsScore"] * 0.15
        + (100 - len(missing) * 8) * 0.15
        + 15
    )
    return {
        "matchScore": match_score,
        "matchedSkills": matched,
        "missingSkills": missing,
        "weakSkills": missing[:3],
        "reasons": [f"{len(matched)}/{max(len(required), 1)} required skills matched", f"Resume score is {resume['resumeScore']}/100"],
        "suggestions": [f"Add proof for {skill}" for skill in missing[:5]] or ["Maintain current proof quality and prepare for interviews"],
    }


@app.post("/calculate-skillproof-score")
def calculate_skillproof_score(payload: SkillProofPayload) -> Dict[str, Any]:
    breakdown = {
        "placementReadinessScore": payload.placement_readiness_score,
        "resumeScore": payload.resume_score,
        "githubScore": payload.github_score,
        "leetcodeScore": payload.leetcode_score,
        "hackerRankScore": payload.hacker_rank_score,
        "projectScore": payload.project_score,
        "skillVerificationScore": payload.skill_verification_score,
    }
    overall = clamp(
        payload.placement_readiness_score * 0.2
        + payload.resume_score * 0.2
        + payload.github_score * 0.15
        + payload.leetcode_score * 0.15
        + payload.hacker_rank_score * 0.1
        + payload.project_score * 0.1
        + payload.skill_verification_score * 0.1
    )
    return {
        "overallScore": overall,
        "level": level(overall),
        "breakdown": breakdown,
        "suggestions": [
            "Improve the lowest scoring platform first",
            "Add public proof for claimed skills",
            "Keep resume, projects, and GitHub technologies consistent",
        ],
    }


@app.post("/detect-fake-skills")
def detect_fake_skills(payload: FakeSkillPayload) -> Dict[str, Any]:
    all_skills = unique(payload.profile_skills + payload.resume_skills + payload.project_tech_stacks)
    github = set(skill.lower() for skill in payload.github_skills)
    projects = set(skill.lower() for skill in payload.project_tech_stacks)
    resume = set(skill.lower() for skill in payload.resume_skills)
    verification = []
    for skill in all_skills:
        confidence = 0
        if skill.lower() in resume:
            confidence += 20
        if skill.lower() in projects:
            confidence += 35
        if skill.lower() in github:
            confidence += 35
        if skill.lower() in {"dsa", "sql", "java", "python"} and payload.coding_profile_data:
            confidence += 10
        proof = "Strong Proof" if confidence >= 80 else "Medium Proof" if confidence >= 55 else "Weak Proof" if confidence >= 25 else "No Proof Found"
        verification.append(
            {
                "skillName": skill,
                "proofLevel": proof,
                "confidenceScore": clamp(confidence),
                "suggestion": "Strong verified signal" if confidence >= 80 else f"Add project, GitHub, or certification proof for {skill}",
            }
        )
    return {"skillVerificationList": verification}


@app.post("/generate-roadmap")
def generate_roadmap(payload: RoadmapPayload) -> Dict[str, Any]:
    duration = payload.duration if payload.duration in {7, 15, 30, 60} else 30
    target = payload.target_drive or payload.target_company or "placement readiness"
    weak = payload.weak_skills or ["DSA", "Resume", "GitHub", "Interview"]
    daily_tasks = []
    categories = ["DSA", "Resume", "GitHub", "Project", "Interview", "SQL", "Communication"]
    for day in range(1, duration + 1):
        skill = weak[(day - 1) % len(weak)]
        category = categories[(day - 1) % len(categories)]
        daily_tasks.append(
            {
                "day": day,
                "title": f"Day {day}: strengthen {skill}",
                "description": f"Complete one focused {category} task for {target}.",
                "category": category,
                "priority": "HIGH" if day <= 7 else "MEDIUM" if day <= 21 else "LOW",
            }
        )
    weeks = [
        {"week": index + 1, "goal": f"Close {weak[index % len(weak)]} gap", "tasks": daily_tasks[index * 7 : (index + 1) * 7]}
        for index in range((duration + 6) // 7)
    ]
    return {"roadmapTitle": f"{duration}-day roadmap for {target}", "weeklyPlan": weeks, "dailyTasks": daily_tasks, "priorities": weak}


@app.post("/calculate-readiness")
def calculate_readiness_alias(payload: Dict[str, Any]) -> Dict[str, Any]:
    return calculate_skillproof_score(
        SkillProofPayload(
            placementReadinessScore=payload.get("placementReadinessScore", 70),
            resumeScore=payload.get("resumeScore", 65),
            githubScore=payload.get("githubScore", 60),
            leetcodeScore=payload.get("leetcodeScore", 55),
            hackerRankScore=payload.get("hackerRankScore", 50),
            projectScore=payload.get("projectScore", 70),
            skillVerificationScore=payload.get("skillVerificationScore", 60),
        )
    )


@app.post("/match-job")
def match_job_alias(payload: Dict[str, Any]) -> Dict[str, Any]:
    return match_resume_with_jd(
        MatchPayload(
            resumeText=payload.get("resumeText", payload.get("resume", "")),
            jobDescription=payload.get("jobDescription", payload.get("job", "")),
            studentProfileData=payload.get("studentProfileData", {}),
        )
    )
