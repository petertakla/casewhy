// CW-31 v1 — curated policy/case-law knowledge base.
//
// A deliberately small, hand-picked set of major, well-documented USCIS
// policy changes that plausibly explain *why* a case is delayed or affected
// in a way the raw status text never says outright. Each entry is sourced
// from USCIS's own site or, where the primary document isn't machine-
// readable (a scanned/compressed PDF), from multiple independent legal-news
// sources describing the same primary document — see `sourceUrl` on each.
//
// Scope deliberately kept to the handful of entries most relevant to the
// three case types CaseWhy supports (N-400, family-based green cards,
// employment-based cases) and — per the MVP scope doc's own framing, and
// Peter's own case — the policy his family's naturalization was actually
// affected by. This is not meant to be comprehensive; growing it is future
// editorial work, not an engineering task.
//
// IMPORTANT, and why matching here is deliberately conservative: nothing in
// USCIS's Case Status API response reveals *why* a case is delayed (that's
// the whole reason CaseWhy exists), and the API never returns the
// applicant's country of birth/nationality — so this KB can never *confirm*
// a specific policy applies to a specific case, only surface it as
// plausible background. `explainCaseStatus()` is responsible for framing
// any matched entry this way, never as a diagnosis — see the system
// instructions there.

export interface PolicyMemo {
  id: string;
  title: string;
  memoNumber?: string;
  /**
   * Round 126 follow-up — Peter caught this live on /policy: 8 of the 11
   * entries are evergreen "how this form generally works" reference
   * explainers, not tied to any single dated announcement, but every entry
   * shared the same required datePublished field -- all 8 were stamped
   * with a placeholder "2026-01-01" as if USCIS had issued them all on one
   * day. The page displayed and sorted by that literally, so it read as
   * "several memos from Jan 2026, then a cliff down to one from 2021" --
   * a display artifact, not a real historical gap. "memo" = a genuine
   * dated policy announcement (datePublished is real and meaningful,
   * shown and sorted chronologically). "reference" = an evergreen
   * explainer (datePublished is a filler value, never shown to a reader --
   * see /policy/page.tsx, which renders a "Reference" label instead).
   */
  kind: "memo" | "reference";
  datePublished: string; // ISO date the policy was issued/announced — meaningful only when kind is "memo"
  /**
   * Case-status text/description/history substrings (lowercase) that make
   * this entry plausibly relevant. An empty array means "always relevant
   * whenever formTypes matches" (round 21 — used for form-specific reference
   * entries like I-131's, which apply regardless of status wording).
   */
  statusKeywords: string[];
  /** Form types this applies to, or "*" for broadly applicable. */
  formTypes: string[] | "*";
  /** Only surface this entry for cases filed/submitted on or after this date (for date-gated rule changes). */
  effectiveFrom?: string;
  summary: string;
  currentStatus: string;
  sourceTitle: string;
  sourceUrl: string;
  // Round 105 — Spanish content for the public /policy pages, AI-drafted
  // in formal usted register from the English fields above and each
  // entry's own cited USCIS source, sent to the round 81 manifest for
  // native-speaker review, same discipline as every other translated
  // string in this project. Every caveat/hedge phrase in the English
  // summary/currentStatus (e.g. i131's abandonment warning, i589/i821d's
  // "never predict/imply" instructions) is preserved in the Spanish, not
  // softened or summarized away — this is the same public-facing content,
  // not a paraphrase. Optional so a future memo added without Spanish yet
  // still renders (English body under Spanish chrome, "(en inglés)"
  // tagged) rather than breaking the page.
  titleEs?: string;
  summaryEs?: string;
  currentStatusEs?: string;
}

