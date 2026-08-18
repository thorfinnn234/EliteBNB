export default function PropertyGallery({ images = [] }) {
  const placeholders = images.length ? images : [null, null, null, null, null];

  return (
    <div className="grid min-h-[360px] gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2">
      {placeholders.slice(0, 5).map((image, index) => (
        <div
          key={index}
          className={`${index === 0 ? "md:col-span-2 md:row-span-2" : ""} overflow-hidden bg-[#E5E7EB]`}
        >
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full min-h-40 w-full bg-gradient-to-br from-[#172554]/80 to-[#D4A72C]/70" />
          )}
        </div>
      ))}
    </div>
  );
}
