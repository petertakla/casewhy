import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

// Round 97 item 3 — Spanish translation of /faq (round 73), which never
// got one despite rounds 78-83 covering the landing page, /plus, Get
// Help, auth, the app shell, and processing-times/visa-bulletin/news.
// Same content as faq/page.tsx, kept in sync by hand (no shared data
// source between the two — same tradeoff round 79 already made for
// /es/plus, flagged there rather than solved generically). Formal
// "usted" register per round 81's decision (the round 81 manifest itself
// is mostly tú/neutral so far — this is new content following the
// decided target register, not a retrofit of existing strings).

export const metadata: Metadata = {
  title: "Preguntas Frecuentes | CaseWhy",
  description:
    "Respuestas a las preguntas más comunes sobre CaseWhy — afiliación con USCIS, precios, asesoría legal y cómo se protegen los datos de su caso.",
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

const FAQS: Faq[] = [
  {
    question: "¿CaseWhy está afiliado a USCIS?",
    answer:
      "No. CaseWhy no está afiliado con USCIS, el Departamento de Seguridad Nacional (DHS) ni ninguna otra agencia gubernamental, y no cuenta con su respaldo ni es operado por ellos. CaseWhy muestra información obtenida de sistemas gubernamentales públicos, pero no controla esos datos y no puede garantizar su exactitud, integridad ni actualidad.",
  },
  {
    question: "¿CaseWhy es realmente gratis?",
    plainText:
      "CaseWhy tiene un nivel gratuito — hasta tres casos rastreados, una línea de tiempo de estado, explicaciones en lenguaje sencillo generadas por IA, y tres preguntas de IA sobre su caso cada mes — además de un nivel Plus opcional y de pago para rastrear más casos, preguntas ilimitadas y otras funciones adicionales (consulte la página de Plus para ver los precios actuales). Obtener ayuda — los directorios de CaseWhy de asistencia legal gratuita, representantes acreditados, abogados y otros recursos — es gratis para todos, siempre, sin importar la suscripción: sin tarifas, sin anuncios, sin costos ocultos.",
    answer: (
      <>
        CaseWhy tiene un nivel gratuito — hasta tres casos rastreados, una línea de tiempo de estado, explicaciones
        en lenguaje sencillo generadas por IA, y tres preguntas de IA sobre su caso cada mes — además de un nivel
        Plus opcional y de pago para rastrear más casos, preguntas ilimitadas y otras funciones adicionales (consulte
        la{" "}
        <Link href="/es/plus" className="text-brand-600 hover:underline dark:text-brand-400">
          página de Plus
        </Link>{" "}
        para ver los precios actuales).{" "}
        <Link href="/es/get-help" className="text-brand-600 hover:underline dark:text-brand-400">
          Obtener ayuda
        </Link>{" "}
        — los directorios de CaseWhy de asistencia legal gratuita, representantes acreditados, abogados y otros
        recursos — es gratis para todos, siempre, sin importar la suscripción: sin tarifas, sin anuncios, sin costos
        ocultos.
      </>
    ),
  },
  {
    question: "¿Algo de lo que CaseWhy me dice es asesoría legal?",
    plainText:
      "No. CaseWhy no es un despacho de abogados, no ofrece asesoría legal, y su uso no crea ningún tipo de relación abogado-cliente. Las explicaciones sobre el estado de su caso, las respuestas del chat de IA, las estimaciones de tiempos de procesamiento, la información del boletín de visas y la ayuda para redactar cartas de escalamiento son todo contenido general e informativo obtenido de materiales públicos de USCIS — que describen lo que un estado o proceso generalmente significa, nunca una conclusión sobre lo que usted, específicamente, debería hacer con su caso. Para los casos de asilo (I-589) y DACA (I-821D) en particular, CaseWhy nunca le dirá si usted califica para algún alivio ni predecirá el resultado de su caso — solo un abogado de inmigración con licencia o un representante acreditado puede hacerlo, y CaseWhy lo referirá a uno cada vez que una pregunta dependa de los hechos específicos de su caso.",
    answer: (
      <>
        No. CaseWhy no es un despacho de abogados, no ofrece asesoría legal, y su uso no crea ningún tipo de relación
        abogado-cliente. Las explicaciones sobre el estado de su caso, las respuestas del chat de IA,{" "}
        <Link href="/processing-times" className="text-brand-600 hover:underline dark:text-brand-400">
          las estimaciones de tiempos de procesamiento
        </Link>
        ,{" "}
        <Link href="/visa-bulletin" className="text-brand-600 hover:underline dark:text-brand-400">
          la información del boletín de visas
        </Link>{" "}
        y la ayuda para redactar cartas de escalamiento son todo contenido general e informativo obtenido de
        materiales públicos de USCIS — que describen lo que un estado o proceso generalmente significa, nunca una
        conclusión sobre lo que usted, específicamente, debería hacer con su caso. Para los casos de asilo (I-589) y
        DACA (I-821D) en particular, CaseWhy nunca le dirá si usted califica para algún alivio ni predecirá el
        resultado de su caso — solo un abogado de inmigración con licencia o un representante acreditado puede
        hacerlo, y CaseWhy lo referirá a uno cada vez que una pregunta dependa de los hechos específicos de su caso.
      </>
    ),
  },
  {
    question: "¿Cómo se protegen los datos de mi caso?",
    answer:
      "Los datos de su caso y de su cuenta están cifrados tanto en reposo como en tránsito. CaseWhy no vende ni alquila información personal a terceros, no utiliza los datos de su caso con fines publicitarios, y no muestra ningún tipo de publicidad — no existe ninguna red publicitaria a la que esos datos puedan llegar. Los datos se conservan mientras la cuenta esté activa; una cuenta inactiva no recibe un manejo distinto ni una eliminación anticipada.",
  },
  {
    question: "¿Qué pasa con mis datos si cancelo o elimino mi cuenta?",
    answer:
      "Si elimina su cuenta, los datos de su caso se eliminan de forma permanente dentro de 30 días. Usted puede acceder, corregir o eliminar sus datos en cualquier momento desde la configuración de la cuenta, o escribiendo a privacy@casewhy.com.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.plainText ?? (faq.answer as string) },
  })),
};

export default function FaqPageEs() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mb-6 text-right text-sm">
        <Link href="/faq" hrefLang="en" lang="en" className="text-brand-600 hover:underline dark:text-brand-400">
          English
        </Link>
      </div>

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

      <div className="space-y-6">
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h2 className="text-base font-semibold text-foreground">{faq.question}</h2>
            <p className="mt-2 text-sm text-muted">{faq.answer}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        ¿Tiene una pregunta que esto no responde? Consulte el{" "}
        <Link href="/sitemap" className="text-brand-600 hover:underline dark:text-brand-400">
          índice del sitio
        </Link>{" "}
        o escriba a{" "}
        <a href="mailto:hello@casewhy.com" className="text-brand-600 hover:underline dark:text-brand-400">
          hello@casewhy.com
        </a>
        .
      </p>
    </main>
  );
}
