import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Users,
  MapPin,
  Home,
  Wallet,
  Upload,
  X,
  Image as ImageIcon,
  Star,
} from "lucide-react";
import { propertyService } from "../../services/propertyService";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "HOTEL",
  "CABIN",
  "STUDIO",
  "GUEST_HOUSE",
];

const AMENITIES = [
  "WIFI",
  "POOL",
  "PARKING",
  "AIR_CONDITIONING",
  "KITCHEN",
  "GYM",
  "SECURITY",
  "BALCONY",
  "TV",
  "WASHING_MACHINE",
  "WORKSPACE",
  "ELEVATOR",
];

const IMAGE_TYPES = [
  "EXTERIOR",
  "LIVING_ROOM",
  "BEDROOM",
  "KITCHEN",
  "BATHROOM",
  "BALCONY",
  "POOL",
  "DINING_AREA",
  "WORKSPACE",
  "OTHER",
];

export default function CreateListing() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    pricePerNight: "",
    bedrooms: "",
    bathrooms: "",
    maxGuests: "",
    propertyType: "APARTMENT",
    amenities: [],
  });

  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((current) => {
      const selected = current.amenities.includes(amenity);

      return {
        ...current,
        amenities: selected
          ? current.amenities.filter((item) => item !== amenity)
          : [...current.amenities, amenity],
      };
    });
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length !== files.length) {
      setError("Only image files are allowed.");
      return;
    }

    const newImages = imageFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
      imageType: "OTHER",
      coverImage: images.length === 0 && index === 0,
    }));

    setImages((current) => [...current, ...newImages]);
    setError("");

    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setImages((current) => {
      const imageToRemove = current.find(
        (image) => image.id === imageId
      );

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const updated = current.filter(
        (image) => image.id !== imageId
      );

      if (
        updated.length > 0 &&
        !updated.some((image) => image.coverImage)
      ) {
        updated[0] = {
          ...updated[0],
          coverImage: true,
        };
      }

      return updated;
    });
  };

  const updateImageType = (imageId, imageType) => {
    setImages((current) =>
      current.map((image) =>
        image.id === imageId
          ? {
              ...image,
              imageType,
            }
          : image
      )
    );
  };

  const setCoverImage = (imageId) => {
    setImages((current) =>
      current.map((image) => ({
        ...image,
        coverImage: image.id === imageId,
      }))
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Property title is required.";
    }

    if (!formData.description.trim()) {
      return "Property description is required.";
    }

    if (!formData.location.trim()) {
      return "Location is required.";
    }

    if (
      !formData.pricePerNight ||
      Number(formData.pricePerNight) <= 0
    ) {
      return "Enter a valid price per night.";
    }

    if (
      !formData.bedrooms ||
      Number(formData.bedrooms) < 1
    ) {
      return "Bedrooms must be at least 1.";
    }

    if (
      !formData.bathrooms ||
      Number(formData.bathrooms) < 1
    ) {
      return "Bathrooms must be at least 1.";
    }

    if (
      !formData.maxGuests ||
      Number(formData.maxGuests) < 1
    ) {
      return "Maximum guests must be at least 1.";
    }

    if (images.length === 0) {
      return "Please add at least one property photo.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // STEP 1: Create the property
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        pricePerNight: Number(formData.pricePerNight),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        maxGuests: Number(formData.maxGuests),
        propertyType: formData.propertyType,
        amenities: formData.amenities,
      };

      const response = await propertyService.create(payload);

      const propertyId = response.data.id;

      if (!propertyId) {
        throw new Error(
          "Property was created but no property ID was returned."
        );
      }

      // STEP 2: Upload the actual image files
      for (const image of images) {
        await propertyService.uploadImage(
          propertyId,
          image.file,
          image.imageType,
          image.coverImage
        );
      }

      // Clean up browser preview URLs
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });

      // STEP 3: Return to listings
      navigate("/host/listings");
    } catch (err) {
      console.error("Failed to create listing:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to create listing."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatLabel = (value) =>
    value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/host/listings")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#172554]"
        >
          <ArrowLeft size={18} />
          Back to listings
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            HOST
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Create Listing
          </h1>

          <p className="mt-2 text-[#64748B]">
            Add a new property to your EliteBNB portfolio.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROPERTY INFORMATION */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Property information
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Property title
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Luxury Lekki Apartment"
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#D4A72C]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe what makes this property special..."
                  className="w-full resize-none rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none transition focus:border-[#D4A72C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Location
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Lekki, Lagos"
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Property type
                </label>

                <div className="relative">
                  <Home
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-[#D1D5DB] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* PRICING */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Pricing & capacity
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Price / night
                </label>

                <div className="relative">
                  <Wallet
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="number"
                    min="1"
                    name="pricePerNight"
                    value={formData.pricePerNight}
                    onChange={handleChange}
                    placeholder="50000"
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Bedrooms
                </label>

                <div className="relative">
                  <BedDouble
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="number"
                    min="1"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Bathrooms
                </label>

                <div className="relative">
                  <Bath
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="number"
                    min="1"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#172554]">
                  Max guests
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />

                  <input
                    type="number"
                    min="1"
                    name="maxGuests"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#D4A72C]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AMENITIES */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Amenities
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Select the amenities available at this property.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {AMENITIES.map((amenity) => {
                const selected =
                  formData.amenities.includes(amenity);

                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      handleAmenityToggle(amenity)
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "border-[#D4A72C] bg-[#D4A72C]/10 text-[#172554]"
                        : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#D4A72C]"
                    }`}
                  >
                    {formatLabel(amenity)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* REAL PHOTO UPLOAD */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#172554]">
                Property photos
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Upload photos directly from your device.
              </p>
            </div>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D5DB] bg-[#FAF9F6] px-6 py-10 text-center transition hover:border-[#D4A72C] hover:bg-[#D4A72C]/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload size={22} className="text-[#172554]" />
              </div>

              <p className="mt-4 font-semibold text-[#172554]">
                Choose property photos
              </p>

              <p className="mt-1 text-sm text-[#64748B]">
                Select one or multiple images from your device
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
            </label>

            {images.length === 0 ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                <ImageIcon size={20} />
                No photos selected yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6]"
                  >
                    <div className="relative h-52">
                      <img
                        src={image.preview}
                        alt="Property preview"
                        className="h-full w-full object-cover"
                      />

                      {image.coverImage && (
                        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#172554] shadow">
                          <Star
                            size={13}
                            className="fill-[#D4A72C] text-[#D4A72C]"
                          />
                          Cover
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow transition hover:scale-105"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                          Photo category
                        </label>

                        <select
                          value={image.imageType}
                          onChange={(event) =>
                            updateImageType(
                              image.id,
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D4A72C]"
                        >
                          {IMAGE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {formatLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!image.coverImage && (
                        <button
                          type="button"
                          onClick={() =>
                            setCoverImage(image.id)
                          }
                          className="w-full rounded-xl border border-[#D4A72C] px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:bg-[#D4A72C]/10"
                        >
                          Set as cover photo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/host/listings")}
              disabled={submitting}
              className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#172554] transition hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#D4A72C] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#b88d1d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating & uploading photos..."
                : "Create listing"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}