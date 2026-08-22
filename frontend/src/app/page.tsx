export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 py-16 text-zinc-900">
      <section className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Portfolio CMS</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Resume editor MVP</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600">Create structured resume content, preview the Minimal template live, publish it locally, and save it as a PDF.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/admin/resume" className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">Open resume editor</a>
          <a href="/resume" className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50">View public resume</a>
        </div>
      </section>
    </main>
  );
}
