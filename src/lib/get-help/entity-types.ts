// Round 60 — single source of truth for every Get Help entity type,
// replacing get-help/page.tsx's own local LIVE_CATEGORIES/
// COMING_SOON_CATEGORIES arrays. Both the hub's static list and the new
// chooser (GetHelpChooser.tsx) read from this one module, so there's no
// duplicated category data to drift out of sync — the exact risk round
// 58's own task doc flagged about hardcoded entity-type lists.

export type EntityTypeId =
  | "attorneys"
  | "accredited_representatives"
  | "legal_aid"
  | "pro_bono_representation"
  | "dso"
  | "community_orgs"
  | "employers";

export interface EntityType {
  id: EntityTypeId;
  href: string | null; // null while coming-soon
  label: string;
  description: string;
  /** Short, concrete "use this when..." trigger sentence — not a restatement of description. Null while coming-soon. */
  whenToUse: string | null;
  status: "live" | "coming-soon";
}

export const ENTITY_TYPES: EntityType[] = [
  {
    id: "attorneys",
    href: "/attorneys",
    label: "Attorneys",
    description: "Licensed immigration attorneys who can represent you and give advice specific to your case.",
    whenToUse:
      "You want a licensed professional who can formally represent you, sign filings on your behalf, or appear in immigration court for you.",
    status: "live",
  },
  {
    id: "accredited_representatives",
    href: "/accredited-representatives",
    label: "Accredited representatives",
    description:
      "DOJ-accredited, non-lawyer representatives — often at nonprofits — authorized to practice immigration law.",
    whenToUse:
      "You want professional legal help but a private attorney's fees are out of reach, or you'd rather work with a nonprofit.",
    status: "live",
  },
  {
    id: "legal_aid",
    href: "/legal-aid",
    label: "Legal aid & nonprofit organizations",
    description: "Immigration help for those who can't afford a private attorney.",
    whenToUse: "You need general guidance or a consultation and have limited income.",
    status: "live",
  },
  {
    id: "pro_bono_representation",
    href: "/pro-bono-representation",
    label: "Pro bono immigration-court representation",
    description: "Free representation in immigration court proceedings, organized by court.",
    whenToUse: "You're in immigration court / removal proceedings right now and need representation there, at no cost.",
    status: "live",
  },
  {
    id: "dso",
    href: "/dso",
    label: "University international student offices",
    description: "Find your school's international student office, for F-1/M-1 status questions.",
    whenToUse: "You're an F-1/M-1 international student with a status or SEVIS question tied to your school.",
    status: "live",
  },
  {
    id: "community_orgs",
    href: "/community-orgs",
    label: "Community & cultural organizations",
    description: "Local and cultural organizations that support immigrants.",
    whenToUse: "You want local, culturally or linguistically matched support — not necessarily legal help.",
    status: "live",
  },
  {
    id: "employers",
    href: null,
    label: "For employers",
    description: "Sponsoring or supporting employees through the immigration process.",
    whenToUse: null,
    status: "coming-soon",
  },
];

export function getLiveEntityTypes(): EntityType[] {
  return ENTITY_TYPES.filter((e) => e.status === "live");
}

export function getEntityType(id: EntityTypeId): EntityType | undefined {
  return ENTITY_TYPES.find((e) => e.id === id);
}
