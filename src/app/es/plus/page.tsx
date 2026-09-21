import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site/metadata";
import Link from "next/link";
import { auth } from "@/lib/auth/server";
import { getSubscriptionDetails } from "@/lib/billing/tier";
import { getLiveSubscriptionDetail } from "@/lib/billing/live-subscription";
import {
  getAllEffectivePrices,
  type EffectivePrice,
  type PlanId,
} from "@/lib/billing/pricing";
import { startCheckout } from "@/app/plus/actions";
import { ShareButton } from "@/components/ShareButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PlusBadge } from "@/components/PlusBadge";
import { FormSubmitButton } from "@/components/FormSubmitButton";

// Round 79 — Spanish translation of /plus. Reuses the real Stripe actions
// and pricing/subscription logic from the English page as-is (business
// logic, not copy) — only the visible text is translated. One known,
// flagged limitation: startCheckout/openBillingPortal's redirect URLs are
// hardcoded to /plus (English), not locale-aware — a Spanish-page visitor
// completing checkout lands back on the English page's success/cancel
// banner. Not changed here: those functions handle real Stripe payment
// flows already live in production, and making them locale-aware is a
// real code change to payment-critical code, out of this round's static-
// copy scope. Flagged in CLOUD_CLAUDE.md, not silently shipped.
export const metadata: Metadata = pageMetadata("/es/plus", {
  title: "CaseWhy Plus — Precios y Funciones | CaseWhy",
  description:
    "Compara los niveles gratuito y Plus de CaseWhy — múltiples casos rastreados, notificaciones más rápidas y preguntas ilimitadas de IA sobre tu caso.",

  locale: "es",
  languages: {
    en: "https://app.casewhy.com/plus",
    es: "https://app.casewhy.com/es/plus",
  },
});

interface PlusFeature {
  id: string;
  title: string;
  free: string;
  plus: string;
  explanation: string;
}

