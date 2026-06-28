export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
        The <span className="font-medium text-slate-500">{title}</span> module
        UI is not built yet. The backend endpoints are ready under
        <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
          /api/{title.toLowerCase()}
        </code>
        .
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">This page does not exist.</p>
    </div>
  );
}
