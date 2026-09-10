import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import {
  HOST_LIFECYCLE_STATES,
  useHostLifecycle,
} from "../../hooks/useHostLifecycle";

/**
 * Frontend UX guard for Host business routes.
 * This is not a security boundary: the backend still authorizes every Host API
 * call. The guard simply avoids mounting business pages for unverified Hosts
 * and redirects them to the lifecycle experience instead of a wall of 403s.
 */
export default function HostLifecycleGate({ children }) {
  const location = useLocation();
  const { error, lifecycleState, loading, refreshLifecycle } = useHostLifecycle();

  if (loading || lifecycleState === HOST_LIFECYCLE_STATES.LOADING) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] p-5 md:p-8">
        <section className="mx-auto flex min-h-[24rem] max-w-3xl items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
          <div>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#D4A72C]" />
            <p className="mt-4 text-sm font-bold text-[#64748B]">
              Checking Host verification access...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] p-5 md:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={24} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#D4A72C]">
                Host lifecycle
              </p>
              <h1 className="mt-2 text-2xl font-black text-[#172554]">
                We could not confirm verification access.
              </h1>
              <p className="mt-3 text-sm leading-7 text-[#64748B]">{error}</p>
              <button
                type="button"
                onClick={refreshLifecycle}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#172554]/15 bg-[#172554] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#0f1e48]"
              >
                <RefreshCw size={15} aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (lifecycleState !== HOST_LIFECYCLE_STATES.VERIFIED) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/host/verification"
      />
    );
  }

  return children;
}