const PLUS_FEATURES: PlusFeature[] = [
  {
    id: "ai-chat",
    title: "Chat con IA sobre tu caso específico",
    free: "—",
    plus: "Ilimitado",
    explanation:
      'Tu estado acaba de cambiar a "Solicitud de Evidencia" y no sabes qué significa, si tu cronograma se reinició, o qué es lo que USCIS realmente quiere — para eso es exactamente este chat. A diferencia de la herramienta gratuita Ask CaseWhy de la página Obtener ayuda, que no requiere iniciar sesión, este chat conoce tu caso rastreado real — su estado en vivo, su historial, su contexto específico del recibo — no solo la política de USCIS en abstracto. Pregunta en lenguaje sencillo y obtén una respuesta basada en la propia base de conocimiento de políticas y jurisprudencia de CaseWhy y en tu recibo específico rastreado, con citas visibles que puedes verificar tú mismo, en lugar de un chatbot genérico adivinando. Plus desbloquea preguntas ilimitadas sobre tu propio caso rastreado, para que puedas preguntar en el momento en que te preocupe, sin tener que racionar un puñado al mes.',
  },
  {
    id: "explanation-depth",
    title: "Explicaciones del caso a fondo",
    free: "Lo básico",
    plus: "A fondo",
    explanation:
      "Toda cuenta, gratuita o Plus, recibe una explicación completa y honesta en lenguaje sencillo de lo que significa un estado y si hay motivo de preocupación — esa respuesta básica nunca se retiene. Plus agrega la capa adicional: próximos pasos probables específicos de este caso, antecedentes de política citados que puedes verificar tú mismo, y — cuando una política real o un fallo judicial coincide con los hechos propios de tu caso — respuestas con un clic a \"¿Aplica a mi caso?\" y \"¿Cómo aplica a mi caso?\", fundamentadas en esa política específica, no en una suposición genérica. La misma explicación subyacente, con más de ella visible.",
  },
  {
    id: "tracked-cases",
    title: "Casos rastreados (familia)",
    free: "3",
    plus: "Ilimitado",
    explanation:
      "Una cuenta gratuita rastrea hasta 3 casos — suficiente para la mayoría de las personas, pero los hogares más grandes o complejos necesitan más: el I-485 de tu cónyuge junto al tuyo, los casos derivados de tus hijos, o los padres a quienes ayudas con un N-400 que entiendes mejor que ellos. Plus ofrece seguimiento ilimitado de casos para tu familia — sin límite fijo — para que todo el hogar viva bajo un solo inicio de sesión en lugar de que cada quien cree cuentas separadas (y suscripciones separadas) solo para ver su propio estado. Cada caso obtiene su propia experiencia completa de CaseWhy — su propio historial de estado, sus propias explicaciones de IA, su propia bóveda de documentos — y puedes cambiar entre ellos con un solo clic, sin tener que volver a ingresarlos desde cero. Rastrear más de 10 casos a la vez es lo suficientemente inusual como para que pidamos una revisión rápida y única antes de que se active — la mayoría de los hogares nunca ven este paso, y es una revisión, no un rechazo.",
  },
  {
    id: "on-demand-checks",
    title: "Revisiones de estado bajo demanda",
    free: "—",
    plus: "Incluido",
    explanation:
      'Cada cuenta, gratuita o Plus, recibe una revisión automática de estado una vez al día. La mayoría de los días eso es suficiente — pero el día en que tu caso realmente pudo haber avanzado no es la mayoría de los días. Plus agrega un botón real de "Revisar ahora" directamente en el panel para exactamente ese momento: escuchaste que algo cambió, o simplemente ha estado en silencio demasiado tiempo y quieres saberlo ahora mismo en lugar de esperar la revisión programada de mañana. Consulta a USCIS directamente, de la misma forma que lo hace la revisión diaria, solo que según tu propio horario en lugar de uno fijo.',
  },
  {
    id: "document-vault",
    title: "Bóveda segura de documentos",
    free: "—",
    plus: "Incluido",
    explanation:
      "Llega una RFE con una fecha límite y una lista de documentos que USCIS quiere — recibos de nómina, un nuevo I-693, un acta de matrimonio, lo que sea. La bóveda es donde los colocas a medida que los reúnes, vinculados a ese caso específico, cifrados y privados para tu cuenta (respaldados por el almacenamiento privado Blob de Vercel, no una carpeta compartida). Es más útil justo en el momento en que las cosas se ponen estresantes: en lugar de una carpeta de descargas llena de escaneos que nunca volverás a encontrar, todo lo relacionado con un caso vive en un solo lugar — genuinamente útil si alguna vez necesitas entregarle un caso a un abogado y no quieres volver a reunir todo desde cero.",
  },
  {
    id: "stalled-case-alert",
    title: "Alerta de caso estancado",
    free: "—",
    plus: "Incluido",
    explanation:
      "CaseWhy marca un caso que se ha quedado inusualmente en silencio en relación con un punto de referencia real — no una suposición, sino cuánto tiempo suelen tardar casos como el tuyo antes del siguiente paso real. Plus desbloquea la alerta junto con las dos herramientas de escalamiento que la siguen — búsqueda de representante y redacción de cartas, ambas abajo — para que en el momento en que te enteres de que un caso podría estar estancado, ya tengas próximos pasos reales en mano, no solo la noticia.",
  },
  {
    id: "representative-lookup",
    title: "Búsqueda de representante",
    free: "—",
    plus: "Incluido",
    explanation:
      'Una vez que un caso se marca como estancado, el primer instinto de muchas personas es "¿puede ayudarme mi representante en el Congreso con esto?" — y la mayoría en realidad no sabe quién es, o tiene un nombre desactualizado de hace años. Ingresa tu dirección y CaseWhy busca tus Senadores y Representante de la Cámara reales y actuales — extraídos de datos gubernamentales en vivo, no de una lista estática que queda obsoleta después de cada elección — como un punto de partida genuino para una consulta al Congreso, una de las formas más efectivas en la práctica de lograr que revisen un caso estancado.',
  },
  {
    id: "escalation-letters",
    title: "Redacción de cartas de escalamiento",
    free: "—",
    plus: "Incluido",
    explanation:
      "Saber a quién contactar es un problema; saber qué escribir realmente es otro. Plus puede redactar una de tres cartas reales — una consulta al Congreso dirigida al representante que acabas de buscar, un seguimiento a tu oficina local específica, o una solicitud formal de asistencia de caso al Ombudsman de USCIS — prellenada con los detalles reales de tu caso para que no te quedes mirando una página en blanco. Esto deliberadamente no es asesoría legal: cada borrador se prueba de forma adversarial para negarse a inventar afirmaciones o exagerar tu situación, y es un punto de partida que tú revisas, editas y envías, no algo que CaseWhy envía en tu nombre.",
  },
  {
    id: "pdf-report",
    title: "Reporte en PDF para el abogado",
    free: "—",
    plus: "Incluido",
    explanation:
      'Si un caso llega al punto en que realmente necesitas un abogado, la primera reunión normalmente comienza contigo volviendo a explicar todo desde el principio mientras ellos toman notas. Esto genera en su lugar un PDF real de una página — el estado actual de tu caso y la propia explicación en lenguaje sencillo de CaseWhy, lista para entregar o adjuntar a un correo — para que esa primera conversación comience desde "así están las cosas" en lugar de empezar desde cero.',
  },
];

