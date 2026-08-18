import Badge from "../common/Badge";

export default function PropertyCard({
  image,
  title,
  location,
  price,
  rating = "4.9",
  tag,
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F4F6]">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#172554] via-[#324C88] to-[#D4A72C]" />
        )}

        {tag && (
          <div className="absolute left-3 top-3">
            <Badge tone="gold">{tag}</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#111827]">{title}</h3>
            <p className="mt-1 text-sm text-[#64748B]">{location}</p>
          </div>
          <span className="text-sm font-semibold text-[#172554]">★ {rating}</span>
        </div>

        <p className="mt-4 text-sm">
          <span className="font-bold text-[#172554]">{price}</span>
          <span className="text-[#64748B]"> / night</span>
        </p>
      </div>
    </article>
  );
}
