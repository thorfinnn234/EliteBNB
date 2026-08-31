import { useEffect, useState } from "react";
import { propertyService } from "../../services/propertyService";
import api from "../../services/api";

export default function Calendar() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadHostProperties = async () => {
    try {
      setLoadingProperties(true);
      setError("");

      const response = await propertyService.getMyProperties();

      setProperties(response.data);

      if (response.data.length > 0) {
        setSelectedPropertyId(String(response.data[0].id));
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load your properties."
      );
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadAvailability = async (propertyId) => {
    if (!propertyId) return;

    try {
      setLoadingAvailability(true);
      setError("");

      const response = await api.get(
        `/properties/${propertyId}/availability`
      );

      // Ensure blockedDates is always an array
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setBlockedDates(data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load availability."
      );
      // Set to empty array on error
      setBlockedDates([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadHostProperties();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      const loadTimer = window.setTimeout(() => {
        loadAvailability(selectedPropertyId);
      }, 0);

      return () => window.clearTimeout(loadTimer);
    }
  }, [selectedPropertyId]);

  const handleBlockDates = async (event) => {
    event.preventDefault();

    if (!selectedPropertyId) {
      setError("Please select a property.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Start date and end date are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post(
        `/properties/${selectedPropertyId}/availability/block`,
        {
          startDate,
          endDate,
          reason,
        }
      );

      setStartDate("");
      setEndDate("");
      setReason("");

      await loadAvailability(selectedPropertyId);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to block these dates."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (blockId) => {
    const confirmed = window.confirm(
      "Make these dates available again?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/properties/${selectedPropertyId}/availability/${blockId}`
      );

      setBlockedDates((current) =>
        current.filter((block) => block.id !== blockId)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to unblock these dates."
      );
    }
  };

  return (
    <section className="min-h-[50vh] bg-[#FAF9F6] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            HOST
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#172554]">
            Calendar
          </h1>

          <p className="mt-2 text-[#64748B]">
            Control when your properties are available for guests.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingProperties ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-[#64748B]">
            Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
            <h2 className="text-lg font-bold text-[#172554]">
              No properties found
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Create a listing before managing availability.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#172554]">
                Block dates
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Prevent guests from booking a property during a specific period.
              </p>

              <form
                onSubmit={handleBlockDates}
                className="mt-6 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Property
                  </label>

                  <select
                    value={selectedPropertyId}
                    onChange={(event) =>
                      setSelectedPropertyId(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#172554]"
                  >
                    {properties.map((property) => (
                      <option
                        key={property.id}
                        value={property.id}
                      >
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Start date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#172554]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    End date
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#172554]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Reason
                  </label>

                  <textarea
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    placeholder="Maintenance, owner stay, renovation..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#172554]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#172554] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting
                    ? "Blocking..."
                    : "Block dates"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#172554]">
                    Blocked periods
                  </h2>

                  <p className="mt-1 text-sm text-[#64748B]">
                    These dates cannot currently be booked by guests.
                  </p>
                </div>

                <span className="rounded-full bg-[#FAF9F6] px-3 py-1 text-xs font-semibold text-[#172554]">
                  {blockedDates.length} blocked
                </span>
              </div>

              {loadingAvailability ? (
                <div className="py-12 text-center text-[#64748B]">
                  Loading availability...
                </div>
              ) : blockedDates.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[#D1D5DB] p-8 text-center">
                  <p className="font-semibold text-[#172554]">
                    No blocked dates
                  </p>

                  <p className="mt-1 text-sm text-[#64748B]">
                    This property is currently open for booking.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {blockedDates.map((block) => (
                    <div
                      key={block.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[#E5E7EB] p-5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-semibold text-[#172554]">
                          {block.startDate} → {block.endDate}
                        </p>

                        <p className="mt-1 text-sm text-[#64748B]">
                          {block.reason ||
                            "No reason provided"}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          handleUnblock(block.id)
                        }
                        className="rounded-xl border border-[#D4A72C] px-4 py-2 text-sm font-semibold text-[#172554] transition hover:bg-[#FAF9F6]"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
