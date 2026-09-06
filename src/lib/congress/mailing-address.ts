// CW-39 — one mailing address (plus sender name, needed to sign a real
// letter) per account, encrypted as a single JSON blob. See
// src/lib/db/schema.ts's mailing_addresses table for the storage rationale.

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mailingAddresses } from "@/lib/db/schema";
import { encryptField, decryptField } from "@/lib/db/crypto";

export interface MailingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export async function getMailingAddress(userId: string): Promise<MailingAddress | null> {
  const db = getDb();
  const [row] = await db
    .select({ address: mailingAddresses.address })
    .from(mailingAddresses)
    .where(eq(mailingAddresses.userId, userId));
  if (!row) return null;
  try {
    return JSON.parse(decryptField(row.address)) as MailingAddress;
  } catch {
    return null; // malformed/undecryptable row — treat as not set rather than crash
  }
}

export async function saveMailingAddress(userId: string, address: MailingAddress): Promise<void> {
  const db = getDb();
  const encrypted = encryptField(JSON.stringify(address));
  await db
    .insert(mailingAddresses)
    .values({ userId, address: encrypted })
    .onConflictDoUpdate({
      target: mailingAddresses.userId,
      set: { address: encrypted, updatedAt: new Date() },
    });
}
