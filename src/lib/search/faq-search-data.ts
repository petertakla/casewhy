// Round 110 — a pure-data (no JSX, no next/link) mirror of the FAQ
// content in src/app/faq/page.tsx and src/app/es/faq/page.tsx, so
// scripts/build-search-index.ts (run outside Next's own runtime, via
// tsx) can index it without importing a page module that pulls in
// next/link. Same "kept in sync by hand" tradeoff those two page files
// already have with each other (round 97/104's own comment) — whoever
// edits the FAQ content in a future round updates this file's question/
// snippet text too, in the same round. ids are derived by slugify() from
// the question text at both call sites, so the id here and the anchor
// actually rendered on the page can never drift apart even if this file
// itself goes briefly stale.

export interface FaqSearchEntry {
  group: string;
  groupEs: string;
  question: string;
  questionEs: string;
  snippet: string;
  snippetEs: string;
}

export const FAQ_SEARCH_ENTRIES: FaqSearchEntry[] = [
  {
    group: "About CaseWhy",
    groupEs: "Sobre CaseWhy",
    question: "Is CaseWhy affiliated with USCIS?",
    questionEs: "¿CaseWhy está afiliado a USCIS?",
    snippet: "No. CaseWhy is not affiliated with, endorsed by, or operated by USCIS, the Department of Homeland Security, or any other government agency.",
    snippetEs: "No. CaseWhy no está afiliado con USCIS, el Departamento de Seguridad Nacional (DHS) ni ninguna otra agencia gubernamental.",
  },
  {
    group: "About CaseWhy",
    groupEs: "Sobre CaseWhy",
    question: "Who built CaseWhy, and why?",
    questionEs: "¿Quién creó CaseWhy, y por qué?",
    snippet: "CaseWhy is built by CaseWhy LLC, a small company in Florida, by a founder who watched a family naturalization case stall at the last step.",
    snippetEs: "CaseWhy fue creado por CaseWhy LLC, una pequeña empresa en Florida, por un fundador que vio cómo el caso de naturalización de su familia se estancó.",
  },
  {
    group: "About CaseWhy",
    groupEs: "Sobre CaseWhy",
    question: "Is anything CaseWhy tells me legal advice?",
    questionEs: "¿Algo de lo que CaseWhy me dice es asesoría legal?",
    snippet: "No. CaseWhy is not a law firm, does not provide legal advice, and using it does not create an attorney-client relationship of any kind.",
    snippetEs: "No. CaseWhy no es un despacho de abogados, no ofrece asesoría legal, y su uso no crea ningún tipo de relación abogado-cliente.",
  },
  {
    group: "Tracking a case",
    groupEs: "Rastrear un caso",
    question: "Which USCIS cases can I track?",
    questionEs: "¿Qué casos de USCIS puedo rastrear?",
    snippet: "Any case that has a USCIS receipt number — three letters followed by ten digits. Family petitions, green cards, naturalization, work permits, and more.",
    snippetEs: "Cualquier caso que tenga un número de recibo de USCIS — tres letras seguidas de diez dígitos. Peticiones familiares, residencia, naturalización y más.",
  },
  {
    group: "Tracking a case",
    groupEs: "Rastrear un caso",
    question: "How often does CaseWhy check my case?",
    questionEs: "¿Con qué frecuencia revisa CaseWhy mi caso?",
    snippet: "Every tracked case is checked automatically once a day. CaseWhy Plus adds a \"Check now\" button for an on-demand check.",
    snippetEs: "Cada caso rastreado se revisa automáticamente una vez al día. CaseWhy Plus agrega un botón de \"Revisar ahora\".",
  },
  {
    group: "Tracking a case",
    groupEs: "Rastrear un caso",
    question: "How will I know when my status changes?",
    questionEs: "¿Cómo sabré cuándo cambia mi estado?",
    snippet: "You get an email the day a status changes, and a push notification if you've turned notifications on.",
    snippetEs: "Recibirá un correo electrónico el día que cambie un estado, y una notificación push si las ha activado.",
  },
  {
    group: "Tracking a case",
    groupEs: "Rastrear un caso",
    question: "Can I track a family member's case?",
    questionEs: "¿Puedo rastrear el caso de un familiar?",
    snippet: "Yes — the free tier tracks up to three cases, and Plus tracks up to ten (with more available on request).",
    snippetEs: "Sí — el nivel gratuito rastrea hasta tres casos, y Plus rastrea hasta diez (con más disponibles a solicitud).",
  },
  {
    group: "Tracking a case",
    groupEs: "Rastrear un caso",
    question: 'What does "Case Was Received" mean, and what\'s a stalled case?',
    questionEs: '¿Qué significa "Case Was Received", y qué es un caso estancado?',
    snippet: '"Case Was Received" is the first status almost every case shows. A case becomes "outside normal processing time" when it waits longer than USCIS publishes.',
    snippetEs: '"Case Was Received" es el primer estado que muestra casi todo caso. Un caso pasa a estar "fuera del tiempo de procesamiento normal" cuando espera más de lo publicado.',
  },
  {
    group: "Ask CaseWhy and AI explanations",
    groupEs: "Ask CaseWhy y las explicaciones de IA",
    question: "Do I need an account to ask a question?",
    questionEs: "¿Necesito una cuenta para hacer una pregunta?",
    snippet: "No. Ask CaseWhy on the Get Help page answers three questions without any sign-in.",
    snippetEs: "No. Ask CaseWhy en la página de Obtener ayuda responde tres preguntas sin necesidad de iniciar sesión.",
  },
  {
    group: "Ask CaseWhy and AI explanations",
    groupEs: "Ask CaseWhy y las explicaciones de IA",
    question: "How accurate are the AI explanations?",
    questionEs: "¿Qué tan precisas son las explicaciones de IA?",
    snippet: "The explanations describe what a status or process generally means, drawn from USCIS's own published materials, and every answer shows its source.",
    snippetEs: "Las explicaciones describen lo que un estado o proceso generalmente significa, basadas en materiales publicados por USCIS.",
  },
  {
    group: "Ask CaseWhy and AI explanations",
    groupEs: "Ask CaseWhy y las explicaciones de IA",
    question: "Is CaseWhy available in Spanish?",
    questionEs: "¿CaseWhy está disponible en español?",
    snippet: "Yes — the site, the app, Get Help, and the FAQ are available in Spanish; use the Español link at the top of any page.",
    snippetEs: "Sí — el sitio, la aplicación, Obtener ayuda y las Preguntas Frecuentes están disponibles en español.",
  },
  {
    group: "CaseWhy Plus",
    groupEs: "CaseWhy Plus",
    question: "Is CaseWhy really free?",
    questionEs: "¿CaseWhy es realmente gratis?",
    snippet: "CaseWhy has a free tier — up to three tracked cases, a status timeline, AI-generated explanations, and three AI questions a month.",
    snippetEs: "CaseWhy tiene un nivel gratuito — hasta tres casos rastreados, una línea de tiempo de estado, y tres preguntas de IA al mes.",
  },
  {
    group: "CaseWhy Plus",
    groupEs: "CaseWhy Plus",
    question: "What does Plus cost, and how do I cancel?",
    questionEs: "¿Cuánto cuesta Plus, y cómo lo cancelo?",
    snippet: "Plus is $9.99 a month, $39.99 every 6 months, or $69.99 a year, billed through Stripe. Cancel any time from the Plus page.",
    snippetEs: "Plus cuesta $9.99 al mes, $39.99 cada 6 meses, o $69.99 al año. Puede cancelar en cualquier momento desde la página de Plus.",
  },
  {
    group: "CaseWhy Plus",
    groupEs: "CaseWhy Plus",
    question: "Can I share my case with my attorney?",
    questionEs: "¿Puedo compartir mi caso con mi abogado?",
    snippet: "Plus includes an attorney-handoff PDF: your case timeline, status history, and the explanations in one document.",
    snippetEs: "Plus incluye un informe en PDF para su abogado: la línea de tiempo de su caso, el historial de estado y las explicaciones.",
  },
  {
    group: "Privacy and your data",
    groupEs: "Privacidad y sus datos",
    question: "How is my case data protected?",
    questionEs: "¿Cómo se protegen los datos de mi caso?",
    snippet: "Case and account data is encrypted both at rest and in transit. USCIS treats receipt numbers as personally identifiable information, and so does CaseWhy.",
    snippetEs: "Los datos de su caso y de su cuenta están cifrados tanto en reposo como en tránsito. USCIS trata los números de recibo como información de identificación personal.",
  },
  {
    group: "Privacy and your data",
    groupEs: "Privacidad y sus datos",
    question: "What happens to my data if I cancel or delete my account?",
    questionEs: "¿Qué pasa con mis datos si cancelo o elimino mi cuenta?",
    snippet: "Remove a case anytime from your dashboard; full account deletion is a request to privacy@casewhy.com, done within 30 days.",
    snippetEs: "Elimine un caso en cualquier momento desde su panel; la eliminación completa de la cuenta es una solicitud a privacy@casewhy.com, en un plazo de 30 días.",
  },
];
