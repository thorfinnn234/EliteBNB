import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Renders the public booking search surface used in the hero and closing CTA.
 * It keeps state locally and hands the selected values to /search as query data.
 */
export default function BookingSearchBar({ compact = false, label = "Search stays" }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    where: "",
    checkIn: "",
    checkOut: "",
    guests: "2",
  });

  /**
   * Keeps text/date input state in sync with the visible booking fields.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /**
   * Prevents invalid guest counts while preserving a normal numeric input.
   */
  const handleGuestsChange = (event) => {
    const value = Math.max(1, Number(event.target.value || 1));

    setFormData((previous) => ({
      ...previous,
      guests: String(value),
    }));
  };

  /**
   * Routes the user into the existing search page with explicit query values.
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    const params = new URLSearchParams();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    navigate(params.toString() ? `/search?${params.toString()}` : "/search");
  };

  return (
    <form
      className={`elite-booking-bar ${compact ? "elite-booking-bar--compact" : ""}`}
      aria-label={label}
      onSubmit={handleSubmit}
    >
      <label className="elite-booking-bar__field">
        <span>
          <MapPin size={15} aria-hidden="true" />
          Where
        </span>
        <input
          name="where"
          value={formData.where}
          onChange={handleChange}
          placeholder="City, coast or retreat"
        />
      </label>

      <label className="elite-booking-bar__field">
        <span>
          <CalendarDays size={15} aria-hidden="true" />
          Check in
        </span>
        <input
          type="date"
          name="checkIn"
          value={formData.checkIn}
          onChange={handleChange}
        />
      </label>

      <label className="elite-booking-bar__field">
        <span>
          <CalendarDays size={15} aria-hidden="true" />
          Check out
        </span>
        <input
          type="date"
          name="checkOut"
          value={formData.checkOut}
          onChange={handleChange}
        />
      </label>

      <label className="elite-booking-bar__field">
        <span>
          <Users size={15} aria-hidden="true" />
          Guests
        </span>
        <input
          type="number"
          name="guests"
          min="1"
          value={formData.guests}
          onChange={handleGuestsChange}
        />
      </label>

      <button type="submit" className="elite-booking-bar__button">
        <Search size={17} aria-hidden="true" />
        <span>Search</span>
      </button>
    </form>
  );
}
