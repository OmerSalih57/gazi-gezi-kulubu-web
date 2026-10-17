import { SignJWT, jwtVerify } from "jose";

export type TicketPayload = {
  reg: string;
  evt: string;
  nonce: string;
};

export function signingKey() {
  const value = process.env.TICKET_SECRET?.trim() ?? "";
  if (process.env.NODE_ENV === "production" && value.length < 32) {
    throw new Error("TICKET_SECRET üretim ortamında tanımlı değil.");
  }
  if (value.length < 32) {
    throw new Error("TICKET_SECRET tanımlı değil veya 32 karakterden kısa.");
  }
  return new TextEncoder().encode(value);
}

export async function signTicket(p: TicketPayload): Promise<string> {
  return new SignJWT({ ...p, typ: "ticket" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(signingKey());
}

export async function verifyTicket(token: string): Promise<TicketPayload | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey());
    if (payload.typ && payload.typ !== "ticket") return null;
    if (typeof payload.reg !== "string" || typeof payload.evt !== "string" || typeof payload.nonce !== "string") {
      return null;
    }
    return { reg: payload.reg, evt: payload.evt, nonce: payload.nonce };
  } catch (error) {
    if (error instanceof Error && error.message.includes("TICKET_SECRET")) throw error;
    return null;
  }
}
