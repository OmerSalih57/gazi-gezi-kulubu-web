import { SignJWT, jwtVerify } from "jose";
import { signingKey } from "@/lib/ticket-token";

export type QuizSession = {
  userId: string;
  questionIds: string[];
  issuedAt: number;
};

export async function signQuizSession(userId: string, questionIds: string[]) {
  return new SignJWT({ typ: "quiz", qids: questionIds })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(signingKey());
}

export async function verifyQuizSession(token: string): Promise<QuizSession | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey());
    const questionIds = Array.isArray(payload.qids)
      ? payload.qids.filter((item): item is string => typeof item === "string")
      : [];
    if (payload.typ !== "quiz" || typeof payload.sub !== "string" || questionIds.length !== 12) return null;
    const issuedAt = typeof payload.iat === "number" ? payload.iat : 0;
    if (!issuedAt) return null;
    return { userId: payload.sub, questionIds, issuedAt };
  } catch (error) {
    if (error instanceof Error && error.message.includes("TICKET_SECRET")) throw error;
    return null;
  }
}
