import PropertyCard from "./PropertyCard";

export default function PropertyGrid({ properties = [] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard key={property.id} {...property} />
      ))}
    </div>
  );
}
