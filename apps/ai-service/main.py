from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="PlaceMate AI Placeholder Service", version="0.1.0")


class Payload(BaseModel):
    data: Dict[str, Any] = {}


@app.get("/")
def health() -> Dict[str, Any]:
    return {
        "service": "placemate-ai-service",
        "status": "ok",
        "stage": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/analyze-resume")
def analyze_resume(payload: Payload) -> Dict[str, Any]:
    return {
        "score": 72,
        "summary": "Resume analysis placeholder. Stage 2 will parse sections, ATS fit, and impact metrics.",
        "keywords": ["Java", "React", "SQL", "Projects"],
        "inputEcho": payload.data,
    }


@app.post("/calculate-readiness")
def calculate_readiness(payload: Payload) -> Dict[str, Any]:
    return {
        "score": 74,
        "level": "Placement Ready",
        "breakdown": {
            "profile": 18,
            "resume": 15,
            "skills": 12,
            "projects": 18,
            "codingProfiles": 10,
            "cgpa": 8,
            "backlogs": 5,
        },
        "suggestions": [
            "Add one more deployed project",
            "Improve GitHub profile documentation",
            "Solve more medium-level DSA problems",
        ],
        "inputEcho": payload.data,
    }


@app.post("/match-job")
def match_job(payload: Payload) -> Dict[str, Any]:
    return {
        "matchScore": 68,
        "level": "Partial Match",
        "matchedSkills": ["React", "SQL"],
        "missingSkills": ["System Design", "AWS"],
        "inputEcho": payload.data,
    }


@app.post("/analyze-github")
def analyze_github(payload: Payload) -> Dict[str, Any]:
    return {
        "platform": "GitHub",
        "reposAnalyzed": 0,
        "documentationScore": 70,
        "message": "Placeholder response. OAuth and repo analysis arrive in Stage 2.",
        "inputEcho": payload.data,
    }


@app.post("/analyze-leetcode")
def analyze_leetcode(payload: Payload) -> Dict[str, Any]:
    return {
        "platform": "LeetCode",
        "totalSolved": 120,
        "difficultyMix": {"easy": 60, "medium": 50, "hard": 10},
        "message": "Mock coding profile snapshot for Stage 1.",
        "inputEcho": payload.data,
    }


@app.post("/analyze-hackerrank")
def analyze_hackerrank(payload: Payload) -> Dict[str, Any]:
    return {
        "platform": "HackerRank",
        "badges": ["Problem Solving", "Java"],
        "message": "Mock HackerRank analysis placeholder.",
        "inputEcho": payload.data,
    }
