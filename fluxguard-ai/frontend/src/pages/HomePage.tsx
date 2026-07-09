import { Loading } from '@/components/Loading';

export function HomePage() {
  return (
    <section aria-labelledby="home-title" className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-risk-medium">
          Production foundation
        </p>
        <h1 id="home-title" className="max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl">
          Predictive crowd orchestration for safer event operations.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-700">
          FluxGuard AI will forecast crowd congestion and support role-specific operational
          guidance. Dashboard features, simulation, ML, and Claude integration will be added in
          later implementation phases.
        </p>
      </div>
      <Loading label="Foundation ready" />
    </section>
  );
}
