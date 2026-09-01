import {
  LogOut,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import EliteLogo from "../public/EliteLogo";
import {
  primaryHostNavItems,
  secondaryHostNavItems,
} from "./hostNavigation";
import "./HostShell.css";

/**
 * Renders the Host-specific navigation rail so visual refinements do not leak
 * into the shared User/Admin sidebar. It receives only layout callbacks and
 * keeps every existing Host destination intact.
 */
export default function HostSidebar({
  open = false,
  previewMode = false,
  activePath = "/host/dashboard",
  onClose,
  onLogout,
  onPreviewSelect,
}) {
  return (
    <aside
      className={`elite-host-sidebar ${open ? "is-open" : ""}`}
      aria-label="Host navigation"
    >
      <div className="elite-host-sidebar__brand">
        <EliteLogo variant="mark" label="EliteBNB host workspace" />

        <div className="elite-host-sidebar__brand-copy">
          <span className="elite-host-sidebar__brand-title">
            EliteBNB
          </span>
          <span className="elite-host-sidebar__brand-subtitle">
            Host operations
          </span>
        </div>

        <button
          type="button"
          className="elite-host-sidebar__close"
          onClick={onClose}
          aria-label="Close host navigation"
        >
          <X size={17} strokeWidth={1.8} />
        </button>
      </div>

      <nav className="elite-host-sidebar__nav" aria-label="Host workspace">
        <HostNavGroup
          items={primaryHostNavItems}
          previewMode={previewMode}
          activePath={activePath}
          onSelect={onClose}
          onPreviewSelect={onPreviewSelect}
        />

        <p className="elite-host-sidebar__group-label">Guest desk</p>

        <HostNavGroup
          items={secondaryHostNavItems}
          previewMode={previewMode}
          activePath={activePath}
          onSelect={onClose}
          onPreviewSelect={onPreviewSelect}
        />
      </nav>

      <div className="elite-host-sidebar__footer">
        <button
          type="button"
          className="elite-host-sidebar__logout"
          onClick={onLogout}
        >
          <LogOut size={19} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/**
 * Maps a configured Host navigation group into accessible links with active
 * route styling handled by React Router rather than manual path checks.
 */
function HostNavGroup({
  items,
  previewMode,
  activePath,
  onSelect,
  onPreviewSelect,
}) {
  return items.map((item) => {
    const Icon = item.icon;

    if (previewMode) {
      const active = item.to === activePath;

      return (
        <button
          key={item.to}
          type="button"
          onClick={() => {
            onPreviewSelect?.(item);
            onSelect?.();
          }}
          className={`elite-host-sidebar__link ${active ? "is-active" : ""}`}
        >
          <HostNavItemContent item={item} Icon={Icon} />
        </button>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={onSelect}
        className={({ isActive }) =>
          `elite-host-sidebar__link ${isActive ? "is-active" : ""}`
        }
      >
        <HostNavItemContent item={item} Icon={Icon} />
      </NavLink>
    );
  });
}

/**
 * Keeps Host nav item contents shared between real links and preview buttons
 * so the visual treatment stays identical in both contexts.
 */
function HostNavItemContent({ item, Icon }) {
  return (
    <>
      <span className="elite-host-sidebar__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.9} />
      </span>

      <span>
        <span className="elite-host-sidebar__label">{item.label}</span>
        <span className="elite-host-sidebar__meta">{item.meta}</span>
      </span>
    </>
  );
}
