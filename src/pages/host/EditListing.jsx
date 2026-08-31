import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Users,
  MapPin,
  Home,
  Wallet,
  Upload,
  Trash2,
  Star,
  Image as ImageIcon,
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

export default function EditListing() {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [managingImageId, setManagingImageId] =
    useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadImages = async () => {
    const response = await propertyService.getImages(id);
    const imageData = Array.isArray(response.data) ? response.data : response.data?.data || [];
    setImages(imageData);
  };

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        setError("");

        const [propertyResponse, imagesResponse] =
          await Promise.all([
            propertyService.getById(id),
            propertyService.getImages(id),
          ]);

        const property = propertyResponse.data;

        setFormData({
          title: property.title || "",
          description: property.description || "",
          location: property.location || "",
          pricePerNight: property.pricePerNight ?? "",
          bedrooms: property.bedrooms ?? "",
          bathrooms: property.bathrooms ?? "",
          maxGuests: property.maxGuests ?? "",
          propertyType:
            property.propertyType || "APARTMENT",
          amenities: property.amenities || [],
        });

        const imageData = Array.isArray(imagesResponse.data) ? imagesResponse.data : imagesResponse.data?.data || [];
        setImages(imageData);
      } catch (err) {
        console.error("Failed to load property:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load this property."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id]);

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
          ? current.amenities.filter(
              (item) => item !== amenity
            )
          : [...current.amenities, amenity],
      };
    });
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      for (const file of files) {
        await propertyService.uploadImage(
          id,
          file,
          "OTHER",
          images.length === 0
        );
      }

      await loadImages();

      setSuccess(
        files.length === 1
          ? "Photo uploaded successfully."
          : `${files.length} photos uploaded successfully.`
      );
    } catch (err) {
      console.error("Failed to upload photos:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to upload photo."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteImage = async (image) => {
    const confirmed = window.confirm(
      "Delete this photo from the listing?"
    );

    if (!confirmed) return;

    try {
      setManagingImageId(image.id);
      setError("");
      setSuccess("");

      await propertyService.deleteImage(id, image.id);

      await loadImages();

      setSuccess("Photo deleted successfully.");
    } catch (err) {
      console.error("Failed to delete image:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to delete photo."
      );
    } finally {
      setManagingImageId(null);
    }
  };

  const handleSetCover = async (image) => {
    if (image.coverImage) return;

    try {
      setManagingImageId(image.id);
      setError("");
      setSuccess("");

      await propertyService.setCoverImage(
        id,
        image.id
      );

      await loadImages();

      setSuccess("Cover photo updated.");
    } catch (err) {
      console.error(
        "Failed to change cover image:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Unable to change cover photo."
      );
    } finally {
      setManagingImageId(null);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Property title is required.";
    }

    if (!formData.description.trim()) {
      return "Property description is required.";
    }

    if (!formData.location.trim()) {
      return "Property location is required.";
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

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        pricePerNight: Number(
          formData.pricePerNight
        ),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        maxGuests: Number(formData.maxGuests),
        propertyType: formData.propertyType,
        amenities: formData.amenities,
      };

      await propertyService.update(id, payload);

      setSuccess(
        "Listing details updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update listing:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update listing."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatLabel = (value) =>
    value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FAF9F6] p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-[#172554]">
              Loading property...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() =>
            navigate("/host/listings")
          }
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#172554]"
        >
          <ArrowLeft size={18} />
          Back to listings
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            HOST
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Edit Listing
          </h1>

          <p className="mt-2 text-[#64748B]">
            Update {formData.title}.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* PROPERTY INFO */}
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
                  className="w-full rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none focus:border-[#D4A72C]"
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
                  className="w-full resize-none rounded-xl border border-[#D1D5DB] px-4 py-3 outline-none focus:border-[#D4A72C]"
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
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 outline-none focus:border-[#D4A72C]"
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
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white py-3 pl-11 pr-4 outline-none focus:border-[#D4A72C]"
                  >
                    {PROPERTY_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {formatLabel(type)}
                        </option>
                      )
                    )}
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
              {[
                [
                  "pricePerNight",
                  "Price / night",
                  Wallet,
                ],
                [
                  "bedrooms",
                  "Bedrooms",
                  BedDouble,
                ],
                [
                  "bathrooms",
                  "Bathrooms",
                  Bath,
                ],
                [
                  "maxGuests",
                  "Max guests",
                  Users,
                ],
              ].map(
                ([name, label, Icon]) => (
                  <div key={name}>
                    <label className="mb-2 block text-sm font-semibold text-[#172554]">
                      {label}
                    </label>

                    <div className="relative">
                      <Icon
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      />

                      <input
                        type="number"
                        min="1"
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-[#D1D5DB] py-3 pl-11 pr-4 outline-none focus:border-[#D4A72C]"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* AMENITIES */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Amenities
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {AMENITIES.map((amenity) => {
                const selected =
                  formData.amenities.includes(
                    amenity
                  );

                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      handleAmenityToggle(
                        amenity
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                      selected
                        ? "border-[#D4A72C] bg-[#D4A72C]/10 text-[#172554]"
                        : "border-[#E5E7EB] text-[#64748B]"
                    }`}
                  >
                    {formatLabel(amenity)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PHOTOS */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#172554]">
                  Property photos
                </h2>

                <p className="mt-1 text-sm text-[#64748B]">
                  Add, remove or choose the main
                  listing photo.
                </p>
              </div>

              <label
                className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#172554] px-5 py-3 text-sm font-semibold text-white ${
                  uploading
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                <Upload size={17} />

                {uploading
                  ? "Uploading..."
                  : "Add photos"}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D1D5DB] py-12 text-[#64748B]">
                <ImageIcon size={30} />

                <p className="mt-3 text-sm">
                  No property photos.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-[#E5E7EB]"
                  >
                    <div className="relative h-48">
                      <img
                        src={image.imageUrl}
                        alt="Property"
                        className="h-full w-full object-cover"
                      />

                      {image.coverImage && (
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#172554] shadow">
                          <Star
                            size={13}
                            className="fill-[#D4A72C] text-[#D4A72C]"
                          />
                          Cover
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 p-3">
                      <p className="text-xs font-semibold text-[#64748B]">
                        {formatLabel(
                          image.imageType ||
                            "OTHER"
                        )}
                      </p>

                      {!image.coverImage && (
                        <button
                          type="button"
                          disabled={
                            managingImageId ===
                            image.id
                          }
                          onClick={() =>
                            handleSetCover(image)
                          }
                          className="w-full rounded-lg border border-[#D4A72C] px-3 py-2 text-xs font-semibold text-[#172554] hover:bg-[#D4A72C]/10 disabled:opacity-50"
                        >
                          Set as cover
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={
                          managingImageId ===
                            image.id ||
                          images.length <= 1
                        }
                        onClick={() =>
                          handleDeleteImage(image)
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                        Delete photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length === 1 && (
              <p className="mt-4 text-xs text-[#64748B]">
                Add another photo before deleting
                the only photo on this listing.
              </p>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                navigate("/host/listings")
              }
              disabled={saving}
              className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#172554]"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-xl bg-[#D4A72C] px-7 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving changes..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}