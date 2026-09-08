import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

/**
 * Shared viewport-fixed modal primitive for feature dialogs that do not need a
 * custom visual treatment. The overlay locks background scroll while open and
 * lets long dialog content scroll inside the panel instead of appearing above
 * or below the current viewport.
 */
export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-black/45 p-4">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xl text-[#64748B] hover:bg-slate-100"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="border-t border-[#E5E7EB] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