export const POLICY_MEMOS: PolicyMemo[] = [
  {
    id: "pm-602-0194-high-risk-hold",
    kind: "memo",
    title: "Hold and Review of Benefit Applications from Additional High-Risk Countries",
    memoNumber: "PM-602-0194",
    datePublished: "2026-01-01",
    formTypes: "*",
    statusKeywords: [
      "additional review",
      "actively reviewed",
      "administrative processing",
      "extended review",
      "further review",
    ],
    summary:
      "Effective January 1, 2026, USCIS placed an automatic hold on final decisions for pending benefit applications — including naturalization, family-based and employment-based petitions, adjustment of status, and work permits — filed by nationals of about 39 countries designated 'high-risk' (tied to Presidential Proclamations 10949 and 10998). It also directed re-review of certain approvals granted on or after January 20, 2021 for nationals of those countries. USCIS gave no timeline for lifting individual holds, so an affected case could show no visible status change for an extended period with no explanation in the status text itself.",
    currentStatus:
      "Federal courts in Massachusetts and Rhode Island found the hold policies likely unlawful under the Administrative Procedure Act in spring 2026, and a Rhode Island court vacated them outright on June 5, 2026; a Texas court issued a related class-wide order on August 24, 2026 directing USCIS to resume normal processing for affected applicants. Relief has generally applied to certified classes/plaintiffs rather than automatically to every case nationwide, so whether a specific case has actually resumed normal processing isn't something this app can confirm from the status API alone.",
    sourceTitle: "USCIS Policy Alert PM-602-0194 (Jan 1, 2026)",
    sourceUrl:
      "https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0194-PendingApplicationsAdditionalHighRiskCountries-20260101.pdf",
    titleEs: "Retención y revisión de solicitudes de beneficios de países adicionales de alto riesgo",
    summaryEs:
      "A partir del 1 de enero de 2026, USCIS impuso una retención automática sobre las decisiones finales de solicitudes de beneficios pendientes — incluidas naturalización, peticiones familiares y de empleo, ajuste de estatus y permisos de trabajo — presentadas por nacionales de aproximadamente 39 países designados de \"alto riesgo\" (vinculados a las Proclamaciones Presidenciales 10949 y 10998). También ordenó la re-revisión de ciertas aprobaciones otorgadas a partir del 20 de enero de 2021 a nacionales de esos países. USCIS no dio un plazo para levantar las retenciones individuales, por lo que un caso afectado podría no mostrar ningún cambio visible de estado durante un período prolongado, sin ninguna explicación en el texto del estado mismo.",
    currentStatusEs:
      "Tribunales federales en Massachusetts y Rhode Island determinaron en la primavera de 2026 que las políticas de retención probablemente eran ilegales bajo la Ley de Procedimiento Administrativo, y un tribunal de Rhode Island las anuló por completo el 5 de junio de 2026; un tribunal de Texas emitió una orden colectiva relacionada el 24 de agosto de 2026, ordenando a USCIS reanudar el procesamiento normal para los solicitantes afectados. El alivio generalmente se ha aplicado a clases certificadas o demandantes específicos, no automáticamente a todos los casos a nivel nacional, por lo que esta aplicación no puede confirmar, solo a partir de la API de estado, si un caso en particular efectivamente ha reanudado su procesamiento normal.",
  },
  {
    id: "public-charge-2026",
    kind: "memo",
    title: "2026 Public Charge Inadmissibility Guidance",
    datePublished: "2026-07-16",
    effectiveFrom: "2026-09-18",
    formTypes: ["I-485"],
    statusKeywords: ["public charge", "affidavit of support", "form i-864"],
    summary:
      "DHS finalized a rule (published July 20, 2026, effective September 18, 2026) rescinding the 2022 public-charge regulations. Under the new guidance, USCIS officers may weigh receipt of essentially any means-tested public benefit (not just cash assistance or long-term institutionalization, as under the prior rule) when deciding whether an adjustment-of-status applicant is likely to become a public charge, alongside the five statutory factors (age, health, family status, assets/resources/financial status, education/skills) and the Form I-864 affidavit of support. The new guidance also introduces public-charge bonds — a financial guarantee an applicant can post to overcome an otherwise-inadmissible finding.",
    currentStatus:
      "In effect as of September 18, 2026. Applications postmarked or e-filed before that date are still adjudicated under the prior, narrower framework.",
    sourceTitle: "USCIS: Guidance on Making a Public Charge Inadmissibility Determination",
    sourceUrl:
      "https://www.uscis.gov/newsroom/alerts/uscis-issues-guidance-on-making-public-charge-inadmissibility-determination",
    titleEs: "Orientación de 2026 sobre la inadmisibilidad por motivo de carga pública",
    summaryEs:
      "DHS finalizó una regla (publicada el 20 de julio de 2026, vigente desde el 18 de septiembre de 2026) que deroga las regulaciones de carga pública de 2022. Bajo la nueva orientación, los oficiales de USCIS pueden considerar la recepción de prácticamente cualquier beneficio público sujeto a evaluación de recursos económicos (no solo asistencia en efectivo o internamiento institucional a largo plazo, como bajo la regla anterior) al decidir si un solicitante de ajuste de estatus probablemente se convertirá en una carga pública, junto con los cinco factores legales (edad, salud, estado familiar, activos/recursos/situación financiera, educación/habilidades) y la declaración jurada de patrocinio del Formulario I-864. La nueva orientación también introduce las fianzas de carga pública — una garantía financiera que un solicitante puede depositar para superar una determinación de inadmisibilidad que de otro modo aplicaría.",
    currentStatusEs:
      "Vigente desde el 18 de septiembre de 2026. Las solicitudes con matasellos postales o presentadas electrónicamente antes de esa fecha todavía se evalúan bajo el marco anterior, más limitado.",
  },
  {
    id: "rfe-noid-adjudicative-principles",
    kind: "memo",
    title: "When USCIS Issues a Request for Evidence vs. Denies Outright",
    datePublished: "2021-06-09",
    formTypes: "*",
    statusKeywords: [
      "request for evidence",
      "notice of intent to deny",
      "rfe",
      "noid",
    ],
    summary:
      "A 2018 policy (PM-602-0050.1) gave officers discretion to deny an application outright, without first issuing a Request for Evidence (RFE) or Notice of Intent to Deny (NOID), whenever required initial evidence was missing — a real, if temporary, tightening of when applicants got a chance to respond before a denial. That policy was rescinded January 20, 2021, and on June 9, 2021 USCIS reverted to the longer-standing adjudicative principle (dating to June 2013): officers should issue an RFE or NOID, giving the applicant a chance to submit more evidence, whenever additional evidence could plausibly establish eligibility, rather than denying outright.",
    currentStatus:
      "This is the current operative standard — USCIS issuing an RFE or NOID generally means the officer believes the case could still be approved with more evidence, not that the case is in jeopardy.",
    sourceTitle: "USCIS Notice to Appear Policy Memorandum history (archived)",
    sourceUrl: "https://www.uscis.gov/archive/notice-to-appear-policy-memorandum",
    titleEs: "Cuándo USCIS emite una Solicitud de Evidencia en lugar de denegar directamente",
    summaryEs:
      "Una política de 2018 (PM-602-0050.1) le dio a los oficiales la discreción de denegar una solicitud directamente, sin emitir primero una Solicitud de Evidencia (RFE) o un Aviso de Intención de Denegar (NOID), cuando faltaba evidencia inicial requerida — un endurecimiento real, aunque temporal, de cuándo los solicitantes tenían la oportunidad de responder antes de una denegación. Esa política fue derogada el 20 de enero de 2021, y el 9 de junio de 2021 USCIS volvió al principio adjudicativo de más larga data (que se remonta a junio de 2013): los oficiales deben emitir una RFE o un NOID, dándole al solicitante la oportunidad de presentar más evidencia, siempre que evidencia adicional pudiera razonablemente establecer la elegibilidad, en lugar de denegar directamente.",
    currentStatusEs:
      "Este es el estándar vigente actualmente — que USCIS emita una RFE o un NOID generalmente significa que el oficial considera que el caso todavía podría aprobarse con más evidencia, no que el caso esté en riesgo.",
  },
  // Round 21 — form-specific reference entries for the 4 newly-supported
  // case types. Each always applies to its own formType (statusKeywords: []
  // — see textMatches()) rather than being conditional on status wording,
  // since these are background facts about the form itself, not about a
  // particular status update.
  {
    id: "i90-green-card-renewal",
    kind: "reference",
    title: "I-90 Green Card Renewal/Replacement — What Changes and What Doesn't",
    datePublished: "2026-01-01",
    formTypes: ["I-90"],
    statusKeywords: [],
    summary:
      "An I-90 renews an expiring/expired card, replaces a lost/stolen/damaged one, or updates a card after a name or other change. USCIS recommends filing up to 6 months before expiration. As of this writing, USCIS extends an expired card's validity by 36 months (up from a prior 24-month extension) for I-9/employment-verification purposes when the expired card is presented together with the I-90 filing receipt notice.",
    currentStatus:
      "An I-90 is a renewal, not a re-adjudication of permanent-resident eligibility — status doesn't change while pending, assuming the person remains an LPR in good standing. It is not the right form for someone with an actual abandonment-of-residence concern (e.g., extended time outside the U.S.) — that's a different, more serious question than a routine renewal, and should go to an attorney.",
    sourceTitle: "USCIS: Extension of Green Card Validity to 36 Months for Renewals",
    sourceUrl:
      "https://www.uscis.gov/newsroom/alerts/uscis-extends-green-card-validity-extension-to-36-months-for-green-card-renewals",
    titleEs: "Renovación o reemplazo de la tarjeta verde (I-90) — qué cambia y qué no",
    summaryEs:
      "El Formulario I-90 renueva una tarjeta próxima a vencer o ya vencida, reemplaza una tarjeta perdida, robada o dañada, o actualiza una tarjeta tras un cambio de nombre u otro dato. USCIS recomienda presentar la solicitud hasta 6 meses antes del vencimiento. Al momento de escribir esto, USCIS extiende la validez de una tarjeta vencida por 36 meses (antes eran 24 meses) para fines de verificación de empleo (I-9) cuando la tarjeta vencida se presenta junto con el aviso de recibo de la solicitud I-90.",
    currentStatusEs:
      "El I-90 es una renovación, no una nueva adjudicación de la elegibilidad como residente permanente — el estatus no cambia mientras está pendiente, siempre que la persona siga siendo residente permanente legal en regla. No es el formulario correcto para alguien con una preocupación real de abandono de residencia (por ejemplo, tiempo prolongado fuera de Estados Unidos) — esa es una pregunta distinta y más seria que una renovación de rutina, y debe consultarse con un abogado.",
  },
  {
    id: "i131-travel-document-abandonment",
    kind: "reference",
    title: "I-131 Travel Documents — the Advance Parole Abandonment Risk",
    datePublished: "2026-01-01",
    formTypes: ["I-131"],
    statusKeywords: [],
    summary:
      "I-131 covers three distinct purposes: Advance Parole (for pending I-485 applicants or certain other categories needing permission to travel and return), a Re-entry Permit (for LPRs planning a trip of a year or more), and a Refugee Travel Document (for refugees/asylees) — these should never be conflated with each other.",
    currentStatus:
      "The single highest-stakes fact, from USCIS's own I-131 page: filing to request an advance parole document and departing the U.S. without that document valid for the entire trip means USCIS considers the I-131 abandoned — and for a pending I-485 applicant specifically, an unauthorized departure risks the underlying adjustment application too, not just the travel document. Any explanation touching a pending advance-parole case must carry this caveat explicitly, never softened, and must never suggest travel is safe before an advance parole document is approved and physically in hand.",
    sourceTitle: "USCIS: I-131, Application for Travel Document",
    sourceUrl: "https://www.uscis.gov/i-131",
    titleEs: "Documentos de viaje I-131 — el riesgo de abandono del permiso adelantado (Advance Parole)",
    summaryEs:
      "El Formulario I-131 cubre tres propósitos distintos: el Permiso Adelantado o Advance Parole (para solicitantes con el Formulario I-485 pendiente u otras categorías que necesitan permiso para viajar y regresar), un Permiso de Reingreso (Re-entry Permit, para residentes permanentes legales que planean un viaje de un año o más), y un Documento de Viaje para Refugiados (Refugee Travel Document, para refugiados/asilados) — estos nunca deben confundirse entre sí.",
    currentStatusEs:
      "El dato de mayor riesgo, según la propia página de USCIS sobre el Formulario I-131: presentar una solicitud de documento de permiso adelantado (advance parole) y salir de Estados Unidos sin ese documento válido para todo el viaje significa que USCIS considera abandonada la solicitud I-131 — y para un solicitante con el I-485 pendiente específicamente, una salida no autorizada pone en riesgo también la solicitud de ajuste de estatus subyacente, no solo el documento de viaje. Cualquier explicación relacionada con un caso de permiso adelantado pendiente debe incluir esta advertencia explícitamente, sin suavizarla, y nunca debe sugerir que viajar es seguro antes de que el documento de permiso adelantado esté aprobado y físicamente en mano.",
  },
  {
    id: "n600-certificate-of-citizenship",
    kind: "reference",
    title: "N-600 Certificate of Citizenship — Acquisition vs. Derivation",
    datePublished: "2026-01-01",
    formTypes: ["N-600"],
    statusKeywords: [],
    summary:
      "N-600 covers two distinct pathways: acquisition (was a U.S. citizen automatically at birth abroad through a citizen parent — no age limit to request proof) and derivation (became a citizen automatically as a minor under the Child Citizenship Act of 2000, generally requiring the child to have been under 18, an LPR, and in the legal and physical custody of a U.S.-citizen parent at the time that parent naturalized).",
    currentStatus:
      "N-600 doesn't confer citizenship — someone who qualifies is already a citizen by operation of law; the form only requests the government's proof document. It is not the right form for an LPR intending to naturalize (that's N-400), someone born in the U.S. (a birth certificate suffices), or someone already naturalized as an adult (a Certificate of Naturalization, not N-600). Processing time varies widely by service center.",
    sourceTitle: "USCIS: N-600, Application for Certificate of Citizenship",
    sourceUrl: "https://www.uscis.gov/n-600",
    titleEs: "Certificado de Ciudadanía N-600 — adquisición frente a derivación",
    summaryEs:
      "El Formulario N-600 cubre dos vías distintas: adquisición (la persona fue ciudadana estadounidense automáticamente al nacer en el extranjero por tener un padre o madre ciudadano — sin límite de edad para solicitar la prueba) y derivación (la persona se volvió ciudadana automáticamente siendo menor de edad bajo la Ley de Ciudadanía Infantil de 2000, lo cual generalmente requiere que el menor tuviera menos de 18 años, fuera residente permanente legal, y estuviera bajo la custodia legal y física de un padre o madre ciudadano estadounidense en el momento en que ese padre o madre se naturalizó).",
    currentStatusEs:
      "El N-600 no otorga la ciudadanía — quien califica ya es ciudadano por efecto de la ley; el formulario solo solicita el documento oficial que lo demuestra. No es el formulario correcto para un residente permanente legal que desea naturalizarse (eso es el N-400), para alguien nacido en Estados Unidos (basta con el acta de nacimiento), ni para alguien ya naturalizado como adulto (eso requiere un Certificado de Naturalización, no un N-600). El tiempo de procesamiento varía ampliamente según el centro de servicio.",
  },
  {
    id: "i765-employment-authorization",
    kind: "reference",
    title: "I-765 Employment Authorization — the Eligibility Category Matters",
    datePublished: "2026-01-01",
    formTypes: ["I-765"],
    statusKeywords: [],
    summary:
      "The underlying eligibility category — a code like (c)(9) pending adjustment, (c)(8) pending asylum, (a)(5) granted asylee, (c)(33) DACA, (c)(3)(B)/(c)(3)(C) F-1 OPT/STEM, (a)(3)/(a)(4) paroled refugee/refugee, etc. — matters more than \"I-765\" as a label, since it reflects why someone can work, tied to a different underlying status/application per category. Status vocabulary (received, biometrics, approved, card produced) is generic across categories, but what an approval means, and how long the resulting EAD is valid, depends on the category.",
    currentStatus:
      "Never guess or assume a specific eligibility category from the form alone — if the underlying basis isn't known from the case's own facts, keep any explanation general rather than asserting a category that may be wrong.",
    sourceTitle: "USCIS: Employment Authorization Document",
    sourceUrl: "https://www.uscis.gov/employment-authorization",
    titleEs: "Autorización de empleo I-765 — la categoría de elegibilidad importa",
    summaryEs:
      "La categoría de elegibilidad subyacente — un código como (c)(9) ajuste pendiente, (c)(8) asilo pendiente, (a)(5) asilo otorgado, (c)(33) DACA, (c)(3)(B)/(c)(3)(C) OPT/STEM de F-1, (a)(3)/(a)(4) refugiado con permiso de ingreso/refugiado, etc. — importa más que la etiqueta genérica \"I-765\", ya que refleja por qué la persona puede trabajar, y está ligada a un estatus o solicitud subyacente distinto según la categoría. El vocabulario de estado (recibido, biometría, aprobado, tarjeta producida) es genérico entre categorías, pero lo que significa una aprobación, y cuánto tiempo es válido el permiso de trabajo (EAD) resultante, depende de la categoría.",
    currentStatusEs:
      "Nunca se debe suponer ni adivinar una categoría de elegibilidad específica solo a partir del formulario — si la base subyacente no se conoce a partir de los hechos propios del caso, cualquier explicación debe mantenerse general en lugar de afirmar una categoría que podría ser incorrecta.",
  },
  // Round 22 — I-129 (a genuinely new user population: nonimmigrant/temporary
  // workers, not the green-card/citizenship track) and I-751 (deferred from
  // round 21, the natural next step for the family-based population CaseWhy
  // already serves).
  {
    id: "i129-h1b-portability",
    kind: "reference",
    title: "I-129 Nonimmigrant Worker Petitions — H-1B Portability and Its Limits",
    datePublished: "2026-01-01",
    formTypes: ["I-129"],
    statusKeywords: [],
    summary:
      "I-129 covers many distinct nonimmigrant worker classifications — H-1B, L-1, O-1, TN, E-1/E-2, R-1, P-1, and others — which behave differently under the hood; never assume which classification a case is without it being independently confirmed. For H-1B specifically, AC21 portability means someone can generally start working for a new employer as soon as a new or transfer I-129 petition is properly filed and receipted, not upon approval — provided they're maintaining valid H-1B status (or within the 60-day post-employment grace period), the new employer has a certified Labor Condition Application and is paying prevailing wage, and there's no history of unauthorized work.",
    currentStatus:
      "If the new petition is later denied, work authorization under it ends immediately — this is a real, high-stakes fact that should never be softened or left implied when portability comes up.",
    sourceTitle: "H-1B Transfer and Portability Under AC21",
    sourceUrl: "https://www.lighthousehq.com/blog/h1b-transfer",
    titleEs: "Peticiones de trabajador no inmigrante I-129 — la portabilidad H-1B y sus límites",
    summaryEs:
      "El Formulario I-129 cubre muchas clasificaciones distintas de trabajador no inmigrante — H-1B, L-1, O-1, TN, E-1/E-2, R-1, P-1, entre otras — que funcionan de manera diferente por dentro; nunca se debe suponer cuál es la clasificación de un caso sin que esté confirmada de forma independiente. Para el H-1B específicamente, la portabilidad bajo la ley AC21 significa que, por lo general, una persona puede comenzar a trabajar para un nuevo empleador tan pronto como se presenta correctamente y se recibe una nueva petición I-129 (o de transferencia) — no al momento de la aprobación — siempre que la persona mantenga un estatus H-1B válido (o esté dentro del período de gracia de 60 días tras finalizar el empleo anterior), el nuevo empleador tenga una Solicitud de Condición Laboral (LCA) certificada y pague el salario prevaleciente, y no exista un historial de trabajo no autorizado.",
    currentStatusEs:
      "Si la nueva petición es denegada posteriormente, la autorización de empleo bajo esa petición termina de inmediato — este es un hecho real y de alto riesgo que nunca debe suavizarse ni darse por sobreentendido cuando surge el tema de la portabilidad.",
  },
  {
    id: "i751-removing-conditions-deadline",
    kind: "reference",
    title: "I-751 — the 90-Day Filing Window and What Happens If You Miss It",
    datePublished: "2026-01-01",
    formTypes: ["I-751"],
    statusKeywords: [],
    summary:
      "A joint I-751 petition must generally be filed within the 90 days immediately before the 2-year conditional permanent resident card's expiration date. Waiver categories exist for filing without the other spouse and without that 90-day window restriction: divorce, death of the spouse, abuse during the marriage, or extreme hardship.",
    currentStatus:
      "Missing the 90-day window is a real, serious consequence, not a soft deadline: conditional resident status automatically terminates, and USCIS can initiate removal (deportation) proceedings. Late filing is only possible with a written good-cause explanation, and approval isn't guaranteed — state this plainly, never softened, whenever a case is approaching that window. The fraud-suspicion/interview branch and the abuse-waiver branch both carry real emotional and legal stakes — keep any guidance procedural and general (how the waiver process generally works), never an assessment of a specific person's own eligibility or likelihood of success.",
    sourceTitle: "I-751, Petition to Remove Conditions on Residence",
    sourceUrl: "https://duevisa.com/blog/i751-removal-of-conditions",
    titleEs: "I-751 — el plazo de presentación de 90 días y qué sucede si se pierde",
    summaryEs:
      "Una petición conjunta I-751 generalmente debe presentarse dentro de los 90 días inmediatamente anteriores a la fecha de vencimiento de la tarjeta de residente permanente condicional de 2 años. Existen categorías de exención (waiver) para presentar la solicitud sin el otro cónyuge y sin la restricción de esa ventana de 90 días: divorcio, fallecimiento del cónyuge, abuso durante el matrimonio, o dificultad extrema (extreme hardship).",
    currentStatusEs:
      "Perder la ventana de 90 días tiene una consecuencia real y seria, no es un plazo flexible: el estatus de residente condicional termina automáticamente, y USCIS puede iniciar un proceso de expulsión (deportación). Presentar la solicitud tarde solo es posible con una explicación escrita de causa justificada, y la aprobación no está garantizada — esto debe indicarse con claridad, sin suavizarlo, siempre que un caso se acerque a esa ventana. Tanto la vía de sospecha de fraude/entrevista como la vía de exención por abuso conllevan un peso emocional y legal real — cualquier orientación debe mantenerse procedimental y general (cómo funciona generalmente el proceso de exención), nunca una evaluación de la elegibilidad o probabilidad de éxito de una persona en particular.",
  },
  // Round 23 — I-589 (asylum) and I-821D (DACA), the two highest-stakes
  // case types added so far. Built per Peter's explicit Sep 8 direction to
  // go all-in on both while erring strictly on the side of safety — see the
  // matching hard-rule guardrails in explain.ts/chat.ts, deliberately
  // stricter here than any other form type. Facts re-verified fresh at
  // build time (Sep 8, 2026) against the same sources cited below, not
  // carried over unverified from the prior day's research. This round is
  // not "done" until Peter has personally reviewed this content and the
  // real guardrail-test transcripts.
  {
    id: "i589-asylum-basics",
    kind: "reference",
    title: "I-589 Asylum — Filing Deadline, Affirmative vs. Defensive, and Work Authorization Timing",
    datePublished: "2026-01-01",
    formTypes: ["I-589"],
    statusKeywords: [],
    summary:
      "Must generally file within one year of arrival in the U.S., with exceptions for changed circumstances materially affecting eligibility, or extraordinary circumstances that caused the filing delay — real, case-specific exceptions, not a flat rule, and never something to assess without an attorney. Affirmative asylum (filed directly with a USCIS asylum office) and defensive asylum (raised as a defense in removal proceedings before an immigration judge, under EOIR — not USCIS at all) are on completely different processes and timelines. These must never be conflated.",
    currentStatus:
      "As of September 2026, the standing rule is roughly a 150-day wait after filing before applying for an initial Employment Authorization Document (some sources describe it as 180 days, depending on which point in the process is measured — present this as approximate, not exact). A DHS rule proposed February 23, 2026 would extend this wait to 365 days, add a biometrics requirement, add new eligibility bars, and let USCIS pause new EAD applications entirely once asylum processing exceeds 180 days — re-confirmed September 8, 2026 directly against the Federal Register's own record: this remains a proposed rule, not finalized (comment period closed April 24, 2026, has not cleared OMB review). Never state the 365-day figure as current. This population is also exactly who the EO 14161 social-media-vetting policy targets — keep guidance strictly procedural and factual, never speculative about an individual's outcome or risk.",
    sourceTitle: "USCIS — I-589, Application for Asylum and for Withholding of Removal",
    sourceUrl: "https://www.uscis.gov/i-589",
    titleEs: "Asilo I-589 — plazo de presentación, afirmativo frente a defensivo, y el momento de la autorización de empleo",
    summaryEs:
      "Por lo general, la solicitud debe presentarse dentro de un año desde la llegada a Estados Unidos, con excepciones por circunstancias cambiantes que afecten materialmente la elegibilidad, o circunstancias extraordinarias que hayan causado el retraso en la presentación — excepciones reales y específicas de cada caso, no una regla fija, y que nunca deben evaluarse sin un abogado. El asilo afirmativo (presentado directamente ante una oficina de asilo de USCIS) y el asilo defensivo (planteado como defensa en un proceso de expulsión ante un juez de inmigración, bajo EOIR — que no es USCIS en absoluto) siguen procesos y plazos completamente distintos. Estos nunca deben confundirse entre sí.",
    currentStatusEs:
      "Al mes de septiembre de 2026, la regla vigente es una espera de aproximadamente 150 días después de presentar la solicitud antes de poder solicitar un Documento de Autorización de Empleo (EAD) inicial (algunas fuentes lo describen como 180 días, según qué punto del proceso se mida — esto debe presentarse como aproximado, no exacto). Una regla propuesta por DHS el 23 de febrero de 2026 extendería esta espera a 365 días, añadiría un requisito de biometría, agregaría nuevas barreras de elegibilidad, y permitiría a USCIS pausar por completo las nuevas solicitudes de EAD una vez que el procesamiento de asilo supere los 180 días — reconfirmado el 8 de septiembre de 2026 directamente contra el registro del Federal Register: esto sigue siendo una regla propuesta, no finalizada (el período de comentarios cerró el 24 de abril de 2026 y no ha superado la revisión de la Oficina de Administración y Presupuesto, OMB). Nunca debe presentarse la cifra de 365 días como vigente. Esta población es también exactamente a quien apunta la política de verificación de redes sociales de la Orden Ejecutiva 14161 — la orientación debe mantenerse estrictamente procedimental y factual, nunca especulativa sobre el resultado o riesgo de una persona en particular.",
  },
  {
    id: "i821d-daca-current-status",
    kind: "reference",
    title: "I-821D DACA — Renewals Only, Litigation Status Genuinely Unresolved",
    datePublished: "2026-01-01",
    formTypes: ["I-821D"],
    statusKeywords: [],
    summary:
      "As of this writing (re-confirmed September 8, 2026), USCIS is processing renewals only for people who already have DACA — it is not accepting or processing any new initial applications. Someone without existing DACA genuinely cannot obtain it right now; never imply otherwise or suggest a path to a first-time application.",
    currentStatus:
      "DACA's legal status is actively contested. The Fifth Circuit ruled January 17, 2025 (Texas v. United States) that deferred action itself — protection from deportation — is constitutional and can apply nationwide, but that DACA's work-authorization component may be unlawful and severable from the rest of the program. The case was remanded to the district court (Judge Hanen) to issue a modified order; as of this writing no modified order has been issued — the work-authorization question is genuinely still open, not settled either way. The narrowed injunction from the ruling applies only to Texas. Roughly 120,000 DACA renewal applications were pending as of mid-2026, the highest number on record — real risk of a recipient's protection or work authorization lapsing between renewal cycles, through no fault of their own. Never predict how or when the litigation will resolve.",
    sourceTitle: "National Immigration Forum — Current Status of DACA: Explainer",
    sourceUrl: "https://forumtogether.org/article/current-status-of-daca-explainer/",
    titleEs: "DACA I-821D — solo renovaciones, estado del litigio genuinamente sin resolver",
    summaryEs:
      "Al momento de escribir esto (reconfirmado el 8 de septiembre de 2026), USCIS está procesando únicamente renovaciones para personas que ya cuentan con DACA — no está aceptando ni procesando ninguna solicitud inicial nueva. Alguien que no tenga DACA actualmente no puede obtenerlo en este momento — nunca debe insinuarse lo contrario ni sugerirse una vía para una solicitud por primera vez.",
    currentStatusEs:
      "El estatus legal de DACA está siendo activamente disputado. El Quinto Circuito dictaminó el 17 de enero de 2025 (Texas v. United States) que la acción diferida en sí misma — la protección contra la deportación — es constitucional y puede aplicarse a nivel nacional, pero que el componente de autorización de empleo de DACA podría ser ilegal y separable del resto del programa. El caso fue devuelto al tribunal de distrito (juez Hanen) para que emita una orden modificada; al momento de escribir esto, no se ha emitido ninguna orden modificada — la cuestión de la autorización de empleo sigue genuinamente sin resolverse, no está decidida en ningún sentido. La medida cautelar reducida de ese fallo se aplica únicamente a Texas. Aproximadamente 120,000 solicitudes de renovación de DACA estaban pendientes a mediados de 2026, la cifra más alta registrada — existe un riesgo real de que la protección o autorización de empleo de un beneficiario venza entre ciclos de renovación, sin que sea culpa suya. Nunca debe predecirse cómo o cuándo se resolverá el litigio.",
  },
  // Round 126 follow-up — Peter's own direct ask after the kind-field fix:
  // 11 entries reading as "one memo from 2021, then a jump to 2026" wasn't
  // just a display bug, it was genuinely thin real coverage. These 4 are
  // real, well-documented USCIS/DHS rules with verified dates and sources
  // (Federal Register / USCIS.gov, cross-checked via live search rather
  // than recalled from training data alone, since accuracy here is a real
  // legal-content stake, not a nice-to-have) — chosen specifically to fill
  // 2022-2025 with genuine history, not filler, and to connect directly to
  // form types and topics CaseWhy already covers.
  {
    id: "public-charge-2022-original-rule",
    kind: "memo",
    title: "The 2022 Public Charge Rule That 2026's Guidance Rescinded",
    datePublished: "2022-09-09",
    effectiveFrom: "2022-12-23",
    formTypes: ["I-485"],
    statusKeywords: ["public charge", "affidavit of support", "form i-864"],
    summary:
      "DHS published a final rule on September 9, 2022 (effective/applied to filings on or after December 23, 2022) restoring the historical, narrower understanding of 'public charge' that had been in place for decades before a 2019 rule change: an officer could weigh only cash assistance for income maintenance and long-term institutionalization at government expense, not supplemental benefits like Medicaid or SNAP, alongside the five statutory factors and the Form I-864 affidavit of support.",
    currentStatus:
      "This 2022 framework was itself rescinded by the 2026 public charge guidance above, which took a broader view of which benefits an officer may weigh. An I-485 case's own filing date determines which framework actually applied to it — the two entries together are the real history, not a single static rule.",
    sourceTitle: "USCIS: DHS's Public Charge Final Rule Goes into Effect on Dec. 23",
    sourceUrl: "https://www.uscis.gov/newsroom/alerts/dhss-public-charge-final-rule-goes-into-effect-on-dec-23",
    titleEs: "La regla de carga pública de 2022 que la orientación de 2026 derogó",
    summaryEs:
      "DHS publicó una regla final el 9 de septiembre de 2022 (vigente para solicitudes presentadas a partir del 23 de diciembre de 2022) que restauró la comprensión histórica y más limitada de 'carga pública' vigente durante décadas antes de un cambio de regla de 2019: un oficial solo podía considerar la asistencia en efectivo para mantenimiento de ingresos y la internación institucional de largo plazo a expensas del gobierno, no beneficios complementarios como Medicaid o SNAP, junto con los cinco factores legales y la declaración jurada de patrocinio del Formulario I-864.",
    currentStatusEs:
      "Este marco de 2022 fue a su vez derogado por la orientación de carga pública de 2026 mencionada arriba, que adoptó una visión más amplia de qué beneficios puede considerar un oficial. La fecha de presentación propia de un caso I-485 determina cuál marco realmente se le aplicó — las dos entradas juntas son la historia real, no una regla estática única.",
  },
  {
    id: "i140-premium-processing-expansion-2023",
    kind: "memo",
    title: "Premium Processing Expanded to All EB-1C and EB-2 NIW I-140 Petitions",
    datePublished: "2023-01-12",
    effectiveFrom: "2023-01-30",
    formTypes: ["I-140"],
    statusKeywords: ["premium processing"],
    summary:
      "USCIS announced on January 12, 2023 the final phase of a multi-year expansion of premium processing (a paid option for a guaranteed 45-day decision or refund) to Form I-140 immigrant worker petitions, effective January 30, 2023: EB-1C multinational executive/manager petitions and EB-2 National Interest Waiver petitions became eligible, including brand-new (not just previously-filed) petitions in both categories for the first time.",
    currentStatus:
      "Premium processing is an optional, separately-filed, paid upgrade (Form I-907) — it changes how fast USCIS must respond, not the substantive eligibility standard a petition is judged against. A petition without premium processing filed follows USCIS's regular, non-guaranteed processing time for its service center and category.",
    sourceTitle: "USCIS: Final Phase of Premium Processing Expansion for EB-1 and EB-2 Form I-140 Petitions",
    sourceUrl: "https://www.uscis.gov/newsroom/alerts/uscis-announces-final-phase-of-premium-processing-expansion-for-eb-1-and-eb-2-form-i-140-petitions",
    titleEs: "El procesamiento premium se amplía a todas las peticiones I-140 EB-1C y EB-2 NIW",
    summaryEs:
      "El 12 de enero de 2023, USCIS anunció la fase final de una expansión de varios años del procesamiento premium (una opción de pago que garantiza una decisión en 45 días o un reembolso) para las peticiones de trabajador inmigrante del Formulario I-140, vigente desde el 30 de enero de 2023: las peticiones EB-1C de ejecutivo/gerente multinacional y las peticiones EB-2 de exención por interés nacional (NIW) pasaron a ser elegibles, incluyendo por primera vez peticiones completamente nuevas (no solo las ya presentadas) en ambas categorías.",
    currentStatusEs:
      "El procesamiento premium es una mejora opcional, pagada y presentada por separado (Formulario I-907) — cambia la rapidez con la que USCIS debe responder, no el estándar sustantivo de elegibilidad con el que se evalúa una petición. Una petición sin procesamiento premium sigue el tiempo de procesamiento regular y no garantizado de USCIS para su centro de servicio y categoría.",
  },
  {
    id: "ead-automatic-extension-540-days",
    kind: "memo",
    title: "EAD Automatic Extension Increased to 540 Days, Then Made Permanent",
    datePublished: "2024-04-08",
    formTypes: ["I-765"],
    statusKeywords: ["automatic extension", "540 days", "ead extension"],
    summary:
      "A temporary final rule effective April 8, 2024 increased the automatic extension period for a timely-filed Employment Authorization Document (EAD) renewal from up to 180 days to up to 540 days, for renewal applications filed on or after October 27, 2023 (if still pending April 8, 2024) through September 30, 2025. DHS made this 540-day extension permanent in a final rule published December 13, 2024, so it did not lapse when the temporary rule's own window closed.",
    currentStatus:
      "As of this writing, a covered, timely-filed I-765 renewal still automatically extends the prior EAD's validity for up to 540 days from its printed expiration date, without waiting for approval — but a separate DHS rule published October 30, 2025 ends this practice going forward for renewal applications filed on or after that date. Which rule actually governs a specific case depends on exactly when its I-765 was filed; never assume the 540-day extension applies without checking the filing date against these cutoffs.",
    sourceTitle: "USCIS: Final Rule Permanently Increases Automatic Extension of Employment Authorization and/or EADs",
    sourceUrl: "https://www.uscis.gov/archive/automatic-employment-authorization-document-ead-extension",
    titleEs: "La extensión automática del EAD aumenta a 540 días y luego se vuelve permanente",
    summaryEs:
      "Una regla final temporal vigente desde el 8 de abril de 2024 aumentó el período de extensión automática para una renovación oportuna del Documento de Autorización de Empleo (EAD) de hasta 180 días a hasta 540 días, para solicitudes de renovación presentadas a partir del 27 de octubre de 2023 (si aún estaban pendientes el 8 de abril de 2024) hasta el 30 de septiembre de 2025. DHS hizo permanente esta extensión de 540 días mediante una regla final publicada el 13 de diciembre de 2024, por lo que no caducó cuando cerró la ventana de la propia regla temporal.",
    currentStatusEs:
      "Al momento de escribir esto, una renovación I-765 cubierta y presentada a tiempo todavía extiende automáticamente la validez del EAD anterior hasta por 540 días desde su fecha de vencimiento impresa, sin esperar la aprobación — pero una regla separada de DHS publicada el 30 de octubre de 2025 termina esta práctica en adelante para las solicitudes de renovación presentadas a partir de esa fecha. Cuál regla realmente aplica a un caso específico depende exactamente de cuándo se presentó su I-765 — nunca debe suponerse que aplica la extensión de 540 días sin verificar la fecha de presentación contra estos plazos.",
  },
  {
    id: "h1b-modernization-rule-2025",
    kind: "memo",
    title: "H-1B Modernization Final Rule",
    datePublished: "2024-12-18",
    effectiveFrom: "2025-01-17",
    formTypes: ["I-129"],
    statusKeywords: ["h-1b", "specialty occupation", "site visit"],
    summary:
      "DHS published a final rule on December 18, 2024 (effective January 17, 2025) modernizing the H-1B specialty-occupation program: it revises the definition of 'specialty occupation' to clarify that a range of qualifying degree fields is acceptable as long as each is directly related to the job's duties, codifies USCIS's authority to conduct site visits (including of third-party worksites) and to deny or revoke a petition when an employer refuses one, and extends automatic cap-gap employment authorization for F-1 students changing to H-1B status. A separate, earlier January 2024 rule (part of the same modernization effort) tied H-1B lottery registration to a unique passport or travel-document number specifically to curb one person from having multiple registrations submitted on their behalf.",
    currentStatus:
      "This is the current operative standard for H-1B specialty-occupation determinations, site visits, and cap-gap timing. It does not change AC21 portability itself (see the I-129 entry above) — the two operate alongside each other.",
    sourceTitle: "USCIS: DHS Strengthens H-1B Program, Allowing U.S. Employers to More Quickly Fill Critical Jobs",
    sourceUrl: "https://www.uscis.gov/newsroom/news-releases/dhs-strengthens-h-1b-program-allowing-us-employers-to-more-quickly-fill-critical-jobs",
    titleEs: "Regla final de modernización del H-1B",
    summaryEs:
      "DHS publicó una regla final el 18 de diciembre de 2024 (vigente desde el 17 de enero de 2025) que moderniza el programa de ocupación especializada H-1B: revisa la definición de 'ocupación especializada' para aclarar que una variedad de campos de estudio calificados es aceptable siempre que cada uno esté directamente relacionado con las funciones del puesto, formaliza la autoridad de USCIS para realizar visitas de inspección (incluso a lugares de trabajo de terceros) y para denegar o revocar una petición cuando un empleador se niega a una, y extiende la autorización automática de empleo por vacío de vigencia (cap-gap) para estudiantes F-1 que cambian a estatus H-1B. Una regla separada y anterior de enero de 2024 (parte del mismo esfuerzo de modernización) vinculó el registro de la lotería H-1B a un número único de pasaporte o documento de viaje específicamente para evitar que una persona tuviera múltiples registros presentados en su nombre.",
    currentStatusEs:
      "Este es el estándar vigente actualmente para las determinaciones de ocupación especializada H-1B, las visitas de inspección y el momento del cap-gap. No cambia la portabilidad bajo AC21 en sí misma (vea la entrada I-129 de arriba) — ambas operan en conjunto.",
  },
  // Round 126 follow-up, second pass — Peter: "there must be more policies
  // than 15... do a deeper search." 4 more real, verified entries,
  // deliberately chosen to cover a form type with zero prior dated memo
  // (N-400) and to add real dated history behind two form types that
  // previously only had an undated reference entry (I-589, I-751).
  {
    id: "uscis-fee-rule-2024",
    kind: "memo",
    title: "2024 USCIS Fee Schedule — the First Increase Since 2016",
    datePublished: "2024-01-31",
    effectiveFrom: "2024-04-01",
    formTypes: "*",
    statusKeywords: [],
    summary:
      "USCIS published a final rule on January 31, 2024 (effective April 1, 2024) adjusting most immigration and naturalization benefit-request fees — the first broad fee increase since 2016. Increases varied significantly by form and category, with employment-based petitions seeing some of the largest jumps; a limited number of humanitarian-related fees stayed flat or were reduced. Applications postmarked or e-filed on or after April 1, 2024 are charged the new fee; the H-1B registration fee itself was a narrow, timing-driven exception that didn't increase for the FY2025 lottery.",
    currentStatus:
      "The April 2024 fee schedule is the current one. A case filed before April 1, 2024 was correctly charged the prior, lower fee at the time — a fee difference alone doesn't indicate anything about a case's status or progress.",
    sourceTitle: "USCIS: Frequently Asked Questions on the USCIS Fee Rule",
    sourceUrl: "https://www.uscis.gov/archive/frequently-asked-questions-on-the-uscis-fee-rule",
    titleEs: "El calendario de tarifas de USCIS de 2024 — el primer aumento desde 2016",
    summaryEs:
      "USCIS publicó una regla final el 31 de enero de 2024 (vigente desde el 1 de abril de 2024) que ajustó la mayoría de las tarifas de solicitudes de beneficios de inmigración y naturalización — el primer aumento amplio desde 2016. Los aumentos variaron significativamente según el formulario y la categoría, y las peticiones basadas en empleo tuvieron algunos de los mayores incrementos; un número limitado de tarifas relacionadas con asuntos humanitarios se mantuvo igual o se redujo. Las solicitudes con matasellos o presentadas electrónicamente a partir del 1 de abril de 2024 se cobran con la nueva tarifa; la tarifa de registro para la lotería H-1B fue una excepción puntual relacionada con el calendario y no aumentó para la lotería del año fiscal 2025.",
    currentStatusEs:
      "El calendario de tarifas de abril de 2024 es el vigente actualmente. Un caso presentado antes del 1 de abril de 2024 fue cobrado correctamente con la tarifa anterior y más baja en ese momento — una diferencia de tarifa por sí sola no indica nada sobre el estatus o el progreso de un caso.",
  },
  {
    id: "n400-civics-test-2021-reversion",
    kind: "memo",
    title: "Naturalization Civics Test Reverted to the 2008 Version",
    datePublished: "2021-03-01",
    formTypes: ["N-400"],
    statusKeywords: [],
    summary:
      "USCIS implemented a revised civics test on December 1, 2020 as part of a routine decennial review — expanding the question bank from 100 to 128 questions, the number asked during the interview from 10 to 20, and the number of correct answers needed to pass from 6 to 12. After finding the new test's development process, content, and rollout schedule may have created unintended barriers to naturalization, USCIS reverted to the longer-standing 2008 version (100 questions, 10 asked, 6 correct to pass) for any applicant filing on or after March 1, 2021. Applicants who filed between December 1, 2020 and February 28, 2021 and hadn't yet had their initial interview by mid-April 2021 could choose either version.",
    currentStatus:
      "The 2008-version civics test (100 questions, 10 asked, 6 correct needed) is the current operative standard for the N-400 civics requirement.",
    sourceTitle: "USCIS: USCIS Reverts to the 2008 Version of the Naturalization Civics Test",
    sourceUrl: "https://www.uscis.gov/archive/uscis-reverts-to-the-2008-version-of-the-naturalization-civics-test",
    titleEs: "La prueba de civismo para la naturalización vuelve a la versión de 2008",
    summaryEs:
      "USCIS implementó una prueba de civismo revisada el 1 de diciembre de 2020 como parte de una revisión decenal de rutina — ampliando el banco de preguntas de 100 a 128, el número de preguntas formuladas durante la entrevista de 10 a 20, y el número de respuestas correctas necesarias para aprobar de 6 a 12. Tras determinar que el proceso de desarrollo, el contenido y el calendario de implementación de la nueva prueba podrían haber creado barreras no intencionadas a la naturalización, USCIS volvió a la versión de 2008, de más larga data (100 preguntas, 10 formuladas, 6 correctas para aprobar), para cualquier solicitante que presentara su solicitud a partir del 1 de marzo de 2021. Los solicitantes que presentaron su solicitud entre el 1 de diciembre de 2020 y el 28 de febrero de 2021 y que aún no habían tenido su entrevista inicial a mediados de abril de 2021 podían elegir cualquiera de las dos versiones.",
    currentStatusEs:
      "La prueba de civismo de la versión de 2008 (100 preguntas, 10 formuladas, 6 correctas necesarias) es el estándar vigente actualmente para el requisito de civismo del N-400.",
  },
  {
    id: "circumvention-of-lawful-pathways-2023",
    kind: "memo",
    title: "The Circumvention of Lawful Pathways Asylum Rule — In Effect, Then Expired, Then Vacated",
    datePublished: "2023-05-11",
    formTypes: ["I-589"],
    statusKeywords: ["credible fear", "lawful pathways", "asylum ineligib"],
    summary:
      "DHS and DOJ's Circumvention of Lawful Pathways rule took effect May 11, 2023 (published May 16, 2023): a noncitizen who entered at the southwest border between ports of entry, or without a pre-scheduled appointment, was presumed ineligible for asylum unless they'd applied for and been denied protection in a country they transited through, subject to exceptions (unaccompanied children, certain medical or safety emergencies, a scheduled appointment, among others). It was written to sunset after 24 months.",
    currentStatus:
      "The rule expired on its own terms on May 11, 2025 — anyone entering after that date is no longer subject to it. For someone who entered between May 11, 2023 and May 11, 2025, a federal court (Judge Tigar, N.D. Cal.) separately reaffirmed on May 7, 2026 an earlier order vacating the rule nationwide as unlawful, meaning agencies and immigration judges should no longer hold a border crossing during that window against an asylum applicant's eligibility under this rule — unless a higher court stays that order. Whether a specific pending case is actually being handled consistently with that ruling isn't something this app can confirm.",
    sourceTitle: "Federal Register: Circumvention of Lawful Pathways",
    sourceUrl: "https://www.federalregister.gov/documents/2023/05/16/2023-10146/circumvention-of-lawful-pathways",
    titleEs: "La regla de asilo de Vías Legales — vigente, luego vencida, luego anulada",
    summaryEs:
      "La regla de Circumvention of Lawful Pathways (Vías Legales) de DHS y DOJ entró en vigor el 11 de mayo de 2023 (publicada el 16 de mayo de 2023): a un extranjero que ingresara por la frontera suroeste entre puertos de entrada, o sin una cita programada previamente, se le presumía inelegible para el asilo a menos que hubiera solicitado y se le hubiera negado protección en un país por el que transitó, con excepciones (menores no acompañados, ciertas emergencias médicas o de seguridad, una cita programada, entre otras). Fue redactada para vencer después de 24 meses.",
    currentStatusEs:
      "La regla venció por sus propios términos el 11 de mayo de 2025 — cualquier persona que ingrese después de esa fecha ya no está sujeta a ella. Para quien ingresó entre el 11 de mayo de 2023 y el 11 de mayo de 2025, un tribunal federal (el juez Tigar, del Distrito Norte de California) reafirmó por separado el 7 de mayo de 2026 una orden anterior que anulaba la regla a nivel nacional por considerarla ilegal, lo que significa que las agencias y los jueces de inmigración ya no deberían usar un cruce fronterizo durante ese período en contra de la elegibilidad de asilo de un solicitante bajo esta regla — a menos que un tribunal superior suspenda esa orden. Esta aplicación no puede confirmar si un caso pendiente específico realmente se está manejando de forma consistente con ese fallo.",
  },
  {
    id: "i751-interview-waiver-risk-based-2022",
    kind: "memo",
    title: "I-751 Interview Waivers — USCIS Shifts to a Risk-Based Approach",
    datePublished: "2022-04-07",
    formTypes: ["I-751"],
    statusKeywords: ["interview waived", "interview waiver"],
    summary:
      "USCIS updated its Policy Manual on April 7, 2022, replacing 2018 guidance with a risk-based approach to waiving the interview otherwise required for a joint Form I-751. An officer may waive the interview when the evidence sufficiently establishes the marriage's bona fides, any required joint-filing waiver is clearly eligible, nothing suggests fraud or misrepresentation in the supporting documents, the facts aren't complex, and there's no disqualifying criminal history.",
    currentStatus:
      "This is the current operative standard. An interview being waived reflects that the officer found the case clear-cut on the paper record, not a lesser or lower-confidence approval than one that went through an interview.",
    sourceTitle: "USCIS: USCIS Revises Interview Waiver Guidance for Form I-751",
    sourceUrl: "https://www.uscis.gov/news/alerts/uscis-revises-interview-waiver-guidance-form-i-751",
    titleEs: "Exenciones de entrevista para el I-751 — USCIS adopta un enfoque basado en riesgo",
    summaryEs:
      "USCIS actualizó su Manual de Políticas el 7 de abril de 2022, reemplazando la orientación de 2018 con un enfoque basado en riesgo para exonerar la entrevista que de otro modo se requiere para un Formulario I-751 conjunto. Un oficial puede exonerar la entrevista cuando la evidencia establece suficientemente la buena fe del matrimonio, cualquier exención de presentación conjunta requerida es claramente elegible, nada sugiere fraude o falsedad en los documentos de respaldo, los hechos no son complejos, y no existe un historial penal descalificante.",
    currentStatusEs:
      "Este es el estándar vigente actualmente. Que se exonere una entrevista refleja que el oficial consideró el caso claro a partir del expediente escrito, no una aprobación de menor peso o confianza que una que pasó por entrevista.",
  },
  // Round 126 follow-up, third pass — Peter pasted a categorized list from
  // an external AI-search tool as research leads, not facts to trust
  // directly (an AI summary can misstate a date or memo name) -- each of
  // these 4 was independently re-verified via live search against USCIS.gov/
  // AILA/the Federal Register before being trusted enough to write down.
  // Chosen for real relevance to CaseWhy's own supported form types (H-2A,
  // TPS, SIJ, and USRAP leads from that same list were skipped as out of
  // scope -- CaseWhy doesn't track those form types).
  {
    id: "h1b-employer-employee-memos-rescinded-2020",
    kind: "memo",
    title: "USCIS Rescinds the Neufeld and Contracts/Itineraries H-1B Memos",
    datePublished: "2020-06-17",
    formTypes: ["I-129"],
    statusKeywords: ["employer-employee", "itinerary", "third-party worksite"],
    summary:
      "Following a May 2020 settlement in ITServe Alliance v. Cissna, USCIS rescinded two restrictive H-1B policy memos on June 17, 2020: the 2010 'Neufeld memo,' which had set a stricter test for proving an employer-employee relationship (especially for third-party/consulting placements), and a 2018 memo requiring detailed itineraries and end-client contracts for the full requested validity period. USCIS can no longer deny a case based solely on those rescinded standards.",
    currentStatus:
      "This is the current operative standard — an employer-employee relationship for H-1B purposes is evaluated under the regulatory definition and general adjudication standards, not the rescinded memos' stricter tests. A case's own status text or history referencing a request for contracts, work orders, or itinerary detail can still reflect an officer's independent evidence request under current rules, not a revival of the rescinded policies.",
    sourceTitle: "USCIS: Questions & Answers: Memoranda on Establishing the Employer-Employee Relationship in H-1B Petitions",
    sourceUrl: "https://www.uscis.gov/archive/questions-answers-memoranda-on-establishing-the-employer-employee-relationship-in-h-1b-petitions",
    titleEs: "USCIS deroga los memorandos Neufeld y de contratos/itinerarios para el H-1B",
    summaryEs:
      "Tras un acuerdo de mayo de 2020 en el caso ITServe Alliance v. Cissna, USCIS derogó dos memorandos de política restrictivos sobre el H-1B el 17 de junio de 2020: el 'memo Neufeld' de 2010, que había establecido una prueba más estricta para demostrar una relación empleador-empleado (especialmente para colocaciones de consultoría o con terceros), y un memo de 2018 que exigía itinerarios detallados y contratos con el cliente final para todo el período de validez solicitado. USCIS ya no puede denegar un caso basándose únicamente en esos estándares derogados.",
    currentStatusEs:
      "Este es el estándar vigente actualmente — una relación empleador-empleado para fines del H-1B se evalúa bajo la definición reglamentaria y los estándares generales de adjudicación, no bajo las pruebas más estrictas de los memorandos derogados. Que el texto de estado o el historial de un caso mencione una solicitud de contratos, órdenes de trabajo o detalles del itinerario todavía puede reflejar una solicitud de evidencia independiente del oficial bajo las reglas actuales, no un resurgimiento de las políticas derogadas.",
  },
  {
    id: "reproduced-signature-flexibility-permanent-2022",
    kind: "memo",
    title: "Scanned/Reproduced Signatures Made a Permanent Policy",
    datePublished: "2022-07-25",
    formTypes: "*",
    statusKeywords: [],
    summary:
      "USCIS first allowed scanned, faxed, or photocopied reproductions of an original handwritten signature on benefit forms and documents starting March 21, 2020, as a COVID-19 flexibility (a purely electronic signature like DocuSign didn't qualify). On July 25, 2022, USCIS made this reproduced-signature flexibility permanent policy rather than letting it expire with the pandemic emergency. The filer must still keep the original signed document, since USCIS can request it at any time.",
    currentStatus:
      "This remains the current policy — a reproduced signature on an original handwritten signature is acceptable indefinitely, not just during a declared emergency. This is a separate, narrower thing than other COVID-era flexibilities (like extra response time for RFEs) that USCIS ended March 23, 2023 — a case's own filing shouldn't be assumed to have gotten both just because one is mentioned.",
    sourceTitle: "USCIS: USCIS Extends COVID-19-Related Flexibilities",
    sourceUrl: "https://www.uscis.gov/newsroom/alerts/uscis-extends-covid-19-related-flexibilities",
    titleEs: "Las firmas escaneadas/reproducidas se convierten en política permanente",
    summaryEs:
      "USCIS permitió por primera vez reproducciones escaneadas, enviadas por fax o fotocopiadas de una firma manuscrita original en formularios y documentos de beneficios a partir del 21 de marzo de 2020, como una flexibilidad por COVID-19 (una firma puramente electrónica como DocuSign no calificaba). El 25 de julio de 2022, USCIS convirtió esta flexibilidad de firma reproducida en política permanente en lugar de dejarla expirar junto con la emergencia por la pandemia. El solicitante debe conservar el documento original firmado, ya que USCIS puede solicitarlo en cualquier momento.",
    currentStatusEs:
      "Esta sigue siendo la política vigente — una firma reproducida sobre una firma manuscrita original es aceptable de manera indefinida, no solo durante una emergencia declarada. Esto es algo distinto y más limitado que otras flexibilidades de la era COVID (como tiempo adicional para responder a una RFE) que USCIS terminó el 23 de marzo de 2023 — no debe suponerse que un caso recibió ambas solo porque se menciona una de ellas.",
  },
  {
    id: "n400-gmc-voter-registration-2021",
    kind: "memo",
    title: "Good Moral Character — Unintentional DMV Voter Registration Isn't Held Against You",
    datePublished: "2021-05-27",
    memoNumber: "PA-2021-08",
    formTypes: ["N-400"],
    statusKeywords: ["good moral character", "voter registration", "unlawful voting"],
    summary:
      "USCIS issued policy guidance (PA-2021-08) on May 27, 2021 clarifying that an applicant who was automatically or unknowingly registered to vote through a state DMV's motor-voter process — without ever actually voting, and without intending to falsely claim citizenship — should not be found to lack good moral character or be inadmissible for it on that basis alone. This reversed a stricter, more literal reading applied under the prior administration.",
    currentStatus:
      "This is the current operative standard for this specific, narrow fact pattern. It doesn't excuse actual unlawful voting or a knowing false claim to citizenship — both remain serious grounds a case-specific attorney consultation is warranted for, not something this app can assess.",
    sourceTitle: "USCIS: Naturalization Eligibility and Voter Registration Through a State's Benefit Application Process",
    sourceUrl: "https://www.uscis.gov/policy-manual/volume-12-part-f-chapter-1",
    titleEs: "Buen carácter moral — el registro de votante no intencional en el DMV no se usa en su contra",
    summaryEs:
      "USCIS emitió una orientación de política (PA-2021-08) el 27 de mayo de 2021 aclarando que un solicitante que fue registrado para votar de forma automática o sin saberlo a través del proceso de 'motor-voter' del DMV de un estado — sin haber votado realmente, y sin intención de reclamar falsamente la ciudadanía — no debería ser considerado carente de buen carácter moral ni inadmisible únicamente por eso. Esto revirtió una interpretación más estricta y literal aplicada bajo la administración anterior.",
    currentStatusEs:
      "Este es el estándar vigente actualmente para este patrón de hechos específico y limitado. No excusa el voto ilegal real ni una reclamación falsa y consciente de ciudadanía — ambos siguen siendo motivos serios que ameritan consultar a un abogado sobre el caso específico, algo que esta aplicación no puede evaluar.",
  },
  {
    id: "n400-neighborhood-investigations-resumed-2025",
    kind: "memo",
    title: "USCIS Resumes Neighborhood Investigations for Naturalization",
    datePublished: "2025-08-22",
    memoNumber: "PM-602-0189",
    effectiveFrom: "2026-08-25",
    formTypes: ["N-400"],
    statusKeywords: ["investigation", "neighborhood"],
    summary:
      "USCIS Director Edlow issued a policy memorandum on August 22, 2025 reviving personal ('neighborhood') investigations under INA 335(a) — a discretionary tool, unused since 1991, letting USCIS interview neighbors, employers, or others in an applicant's community to help corroborate residency, good moral character, and other naturalization eligibility factors, covering at least the 5 years before filing. USCIS formalized this in the Policy Manual effective August 25, 2026, moving from automatically waiving these investigations to deciding case-by-case.",
    currentStatus:
      "A neighborhood investigation, when used, is one discretionary corroboration tool among several an officer may draw on — it doesn't by itself indicate a problem with an application, and most applicants still won't have one conducted. There's no published, reliable way to predict in advance whether a specific case will get one.",
    sourceTitle: "USCIS Policy Manual: Investigations and Examinations for Naturalization Eligibility",
    sourceUrl: "https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20260825-InvestigationsForNatzEligibility.pdf",
    titleEs: "USCIS reanuda las investigaciones de vecindario para la naturalización",
    summaryEs:
      "El director de USCIS, Edlow, emitió un memorando de política el 22 de agosto de 2025 que revive las investigaciones personales ('de vecindario') bajo la sección 335(a) de la INA — una herramienta discrecional, sin uso desde 1991, que permite a USCIS entrevistar a vecinos, empleadores u otras personas de la comunidad de un solicitante para ayudar a corroborar la residencia, el buen carácter moral y otros factores de elegibilidad para la naturalización, cubriendo al menos los 5 años previos a la presentación. USCIS formalizó esto en el Manual de Políticas vigente desde el 25 de agosto de 2026, pasando de exonerar automáticamente estas investigaciones a decidir caso por caso.",
    currentStatusEs:
      "Una investigación de vecindario, cuando se utiliza, es una herramienta discrecional de corroboración entre varias en las que puede apoyarse un oficial — no indica por sí sola un problema con una solicitud, y la mayoría de los solicitantes seguirán sin tener una. No existe una forma publicada y confiable de predecir de antemano si a un caso específico se le realizará una.",
  },
];

