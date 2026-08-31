import Badge from "../common/Badge";

export default function PropertyCard({ property }) {
  const {
    title,
    location,
    pricePerNight,
    rating = "4.9",
    propertyType,
    images = [],
    bedrooms,
    bathrooms,
    maxGuests,
  } = property;

  const coverImage =
    images?.[0] ||
    "https://via.placeholder.com/600x400?text=EliteBNB";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F4F6]">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover"
        />

        {propertyType && (
          <div className="absolute left-3 top-3">
            <Badge tone="gold">
              {propertyType.replace("_", " ")}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#111827]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-[#64748B]">
              {location}
            </p>
          </div>

          <span className="shrink-0 text-sm font-semibold text-[#172554]">
            ★ {rating}
          </span>
        </div>

        <p className="mt-3 text-xs text-[#64748B]">
          {bedrooms} bed{bedrooms !== 1 ? "s" : ""}
          {" · "}
          {bathrooms} bath{bathrooms !== 1 ? "s" : ""}
          {" · "}
          {maxGuests} guest{maxGuests !== 1 ? "s" : ""}
        </p>

        <p className="mt-4 text-sm">
          <span className="font-bold text-[#172554]">
            ₦{Number(pricePerNight).toLocaleString()}
          </span>

          <span className="text-[#64748B]">
            {" "}
            / night
          </span>
        </p>
      </div>
    </article>
  );
}