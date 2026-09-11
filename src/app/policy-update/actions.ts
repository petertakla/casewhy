"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { acknowledgePolicy, getStalePolicies } from "@/lib/policy/acknowledgments";

export async function acknowledgeStalePolicies() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const stale = await getStalePolicies(session.user.id, new Date(session.user.createdAt));
  for (const policy of stale) {
    await acknowledgePolicy(session.user.id, policy.type);
  }

  redirect("/dashboard");
}
