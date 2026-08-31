import { useEffect, useState } from "react";
import { bookingService } from "../../services/bookingService";

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await bookingService.getHostReservations();

      setReservations(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load reservations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleStatusUpdate = async (
    bookingId,
    status
  ) => {
    try {
      setUpdatingId(bookingId);

      const response =
        await bookingService.updateStatus(
          bookingId,
          status
        );

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === bookingId
            ? response.data
            : reservation
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Unable to update reservation."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";

      case "CANCELLED":
        return "bg-red-100 text-red-700";

      case "COMPLETED":
        return "bg-blue-100 text-blue-700";

      default:
        return "bg-yellow-100 text-yellow-700";
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
            Reservations
          </h1>

          <p className="mt-2 text-[#64748B]">
            Manage booking requests for your properties.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-[#64748B]">
            Loading reservations...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          reservations.length === 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center">
              <h2 className="text-lg font-bold text-[#172554]">
                No reservations yet
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                New guest reservations will appear here.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          reservations.length > 0 && (
            <div className="space-y-4">
              {reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-bold text-[#172554]">
                          {reservation.propertyTitle}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            reservation.status
                          )}`}
                        >
                          {reservation.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-[#64748B]">
                        Guest:{" "}
                        <span className="font-semibold text-[#111827]">
                          {reservation.guestName}
                        </span>
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
                        <span>
                          Check-in:{" "}
                          {reservation.checkIn}
                        </span>

                        <span>
                          Check-out:{" "}
                          {reservation.checkOut}
                        </span>

                        <span>
                          Guests:{" "}
                          {reservation.guests}
                        </span>
                      </div>

                      <p className="mt-3 font-bold text-[#172554]">
                        ₦
                        {Number(
                          reservation.totalAmount
                        ).toLocaleString()}
                      </p>
                    </div>

                    {reservation.status ===
                      "PENDING" && (
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              reservation.id,
                              "CONFIRMED"
                            )
                          }
                          disabled={
                            updatingId ===
                            reservation.id
                          }
                          className="rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          {updatingId ===
                          reservation.id
                            ? "Updating..."
                            : "Confirm"}
                        </button>

                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              reservation.id,
                              "CANCELLED"
                            )
                          }
                          disabled={
                            updatingId ===
                            reservation.id
                          }
                          className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}