function textMatches(memo: PolicyMemo, haystack: string): boolean {
  if (memo.statusKeywords.length === 0) return true;
  return memo.statusKeywords.some((kw) => haystack.includes(kw));
}

function formTypeMatches(memo: PolicyMemo, formType: string): boolean {
  return memo.formTypes === "*" || memo.formTypes.includes(formType.toUpperCase());
}

export interface CaseFactsForMatching {
  formType: string;
  statusText: string;
  statusDescription: string;
  historyText: string;
  submittedDate?: string;
}

/**
 * Find KB entries plausibly relevant to a case, purely by form type + keyword
 * overlap with the case's own status text/history, or a filing-date cutoff
 * for date-gated rule changes. Deliberately conservative — see file header.
 * Capped to 2 entries so the prompt stays small and the model isn't tempted
 * to pad the explanation with every tangentially-matched policy.
 */
export function findRelevantPolicyContext(facts: CaseFactsForMatching): PolicyMemo[] {
  const haystack = `${facts.statusText} ${facts.statusDescription} ${facts.historyText}`.toLowerCase();

  const matches = POLICY_MEMOS.filter((memo) => {
    if (!formTypeMatches(memo, facts.formType)) return false;
    if (memo.effectiveFrom) {
      return Boolean(facts.submittedDate && facts.submittedDate >= memo.effectiveFrom);
    }
    return textMatches(memo, haystack);
  });

  // Form-specific entries (formTypes narrowed to this exact form, e.g. the
  // I-131 abandonment-risk entry) rank ahead of broadly-applicable "*"
  // entries, so a form-specific match can't get crowded out of the top-2 cap
  // by a coincidentally-matched general one.
  matches.sort((a, b) => Number(a.formTypes === "*") - Number(b.formTypes === "*"));

  return matches.slice(0, 2);
}

// Round 63 — a real internal permalink for a policy memo (/policy/[id]),
// so relatedPolicies links (CaseChat, the dashboard explanation) point
// somewhere internal a signed-in user can copy into the chat's "paste a
// link" feature, instead of straight out to sourceUrl. No fetch needed —
// this is CaseWhy's own already-curated data.
export function findPolicyMemoById(id: string): PolicyMemo | undefined {
  return POLICY_MEMOS.find((memo) => memo.id === id);
}
