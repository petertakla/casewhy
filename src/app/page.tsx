export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-500 mb-4">
        CaseWhy
      </p>
      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-2xl text-balance">
        Understand your USCIS case, not just its status.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        Track your case automatically and get plain-English explanations of
        what each status update actually means for your timeline.
      </p>

      <form className="mt-8 flex w-full max-w-md flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Get notified at launch
        </button>
      </form>

      <p className="mt-4 text-xs text-neutral-500">
        No spam. We&apos;ll only email you when CaseWhy is ready to try.
      </p>
    </main>
  );
}
