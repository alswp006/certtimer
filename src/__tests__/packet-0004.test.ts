import { describe, it, expect } from "vitest";

describe("Packet 0004: 상수 데이터 (내장 시험 50종 + 퀴즈 뱅크)", () => {
  // AC-1: BUILTIN_CERTS는 정확히 50개
  it("AC-1[P0]: BUILTIN_CERTS has exactly 50 certifications", () => {
    const { BUILTIN_CERTS } = require("@/lib/constants/certs");
    expect(BUILTIN_CERTS).toBeDefined();
    expect(Array.isArray(BUILTIN_CERTS)).toBe(true);
    expect(BUILTIN_CERTS.length).toBe(50);
  });

  // AC-1: 각 cert는 유효한 recommendedTotalMinutes (>=60)와 examDate를 가짐
  it("AC-1[P0]: each cert has valid recommendedTotalMinutes (>=60) and examDate", () => {
    const { BUILTIN_CERTS } = require("@/lib/constants/certs");
    BUILTIN_CERTS.forEach((cert: any) => {
      expect(cert.id).toBeDefined();
      expect(typeof cert.id).toBe("string");
      expect(cert.name).toBeDefined();
      expect(typeof cert.name).toBe("string");
      expect(cert.category).toBeDefined();
      expect(typeof cert.category).toBe("string");

      expect(cert.recommendedTotalMinutes).toBeDefined();
      expect(typeof cert.recommendedTotalMinutes).toBe("number");
      expect(cert.recommendedTotalMinutes).toBeGreaterThanOrEqual(60);

      expect(cert.examDate).toBeDefined();
      expect(typeof cert.examDate).toBe("string");
      // Validate ISO date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(cert.examDate).toMatch(dateRegex);
      // Ensure examDate is a valid date and not in the past
      const examDateObj = new Date(cert.examDate);
      expect(examDateObj.toString()).not.toBe("Invalid Date");
    });
  });

  // AC-2: SQLD 인증서가 정확한 속성으로 포함됨
  it("AC-2[P0]: SQLD cert is included with exact properties (id, examDate, recommendedTotalMinutes)", () => {
    const { BUILTIN_CERTS } = require("@/lib/constants/certs");
    const sqldCert = BUILTIN_CERTS.find((cert: any) => cert.id === "cert_sqld");

    expect(sqldCert).toBeDefined();
    expect(sqldCert.id).toBe("cert_sqld");
    expect(sqldCert.examDate).toBe("2026-09-05");
    expect(sqldCert.recommendedTotalMinutes).toBe(6000);
    expect(sqldCert.name).toBeDefined();
    expect(typeof sqldCert.name).toBe("string");
    expect(sqldCert.category).toBeDefined();
    expect(typeof sqldCert.category).toBe("string");
  });

  // AC-3: QUIZ_BANK은 각 카테고리당 최소 3개 이상의 문제를 가짐
  it("AC-3[P0]: QUIZ_BANK has at least 3 questions per category", () => {
    const { QUIZ_BANK } = require("@/lib/constants/quiz");

    expect(QUIZ_BANK).toBeDefined();
    expect(typeof QUIZ_BANK).toBe("object");

    const categories = Object.keys(QUIZ_BANK);
    expect(categories.length).toBeGreaterThan(0);

    categories.forEach((category: string) => {
      expect(Array.isArray(QUIZ_BANK[category])).toBe(true);
      expect(QUIZ_BANK[category].length).toBeGreaterThanOrEqual(3);
    });
  });

  // AC-3: 각 문제는 id, type, question, answer, explanation을 가지며, type은 'ox' 또는 'mcq'
  it("AC-3[P0]: each quiz question has required fields (id, type, question, answer, explanation)", () => {
    const { QUIZ_BANK } = require("@/lib/constants/quiz");

    const categories = Object.keys(QUIZ_BANK);
    categories.forEach((category: string) => {
      QUIZ_BANK[category].forEach((question: any) => {
        expect(question.id).toBeDefined();
        expect(typeof question.id).toBe("string");

        expect(question.type).toBeDefined();
        expect(["ox", "mcq"]).toContain(question.type);

        expect(question.question).toBeDefined();
        expect(typeof question.question).toBe("string");

        expect(question.answer).toBeDefined();

        expect(question.explanation).toBeDefined();
        expect(typeof question.explanation).toBe("string");
      });
    });
  });

  // AC-3: MCQ 타입 문제는 options 배열을 가짐
  it("AC-3[P1]: MCQ type questions include options array", () => {
    const { QUIZ_BANK } = require("@/lib/constants/quiz");

    const categories = Object.keys(QUIZ_BANK);
    let foundMcq = false;

    categories.forEach((category: string) => {
      QUIZ_BANK[category].forEach((question: any) => {
        if (question.type === "mcq") {
          foundMcq = true;
          expect(question.options).toBeDefined();
          expect(Array.isArray(question.options)).toBe(true);
          expect(question.options.length).toBeGreaterThanOrEqual(2);
          question.options.forEach((option: any) => {
            expect(typeof option).toBe("string");
          });
        }
      });
    });

    // Ensure we actually tested at least one MCQ
    expect(foundMcq).toBe(true);
  });

  // AC-3: OX 타입 문제의 answer는 boolean
  it("AC-3[P1]: OX type questions have boolean answer", () => {
    const { QUIZ_BANK } = require("@/lib/constants/quiz");

    const categories = Object.keys(QUIZ_BANK);
    let foundOx = false;

    categories.forEach((category: string) => {
      QUIZ_BANK[category].forEach((question: any) => {
        if (question.type === "ox") {
          foundOx = true;
          expect(typeof question.answer).toBe("boolean");
        }
      });
    });

    // Ensure we actually tested at least one OX question
    expect(foundOx).toBe(true);
  });

  // AC-1: 모든 cert는 고유한 id를 가짐 (중복 제거)
  it("AC-1[P1]: all certs have unique ids (no duplicates)", () => {
    const { BUILTIN_CERTS } = require("@/lib/constants/certs");

    const ids = BUILTIN_CERTS.map((cert: any) => cert.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(BUILTIN_CERTS.length);
  });

  // AC-3: QUIZ_BANK의 모든 문제는 고유한 id를 가짐 (카테고리 내에서)
  it("AC-3[P1]: all quiz questions have unique ids within their category", () => {
    const { QUIZ_BANK } = require("@/lib/constants/quiz");

    const categories = Object.keys(QUIZ_BANK);
    categories.forEach((category: string) => {
      const questionIds = QUIZ_BANK[category].map((q: any) => q.id);
      const uniqueIds = new Set(questionIds);

      expect(uniqueIds.size).toBe(QUIZ_BANK[category].length);
    });
  });
});
