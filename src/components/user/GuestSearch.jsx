import { CalendarDays, MapPin, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialSearch = {
  destination: "",
  checkIn: "",
  checkOut: "",
  guests: "2",
};

/**
 * Builds query parameters from filled search fields only.
 * Keeping this small helper separate makes the future API/search contract swap
 * easier without changing the visual form component.
 */
function buildSearchParams(searchState) {
  const params = new URLSearchParams();

  Object.entries(searchState).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}

/**
 * Provides the authenticated guest search entry point.
 * It navigates to the existing public `/search` route with query parameters
 * instead of inventing a dashboard-only search endpoint.
 */
export default function GuestSearch({ initialValues, searchPath = "/search" }) {
  const [searchState, setSearchState] = useState(() => ({
    ...initialSearch,
    ...initialValues,
  }));
  const navigate = useNavigate();

  /**
   * Updates a single form field while preserving the rest of the search state.
   * The input `name` attributes intentionally match the query parameter keys.
   */
  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setSearchState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  };

  /**
   * Sends the guest to the reusable search route with whatever filters they
   * provided. Empty filters are omitted so `/search` still works as a broad
   * discovery entry point.
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const queryString = buildSearchParams(searchState);
    navigate(queryString ? `${searchPath}?${queryString}` : searchPath);
  };

  return (
    <form className="elite-guest-search" onSubmit={handleSubmit}>
      <div className="elite-guest-search__field elite-guest-search__field--destination">
        <label htmlFor="guest-search-destination">
          <MapPin size={15} aria-hidden="true" />
          Destination
        </label>
        <input
          id="guest-search-destination"
          name="destination"
          type="search"
          value={searchState.destination}
          onChange={handleFieldChange}
          placeholder="Where to next?"
        />
      </div>

      <div className="elite-guest-search__field">
        <label htmlFor="guest-search-check-in">
          <CalendarDays size={15} aria-hidden="true" />
          Check in
        </label>
        <input
          id="guest-search-check-in"
          name="checkIn"
          type="date"
          value={searchState.checkIn}
          onChange={handleFieldChange}
        />
      </div>

      <div className="elite-guest-search__field">
        <label htmlFor="guest-search-check-out">
          <CalendarDays size={15} aria-hidden="true" />
          Check out
        </label>
        <input
          id="guest-search-check-out"
          name="checkOut"
          type="date"
          value={searchState.checkOut}
          onChange={handleFieldChange}
        />
      </div>

      <div className="elite-guest-search__field">
        <label htmlFor="guest-search-guests">
          <UsersRound size={15} aria-hidden="true" />
          Guests
        </label>
        <select
          id="guest-search-guests"
          name="guests"
          value={searchState.guests}
          onChange={handleFieldChange}
        >
          <option value="1">1 guest</option>
          <option value="2">2 guests</option>
          <option value="3">3 guests</option>
          <option value="4">4 guests</option>
          <option value="5">5 guests</option>
          <option value="6">6 guests</option>
        </select>
      </div>

      <button type="submit" className="elite-guest-search__submit">
        <Search size={18} aria-hidden="true" />
        <span>Search</span>
      </button>
    </form>
  );
}
