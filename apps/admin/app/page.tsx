export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Help Platform Admin
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">综合性互助平台管理后台</p>
        <a
          href="/api/health"
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          API Health Check
        </a>
      </main>
    </div>
  );
}
