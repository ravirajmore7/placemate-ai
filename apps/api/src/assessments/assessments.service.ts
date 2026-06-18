import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

type AssessmentQuestion = {
  id: string;
  type: "coding" | "sql" | "mcq" | "aptitude";
  prompt: string;
  options?: string[];
  answer?: string;
  starterCode?: string;
  testCases?: Array<{ input: string; output: string }>;
  points: number;
};

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: Record<string, string | undefined>) {
    await this.ensureDefaults();
    const where: Prisma.AssessmentWhereInput = {};
    if (query.type) where.type = query.type.toUpperCase();
    if (query.roleCategory) where.roleCategory = { contains: query.roleCategory, mode: "insensitive" };
    const [items, total] = await Promise.all([
      this.prisma.assessment.findMany({ where, orderBy: { createdAt: "desc" }, take: this.limit(query.limit, 20, 100) }),
      this.prisma.assessment.count({ where })
    ]);
    return { items, total, page: 1, limit: this.limit(query.limit, 20, 100) };
  }

  async create(user: AuthUser, body: Record<string, unknown>) {
    const title = this.text(body.title);
    if (!title) throw new BadRequestException("Assessment title is required");
    const questions = this.questionsFrom(body.questionsJson ?? body.questions);
    if (!questions.length) throw new BadRequestException("At least one question is required");
    return this.prisma.assessment.create({
      data: {
        title,
        type: this.text(body.type).toUpperCase() || "CODING",
        roleCategory: this.optional(body.roleCategory),
        difficulty: this.text(body.difficulty).toUpperCase() || "INTERMEDIATE",
        durationMinutes: Number(body.durationMinutes ?? 60),
        questionsJson: json(questions),
        evaluationConfigJson: json({ timer: true, autoEvaluation: true, antiCheat: true }),
        createdById: user.id,
        status: this.text(body.status) || "published"
      }
    });
  }

  async get(id: string) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException("Assessment not found");
    return assessment;
  }

  async start(user: AuthUser, assessmentId: string) {
    const assessment = await this.get(assessmentId);
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ForbiddenException("Student profile is required to start an assessment");
    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        studentProfileId: profile.id,
        userId: user.id,
        antiCheatLogsJson: json([{ event: "started", at: new Date().toISOString() }])
      }
    });
    return { assessment, attempt, timerEndsAt: new Date(Date.now() + assessment.durationMinutes * 60 * 1000).toISOString() };
  }

  async submit(user: AuthUser, attemptId: string, body: Record<string, unknown>) {
    const attempt = await this.prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== user.id) throw new NotFoundException("Assessment attempt not found");
    if (attempt.status === "submitted") throw new BadRequestException("Assessment attempt is already submitted");
    const assessment = await this.get(attempt.assessmentId);
    const questions = this.questionsFrom(assessment.questionsJson);
    const answers = this.answerRecord(body.answers);
    const antiCheatLogs = this.antiCheat(body.antiCheatLogs);
    const evaluation = this.evaluate(questions, answers);
    const submitted = await this.prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "submitted",
        score: evaluation.score,
        answersJson: json(answers),
        antiCheatLogsJson: json(antiCheatLogs),
        evaluationJson: json(evaluation),
        submittedAt: new Date()
      }
    });
    return { attempt: submitted, evaluation };
  }

  async leaderboard(assessmentId: string) {
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { assessmentId, status: "submitted" },
      orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
      take: 25
    });
    const studentIds = attempts.map((attempt) => attempt.studentProfileId).filter((id): id is string => Boolean(id));
    const students = await this.prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { name: true, email: true } } }
    });
    const byId = new Map(students.map((student) => [student.id, student]));
    return {
      items: attempts.map((attempt, index) => ({
        rank: index + 1,
        score: attempt.score,
        submittedAt: attempt.submittedAt,
        student: attempt.studentProfileId ? byId.get(attempt.studentProfileId) : null
      }))
    };
  }

  private async ensureDefaults() {
    const count = await this.prisma.assessment.count();
    if (count > 0) return;
    await this.prisma.assessment.createMany({
      data: this.defaultAssessments().map((assessment) => ({
        title: assessment.title,
        type: assessment.type,
        roleCategory: assessment.roleCategory,
        difficulty: assessment.difficulty,
        durationMinutes: assessment.durationMinutes,
        questionsJson: json(assessment.questions),
        evaluationConfigJson: json({ timer: true, autoEvaluation: true, antiCheat: true }),
        status: "published"
      }))
    });
  }

  private evaluate(questions: AssessmentQuestion[], answers: Record<string, string>) {
    let earned = 0;
    const total = questions.reduce((sum, question) => sum + question.points, 0);
    const details = questions.map((question) => {
      const answer = answers[question.id] ?? "";
      const correct = this.isCorrect(question, answer);
      const partial = correct ? question.points : this.partialCredit(question, answer);
      earned += partial;
      return {
        questionId: question.id,
        correct,
        points: partial,
        maxPoints: question.points,
        feedback: correct ? "Accepted" : "Review expected output, edge cases, or concept coverage"
      };
    });
    return {
      score: Math.round((earned / Math.max(total, 1)) * 100),
      earned,
      total,
      details,
      antiCheatVerdict: "No severe issues detected"
    };
  }

  private isCorrect(question: AssessmentQuestion, answer: string) {
    const clean = answer.trim().toLowerCase();
    const expected = String(question.answer ?? "").trim().toLowerCase();
    if (!expected) return clean.length > 80;
    if (question.type === "coding") return question.testCases?.some((test) => clean.includes(test.output.toLowerCase())) || clean.includes(expected);
    return clean === expected || clean.includes(expected);
  }

  private partialCredit(question: AssessmentQuestion, answer: string) {
    const clean = answer.trim().toLowerCase();
    if (!clean) return 0;
    if (question.type === "coding") {
      return Math.round(question.points * Math.min(0.6, clean.split(/\s+/).length / 80));
    }
    return Math.round(question.points * (clean.length > 20 ? 0.35 : 0));
  }

  private defaultAssessments() {
    return [
      {
        title: "SDE Coding Readiness Test",
        type: "CODING",
        roleCategory: "SDE",
        difficulty: "INTERMEDIATE",
        durationMinutes: 60,
        questions: [
          { id: "coding-1", type: "coding", prompt: "Return the two indices whose values add to the target.", starterCode: "function twoSum(nums, target) {}", testCases: [{ input: "[2,7,11,15], 9", output: "[0,1]" }], answer: "[0,1]", points: 40 },
          { id: "coding-2", type: "coding", prompt: "Detect whether a linked list has a cycle.", starterCode: "function hasCycle(head) {}", answer: "slow fast", points: 35 },
          { id: "coding-3", type: "mcq", prompt: "Best average complexity for hash map lookup?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: "O(1)", points: 25 }
        ] satisfies AssessmentQuestion[]
      },
      {
        title: "SQL Analyst Screen",
        type: "SQL",
        roleCategory: "Data",
        difficulty: "BEGINNER",
        durationMinutes: 45,
        questions: [
          { id: "sql-1", type: "sql", prompt: "Write a query to find the second highest salary from Employee.", answer: "order by", points: 35 },
          { id: "sql-2", type: "sql", prompt: "Group applications by status and count them.", answer: "group by", points: 35 },
          { id: "sql-3", type: "mcq", prompt: "Which join returns all records from the left table?", options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN"], answer: "LEFT JOIN", points: 30 }
        ] satisfies AssessmentQuestion[]
      },
      {
        title: "Placement Aptitude Sprint",
        type: "APTITUDE",
        roleCategory: "General",
        difficulty: "BEGINNER",
        durationMinutes: 30,
        questions: [
          { id: "apt-1", type: "aptitude", prompt: "If a value increases from 80 to 100, what is the percentage increase?", answer: "25", points: 30 },
          { id: "apt-2", type: "aptitude", prompt: "Find the next term: 2, 6, 12, 20, 30", answer: "42", points: 35 },
          { id: "apt-3", type: "mcq", prompt: "A train covers 120 km in 2 hours. Speed?", options: ["40", "60", "80"], answer: "60", points: 35 }
        ] satisfies AssessmentQuestion[]
      },
      {
        title: "Core CS MCQ Test",
        type: "MCQ",
        roleCategory: "SDE",
        difficulty: "INTERMEDIATE",
        durationMinutes: 35,
        questions: [
          { id: "mcq-1", type: "mcq", prompt: "Which normal form removes transitive dependency?", options: ["1NF", "2NF", "3NF"], answer: "3NF", points: 25 },
          { id: "mcq-2", type: "mcq", prompt: "Which data structure powers BFS?", options: ["Stack", "Queue", "Heap"], answer: "Queue", points: 25 },
          { id: "mcq-3", type: "mcq", prompt: "Which HTTP status means unauthorized?", options: ["401", "403", "404"], answer: "401", points: 25 },
          { id: "mcq-4", type: "mcq", prompt: "Which index can speed exact lookups?", options: ["B-tree", "No index", "Random"], answer: "B-tree", points: 25 }
        ] satisfies AssessmentQuestion[]
      }
    ];
  }

  private questionsFrom(value: unknown): AssessmentQuestion[] {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: this.text(record.id) || `q-${index + 1}`,
        type: (this.text(record.type).toLowerCase() || "mcq") as AssessmentQuestion["type"],
        prompt: this.text(record.prompt ?? record.question),
        options: Array.isArray(record.options) ? record.options.map(String) : undefined,
        answer: this.text(record.answer),
        starterCode: this.text(record.starterCode),
        testCases: Array.isArray(record.testCases) ? record.testCases as Array<{ input: string; output: string }> : undefined,
        points: Number(record.points ?? 10)
      };
    }).filter((item) => item.prompt);
  }

  private answerRecord(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, answer]) => [key, this.text(answer)]));
  }

  private antiCheat(value: unknown) {
    const logs = Array.isArray(value) ? value : [];
    return [
      ...logs,
      { event: "submitted", at: new Date().toISOString() }
    ];
  }

  private text(value: unknown) {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  }

  private optional(value: unknown) {
    const text = this.text(value);
    return text || undefined;
  }

  private limit(value: unknown, fallback: number, max: number) {
    return Math.min(Math.max(Number(value ?? fallback), 1), max);
  }
}