function FeatureRow({
  id,
  title,
  free,
  plus,
}: {
  id: string;
  title: string;
  free: string;
  plus: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border py-4 text-sm last:border-b-0 sm:grid-cols-[1fr_140px_140px]">
      <a
        href={`#${id}`}
        className="font-medium text-foreground/90 hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
      >
        {title}
      </a>
      <span className="text-center text-muted">{free}</span>
      <span className="text-center font-semibold text-brand-600 dark:text-brand-400">
        {plus}
      </span>
    </div>
  );
}

const PLAN_PERIOD_LABEL: Record<PlanId, string> = {
  plus_monthly: "/ mes",
  plus_6month: "/ 6 meses",
  plus_annual: "/ año",
};

const PLAN_MONTHS: Record<PlanId, number> = {
  plus_monthly: 1,
  plus_6month: 6,
  plus_annual: 12,
};

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function PlanCard({
  planId,
  price,
  canSubscribe,
}: {
  planId: PlanId;
  price: EffectivePrice;
  canSubscribe: boolean;
}) {
  const perMonth = price.priceCents / PLAN_MONTHS[planId];
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-muted">
        {planId === "plus_monthly"
          ? "Mensual"
          : planId === "plus_6month"
            ? "Cada 6 meses"
            : "Anual"}
      </p>
      <p className="mt-1">
        <span className="font-mono text-2xl font-bold text-foreground">
          ${formatDollars(price.priceCents)}
        </span>{" "}
        <span className="text-sm text-muted">{PLAN_PERIOD_LABEL[planId]}</span>
      </p>
      <p className="mt-1 text-xs text-muted">
        ${formatDollars(perMonth)} / mes equivalente
      </p>
      {price.appliedRuleLabel && (
        <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
          {price.appliedRuleLabel}
        </p>
      )}
      {canSubscribe && (
        <form action={startCheckout.bind(null, planId)} className="mt-4">
          <FormSubmitButton
            pendingLabel="Iniciando pago…"
            waitingLabel="Aún esperando a Stripe…"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Suscribirse
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <p className="font-semibold">{q}</p>
      <p className="mt-1.5 text-sm text-muted">{a}</p>
    </div>
  );
}

export default async function PlusPageEs({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const { data: session } = await auth.getSession();
  const details = session?.user
    ? await getSubscriptionDetails(session.user.id)
    : null;
  const isPlus = details?.tier === "plus";
  const prices = await getAllEffectivePrices();
  const liveDetail =
    isPlus && details?.stripeSubscriptionId
      ? await getLiveSubscriptionDetail(details.stripeSubscriptionId)
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <LanguageSwitcher es={true} href="/plus" />

      {checkout === "success" && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          Estás suscrito a CaseWhy Plus. Puede tardar unos segundos en
          desbloquearse cada función.
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="mb-6 rounded-xl border border-border-strong bg-surface-2 p-4 text-sm text-muted">
          El pago fue cancelado — no se realizó ningún cargo.
        </div>
      )}

      <h1 className="text-3xl font-bold tracking-tight">
        CaseWhy <PlusBadge size="lg" />
      </h1>
      <p className="mb-2 mt-2 text-lg text-muted">
        Chat fundamentado en la propia política de USCIS y en el recibo
        específico que estás siguiendo — no un chatbot genérico adivinando —
        más el kit de herramientas de escalamiento para cuando se estanca.
        Para ti y toda tu familia.
      </p>
      <div className="mt-4">
        <ShareButton
          url="https://app.casewhy.com/es/plus"
          title="CaseWhy Plus"
          text="Rastrea los casos de USCIS de toda tu familia con chat de IA fundamentado en la propia política de USCIS — no un chatbot genérico adivinando — CaseWhy Plus."
          es
        />
      </div>

      {isPlus && liveDetail && (
        <div className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-brand-700 dark:text-brand-400">
          Tienes CaseWhy Plus desde el{" "}
          {liveDetail.startDate.toLocaleDateString("es")}.
        </div>
      )}

      {isPlus && details?.cancelAtPeriodEnd && details.currentPeriodEnd && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Tu suscripción está programada para cancelarse el{" "}
          {details.currentPeriodEnd.toLocaleDateString("es")}. Mantendrás acceso
          completo hasta entonces.
        </div>
      )}
      {isPlus && details?.status === "past_due" && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          Tu último pago no se completó. Actualiza tu método de pago para
          mantener tu suscripción activa.
        </div>
      )}

      {isPlus ? (
        <div className="mt-6">
          <Link
            href="/es/plus/manage"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Administrar plan
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PlanCard
              planId="plus_monthly"
              price={prices.plus_monthly}
              canSubscribe={!!session?.user}
            />
            <PlanCard
              planId="plus_6month"
              price={prices.plus_6month}
              canSubscribe={!!session?.user}
            />
            <PlanCard
              planId="plus_annual"
              price={prices.plus_annual}
              canSubscribe={!!session?.user}
            />
          </div>
          {!session?.user && (
            <div className="mt-4">
              <Link
                href="/auth/sign-in?lang=es"
                className="inline-block rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Inicia sesión para suscribirte
              </Link>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">
            Cancela cuando quieras y mantendrás el acceso hasta el final de tu
            período de facturación actual — sin reembolso por tiempo no
            usado. Cambiar entre planes más adelante se prorratea
            automáticamente.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Fundamentado en política y en tu caso, no en suposiciones
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Cada respuesta está fundamentada en la propia política de
                USCIS y en el recibo específico que estás siguiendo — no un
                chatbot genérico adivinando. Haz todas las preguntas que
                necesites, en el momento en que tu caso cambie.
              </p>
              <a
                href="#ai-chat"
                className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver cómo funciona →
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Sabe en el momento en que un caso se estanca
              </p>
              <p className="mt-1.5 text-sm text-muted">
                CaseWhy marca un caso que se ha quedado inusualmente en
                silencio frente a un punto de referencia real de USCIS — no
                una suposición — para que te enteres en el momento en que
                ocurre, en lugar de notarlo por tu cuenta meses después.
              </p>
              <a
                href="#stalled-case-alert"
                className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver cómo funciona →
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Un kit de herramientas de escalamiento real
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Cuando un caso se estanca, encuentra a tu representante real en
                el Congreso y redacta una carta de escalamiento real —
                prellenada con los detalles de tu caso, no una página en blanco.
              </p>
              <a
                href="#escalation-letters"
                className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver cómo funciona →
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                &quot;¿Aplica a mi caso?&quot; — respondido
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Cuando una política real o un fallo judicial coincide con los
                hechos propios de tu caso, obtén una respuesta con un clic a
                &quot;¿Aplica a mi caso?&quot; y &quot;¿Cómo aplica a mi
                caso?&quot; — fundamentada en esa política específica, no en
                una suposición genérica.
              </p>
              <a
                href="#explanation-depth"
                className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Ver cómo funciona →
              </a>
            </div>
          </div>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border-strong pb-3 text-xs font-semibold uppercase tracking-widest text-muted sm:grid-cols-[1fr_140px_140px]">
          <span></span>
          <span className="text-center">
            Gratis
            {!isPlus && session?.user && (
              <span className="mt-1 block text-[9px] font-semibold normal-case tracking-normal text-brand-600 dark:text-brand-400">
                tu plan
              </span>
            )}
          </span>
          <span className="text-center">
            <PlusBadge size="sm" />
            {isPlus && (
              <span className="mt-1 block text-[9px] font-semibold normal-case tracking-normal text-brand-600 dark:text-brand-400">
                tu plan
              </span>
            )}
          </span>
        </div>
        {PLUS_FEATURES.map((feature) => (
          <FeatureRow
            key={feature.id}
            id={feature.id}
            title={feature.title}
            free={feature.free}
            plus={feature.plus}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        <Link
          href="/es/get-help"
          className="text-brand-600 hover:underline dark:text-brand-400"
        >
          Obtener Ayuda
        </Link>{" "}
        — encontrar un abogado o representante acreditado — también es gratis en
        todos los niveles, no es un beneficio de Plus.
      </p>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">
          <PlusBadge size="lg" /> en detalle
        </h2>
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface px-6">
          {PLUS_FEATURES.map((feature) => (
            <div key={feature.id} id={feature.id} className="scroll-mt-20 py-4">
              <p className="font-semibold">{feature.title}</p>
              <p className="mt-1.5 text-sm text-muted">{feature.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Preguntas</h2>
        <div className="mt-3">
          <FaqItem
            q="¿Puedo cancelar en cualquier momento?"
            a="Sí — administra tu suscripción cuando quieras desde esta página. Cancelar mantiene tu acceso a Plus hasta el final del período que ya pagaste, y luego vuelve al nivel gratuito. Nada de lo que hayas rastreado o subido se elimina."
          />
          <FaqItem
            q="¿Qué pasa si vuelvo al nivel gratuito?"
            a="Tu cuenta y cualquier caso más allá del límite del nivel gratuito permanecen en tu cuenta — simplemente no podrás interactuar con ellos más allá de los límites del nivel gratuito hasta que vuelvas a suscribirte."
          />
          <FaqItem
            q="¿El kit de herramientas de escalamiento es asesoría legal?"
            a="No. CaseWhy no es un despacho de abogados y no brinda asesoría legal. Las herramientas de búsqueda de representante y redacción de cartas organizan y dan formato a la información que proporcionas — nunca generan conclusiones legales ni garantizan un resultado. Para algo específico a tu caso, consulta a un abogado de inmigración con licencia."
          />
        </div>
      </div>
    </main>
  );
}
