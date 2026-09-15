import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PublicPage } from "@/components/PublicPage";

// Round 97 item 3 — Spanish translation of /faq (round 73). Round 104
// expanded both to 16 questions in five groups; the original five answers
// here stay word-for-word except "¿Cómo se protegen los datos de mi
// caso?", which gains one new sentence, matching the English page exactly.
// Same content as faq/page.tsx, kept in sync by hand (no shared data
// source between the two — same tradeoff round 79 already made for
// /es/plus). Formal "usted" register per round 81's decision.

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | CaseWhy",
  description:
    "Respuestas a las preguntas más comunes sobre CaseWhy — cómo rastrear un caso, explicaciones de IA, precios de Plus, privacidad y cómo se protegen sus datos.",
  alternates: {
    languages: {
      en: "https://app.casewhy.com/faq",
      es: "https://app.casewhy.com/es/faq",
    },
  },
};

interface Faq {
  question: string;
  answer: ReactNode;
  plainText?: string;
}

interface FaqGroup {
  heading: string;
  faqs: Faq[];
}

const GROUPS: FaqGroup[] = [
  {
    heading: "Sobre CaseWhy",
    faqs: [
      {
        question: "¿CaseWhy está afiliado a USCIS?",
        answer:
          "No. CaseWhy no está afiliado con USCIS, el Departamento de Seguridad Nacional (DHS) ni ninguna otra agencia gubernamental, y no cuenta con su respaldo ni es operado por ellos. CaseWhy muestra información obtenida de sistemas gubernamentales públicos, pero no controla esos datos y no puede garantizar su exactitud, integridad ni actualidad.",
      },
      {
        question: "¿Quién creó CaseWhy, y por qué?",
        plainText:
          "CaseWhy fue creado por CaseWhy LLC, una pequeña empresa en Florida, por un fundador que pasó quince años como arquitecto de soluciones y luego vio cómo el caso de naturalización de su familia se estancó en el último paso. No hay financiamiento de capital de riesgo ni red publicitaria detrás de la empresa. El propio relato del fundador sobre por qué existe CaseWhy está en la página de Actualizaciones.",
        answer: (
          <>
            CaseWhy fue creado por CaseWhy LLC, una pequeña empresa en Florida, por un fundador que pasó quince años
            como arquitecto de soluciones y luego vio cómo el caso de naturalización de su familia se estancó en el
            último paso. No hay financiamiento de capital de riesgo ni red publicitaria detrás de la empresa. El
            propio relato del fundador sobre por qué existe CaseWhy está en la{" "}
            <Link href="/updates/a-note-from-the-founder?lang=es" className="text-brand-600 hover:underline dark:text-brand-400">
              página de Actualizaciones
            </Link>
            .
          </>
        ),
      },
      {
        question: "¿Algo de lo que CaseWhy me dice es asesoría legal?",
        plainText:
          "No. CaseWhy no es un despacho de abogados, no ofrece asesoría legal, y su uso no crea ningún tipo de relación abogado-cliente. Las explicaciones sobre el estado de su caso, las respuestas del chat de IA, las estimaciones de tiempos de procesamiento, la información del boletín de visas y la ayuda para redactar cartas de escalamiento son todo contenido general e informativo obtenido de materiales públicos de USCIS — que describen lo que un estado o proceso generalmente significa, nunca una conclusión sobre lo que usted, específicamente, debería hacer con su caso. Para los casos de asilo (I-589) y DACA (I-821D) en particular, CaseWhy nunca le dirá si usted califica para algún alivio ni predecirá el resultado de su caso — solo un abogado de inmigración con licencia o un representante acreditado puede hacerlo, y CaseWhy lo referirá a uno cada vez que una pregunta dependa de los hechos específicos de su caso.",
        answer: (
          <>
            No. CaseWhy no es un despacho de abogados, no ofrece asesoría legal, y su uso no crea ningún tipo de
            relación abogado-cliente. Las explicaciones sobre el estado de su caso, las respuestas del chat de IA,{" "}
            <Link href="/processing-times" className="text-brand-600 hover:underline dark:text-brand-400">
              las estimaciones de tiempos de procesamiento
            </Link>
            ,{" "}
            <Link href="/visa-bulletin" className="text-brand-600 hover:underline dark:text-brand-400">
              la información del boletín de visas
            </Link>{" "}
            y la ayuda para redactar cartas de escalamiento son todo contenido general e informativo obtenido de
            materiales públicos de USCIS — que describen lo que un estado o proceso generalmente significa, nunca
            una conclusión sobre lo que usted, específicamente, debería hacer con su caso. Para los casos de asilo
            (I-589) y DACA (I-821D) en particular, CaseWhy nunca le dirá si usted califica para algún alivio ni
            predecirá el resultado de su caso — solo un abogado de inmigración con licencia o un representante
            acreditado puede hacerlo, y CaseWhy lo referirá a uno cada vez que una pregunta dependa de los hechos
            específicos de su caso.
          </>
        ),
      },
    ],
  },
  {
    heading: "Rastrear un caso",
    faqs: [
      {
        question: "¿Qué casos de USCIS puedo rastrear?",
        answer:
          "Cualquier caso que tenga un número de recibo de USCIS — el número de 13 caracteres en su aviso I-797, tres letras seguidas de diez dígitos (por ejemplo IOE, MSC, EAC, WAC, LIN, SRC, NBC, YSC; CaseWhy acepta cualquier número de recibo con formato válido, no solo estos ejemplos). Eso incluye peticiones familiares (I-130), solicitudes de residencia permanente (I-485), naturalización (N-400), permisos de trabajo (I-765), documentos de viaje (I-131), remoción de condiciones (I-751), peticiones de empleador (I-129, I-140), asilo (I-589) y DACA (I-821D), entre otros. Si USCIS Case Status Online lo muestra, CaseWhy puede rastrearlo.",
      },
      {
        question: "¿Con qué frecuencia revisa CaseWhy mi caso?",
        answer:
          'Cada caso rastreado se revisa automáticamente una vez al día. CaseWhy Plus agrega un botón de "Revisar ahora" para una revisión a solicitud cuando usted lo desee.',
      },
      {
        question: "¿Cómo sabré cuándo cambia mi estado?",
        answer:
          "Recibirá un correo electrónico el día que cambie un estado, y una notificación push si ha activado las notificaciones de CaseWhy en su navegador o teléfono. En iPhone, las notificaciones push requieren primero agregar CaseWhy a la pantalla de inicio — la página de Configuración le explica cómo hacerlo. Cada cambio también queda registrado en la línea de tiempo del historial del caso.",
      },
      {
        question: "¿Puedo rastrear el caso de un familiar?",
        answer:
          "Sí — el nivel gratuito rastrea hasta tres casos, y Plus rastrea hasta diez (con más disponibles a solicitud). Necesitará el número de recibo de su aviso. Rastree únicamente casos que tiene derecho a ver; CaseWhy muestra el mismo estado público que USCIS le mostraría a cualquier persona con ese número.",
      },
      {
        question: '¿Qué significa "Case Was Received", y qué es un caso estancado?',
        plainText:
          '"Case Was Received" ("Su caso fue recibido") es el primer estado que muestra casi todo caso; confirma que USCIS tiene su solicitud y el pago, y nada más. Un caso pasa a estar "fuera del tiempo de procesamiento normal" cuando ha esperado más tiempo del que USCIS mismo publica para ese formulario y oficina — CaseWhy marca esto automáticamente en todos los niveles, y muestra los canales formales que se abren en ese momento (una USCIS e-Request, una consulta al Congreso, el Ombudsman de USCIS). Plus puede redactar esas cartas por usted.',
        answer: (
          <>
            &quot;Case Was Received&quot; (&quot;Su caso fue recibido&quot;) es el primer estado que muestra casi
            todo caso; confirma que USCIS tiene su solicitud y el pago, y nada más. Un caso pasa a estar{" "}
            <Link href="/updates/when-your-case-goes-silent?lang=es" className="text-brand-600 hover:underline dark:text-brand-400">
              &quot;fuera del tiempo de procesamiento normal&quot;
            </Link>{" "}
            cuando ha esperado más tiempo del que USCIS mismo publica para ese formulario y oficina — CaseWhy marca
            esto automáticamente en todos los niveles, y muestra los canales formales que se abren en ese momento
            (una USCIS e-Request, una consulta al Congreso, el Ombudsman de USCIS). Plus puede redactar esas cartas
            por usted. Vea también{" "}
            <Link
              href="/updates/what-case-was-received-actually-means?lang=es"
              className="text-brand-600 hover:underline dark:text-brand-400"
            >
              qué significa realmente &quot;Case Was Received&quot;
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    heading: "Ask CaseWhy y las explicaciones de IA",
    faqs: [
      {
        question: "¿Necesito una cuenta para hacer una pregunta?",
        plainText:
          "No. Ask CaseWhy en la página de Obtener ayuda responde tres preguntas sin necesidad de iniciar sesión; después de eso, una cuenta gratuita le da tres preguntas de IA sobre su propio caso cada mes, y Plus las hace ilimitadas.",
        answer: (
          <>
            No. Ask CaseWhy en la página de{" "}
            <Link href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Obtener ayuda
            </Link>{" "}
            responde tres preguntas sin necesidad de iniciar sesión; después de eso, una cuenta gratuita le da tres
            preguntas de IA sobre su propio caso cada mes, y Plus las hace ilimitadas.
          </>
        ),
      },
      {
        question: "¿Qué tan precisas son las explicaciones de IA?",
        answer:
          "Las explicaciones describen lo que un estado o proceso generalmente significa, basadas en materiales publicados por USCIS, y cada respuesta muestra la fuente de la que se elaboró. Pueden estar equivocadas o desactualizadas, y nunca conocen datos sobre su caso que USCIS no haya publicado. Si algo no le parece correcto, escriba a corrections@casewhy.com — una persona lee cada mensaje.",
      },
      {
        question: "¿CaseWhy está disponible en español?",
        plainText:
          'Sí — el sitio, la aplicación, Obtener ayuda (incluido su cuadro de pregunta de texto libre) y las Preguntas Frecuentes están disponibles en español; use el enlace English en la parte superior de cualquier página. Algunas páginas de referencia todavía están solo en inglés y se marcan "(en inglés)" donde se enlazan. Las explicaciones de caso generadas por IA y el chat de "Ask a question" con sesión iniciada actualmente responden solo en inglés, incluso en una página en español — una limitación de la que estamos conscientes.',
        answer: (
          <>
            Sí — el sitio, la aplicación,{" "}
            <Link href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Obtener ayuda
            </Link>{" "}
            (incluido su cuadro de pregunta de texto libre) y las Preguntas Frecuentes están disponibles en español;
            use el enlace English en la parte superior de cualquier página. Algunas páginas de referencia todavía
            están solo en inglés y se marcan &quot;(en inglés)&quot; donde se enlazan. Las explicaciones de caso
            generadas por IA y el chat de &quot;Ask a question&quot; con sesión iniciada actualmente responden solo
            en inglés, incluso en una página en español — una limitación de la que estamos conscientes.
          </>
        ),
      },
    ],
  },
  {
    heading: "CaseWhy Plus",
    faqs: [
      {
        question: "¿CaseWhy es realmente gratis?",
        plainText:
          "CaseWhy tiene un nivel gratuito — hasta tres casos rastreados, una línea de tiempo de estado, explicaciones en lenguaje sencillo generadas por IA, y tres preguntas de IA sobre su caso cada mes — además de un nivel Plus opcional y de pago para rastrear más casos, preguntas ilimitadas y otras funciones adicionales (consulte la página de Plus para ver los precios actuales). Obtener ayuda — los directorios de CaseWhy de asistencia legal gratuita, representantes acreditados, abogados y otros recursos — es gratis para todos, siempre, sin importar la suscripción: sin tarifas, sin anuncios, sin costos ocultos.",
        answer: (
          <>
            CaseWhy tiene un nivel gratuito — hasta tres casos rastreados, una línea de tiempo de estado,
            explicaciones en lenguaje sencillo generadas por IA, y tres preguntas de IA sobre su caso cada mes —
            además de un nivel Plus opcional y de pago para rastrear más casos, preguntas ilimitadas y otras
            funciones adicionales (consulte la{" "}
            <Link href="/es/plus" className="text-brand-600 hover:underline dark:text-brand-400">
              página de Plus
            </Link>{" "}
            para ver los precios actuales).{" "}
            <Link href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Obtener ayuda
            </Link>{" "}
            — los directorios de CaseWhy de asistencia legal gratuita, representantes acreditados, abogados y otros
            recursos — es gratis para todos, siempre, sin importar la suscripción: sin tarifas, sin anuncios, sin
            costos ocultos.
          </>
        ),
      },
      {
        question: "¿Cuánto cuesta Plus, y cómo lo cancelo?",
        plainText:
          "Plus cuesta $9.99 al mes, $22.99 al trimestre, o $66.99 al año, facturado a través de Stripe. Puede cancelar en cualquier momento desde el enlace 'Administrar suscripción' en la página de Plus; conservará Plus hasta el final del período que ya pagó. No hay reembolsos ni prorrateo por períodos parciales.",
        answer: (
          <>
            Plus cuesta $9.99 al mes, $22.99 al trimestre, o $66.99 al año, facturado a través de Stripe. Puede
            cancelar en cualquier momento desde el enlace &quot;Administrar suscripción&quot; en la{" "}
            <Link href="/es/plus" className="text-brand-600 hover:underline dark:text-brand-400">
              página de Plus
            </Link>
            ; conservará Plus hasta el final del período que ya pagó. No hay reembolsos ni prorrateo por períodos
            parciales.
          </>
        ),
      },
      {
        question: "¿Puedo compartir mi caso con mi abogado?",
        plainText:
          "Plus incluye un informe en PDF para su abogado: la línea de tiempo de su caso, el historial de estado y las explicaciones en un solo documento que puede enviar a su abogado o representante acreditado. Si todavía no tiene uno, Obtener ayuda enumera asistencia legal gratuita, representantes acreditados y abogados, gratis para todos.",
        answer: (
          <>
            Plus incluye un informe en PDF para su abogado: la línea de tiempo de su caso, el historial de estado y
            las explicaciones en un solo documento que puede enviar a su abogado o representante acreditado. Si
            todavía no tiene uno,{" "}
            <Link href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
              Obtener ayuda
            </Link>{" "}
            enumera asistencia legal gratuita, representantes acreditados y abogados, gratis para todos.
          </>
        ),
      },
    ],
  },
  {
    heading: "Privacidad y sus datos",
    faqs: [
      {
        question: "¿Cómo se protegen los datos de mi caso?",
        answer:
          "Los datos de su caso y de su cuenta están cifrados tanto en reposo como en tránsito. CaseWhy no vende ni alquila información personal a terceros, no utiliza los datos de su caso con fines publicitarios, y no muestra ningún tipo de publicidad — no existe ninguna red publicitaria a la que esos datos puedan llegar. Los datos se conservan mientras la cuenta esté activa; una cuenta inactiva no recibe un manejo distinto ni una eliminación anticipada. USCIS trata los números de recibo como información de identificación personal, y CaseWhy también: los números de recibo reciben cifrado adicional a nivel de aplicación antes de almacenarse, se usan únicamente para verificar el estado de su caso con USCIS (y, en Plus, para redactar cartas de escalamiento que deben incluirlos), y ningún miembro del personal de CaseWhy puede verlos en texto plano a través de ninguna herramienta administrativa.",
      },
      {
        question: "¿Qué pasa con mis datos si cancelo o elimino mi cuenta?",
        answer:
          "Si elimina su cuenta, los datos de su caso se eliminan de forma permanente dentro de 30 días. Usted puede acceder, corregir o eliminar sus datos en cualquier momento desde la configuración de la cuenta, o escribiendo a privacy@casewhy.com.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((group) =>
    group.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.plainText ?? (faq.answer as string) },
    }))
  ),
};

export default function FaqPageEs() {
  return (
    <PublicPage es={true} switcherHref="/faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h1 className="text-2xl font-bold tracking-tight">Preguntas frecuentes</h1>
      <p className="mb-8 mt-2 text-muted">
        Las preguntas más comunes sobre CaseWhy. Para más detalles, consulte los{" "}
        <a
          href="https://casewhy.com/terms.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Términos de Servicio
        </a>{" "}
        y la{" "}
        <a
          href="https://casewhy.com/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Política de Privacidad
        </a>{" "}
        (en inglés).
      </p>

      <div className="space-y-10">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">{group.heading}</h2>
            <div className="space-y-6">
              {group.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PublicPage>
  );
}
