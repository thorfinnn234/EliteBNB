import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Offers frontend discovery shortcuts that map cleanly to the existing search
 * route. These are presentation filters until the backend search contract is
 * formalized.
 */
export default function DiscoveryChips({ searchPath = "/search", shortcuts }) {
  return (
    <div className="elite-discovery-chips">
      {shortcuts.map((shortcut) => (
        <Link
          to={`${searchPath}?category=${encodeURIComponent(shortcut.query)}`}
          className="elite-discovery-chip"
          key={shortcut.query}
        >
          <span>
            <strong>{shortcut.label}</strong>
            <small>{shortcut.description}</small>
          </span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
