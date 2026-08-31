import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import GuestSearch from "../../components/user/GuestSearch";
import {
  ContentSkeleton,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStayCard from "../../components/user/UserStayCard";
import { userExploreData } from "../../data/userHomeData";
import "../user/UserHome.css";
import "../user/UserPages.css";

/**
 * Reads the current query string into the search form's initial display state.
 * The values remain local UI state until a backend search contract is connected.
 */
function getInitialCriteria(search) {
  const params = new URLSearchParams(search);

  return {
    ...userExploreData.defaultCriteria,
    destination:
      params.get("destination") ??
      params.get("category") ??
      userExploreData.defaultCriteria.destination,
    checkIn: params.get("checkIn") ?? userExploreData.defaultCriteria.checkIn,
    checkOut:
      params.get("checkOut") ?? userExploreData.defaultCriteria.checkOut,
    guests: params.get("guests") ?? userExploreData.defaultCriteria.guests,
  };
}

/**
 * Checks whether a stay falls inside the selected price range.
 * These ranges are preview-only filters over local presentation data.
 */
function matchesPrice(stay, priceFilter) {
  if (priceFilter === "under-180") return stay.priceNumber < 180000;
  if (priceFilter === "180-260") {
    return stay.priceNumber >= 180000 && stay.priceNumber <= 260000;
  }
  if (priceFilter === "260-plus") return stay.priceNumber > 260000;

  return true;
}

/**
 * Applies the local Explore filters without mutating the original mock array.
 * Backend search can later replace this function with service response data.
 */
function filterResults(results, filters) {
  return results.filter((stay) => {
    const matchesType =
      filters.propertyType === "all" ||
      stay.propertyType === filters.propertyType;
    const matchesBedrooms =
      filters.bedrooms === "all" || stay.bedrooms >= Number(filters.bedrooms);
    const matchesRating =
      filters.rating === "all" || stay.ratingNumber >= Number(filters.rating);
    const matchesAmenities = filters.amenities.every((amenity) =>
      stay.amenities.includes(amenity)
    );

    return (
      matchesType &&
      matchesBedrooms &&
      matchesRating &&
      matchesPrice(stay, filters.price) &&
      matchesAmenities
    );
  });
}

/**
 * Sorts the visible stay list according to the selected presentation control.
 * It returns a fresh array so React can render safely without modifying data.
 */
function sortResults(results, sortValue) {
  const sortedResults = [...results];

  if (sortValue === "rating") {
    return sortedResults.sort((first, second) => second.ratingNumber - first.ratingNumber);
  }

  if (sortValue === "price-low") {
    return sortedResults.sort((first, second) => first.priceNumber - second.priceNumber);
  }

  if (sortValue === "price-high") {
    return sortedResults.sort((first, second) => second.priceNumber - first.priceNumber);
  }

  return sortedResults;
}

/**
 * Renders the shared Explore/Search experience.
 * Public visitors see it at `/search`; development preview renders the same
 * screen inside the authenticated User shell without touching auth state.
 */
export default function Search({ previewMode = false }) {
  const location = useLocation();
  const [filters, setFilters] = useState(userExploreData.filterDefaults);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortValue, setSortValue] = useState("recommended");
  const initialCriteria = useMemo(
    () => getInitialCriteria(location.search),
    [location.search]
  );
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const { filterGroups, presentationState, results } = userExploreData;
  const heroStay = results[0];
  const heroDetails = [
    {
      label: "Destination",
      value: initialCriteria.destination || "Anywhere exceptional",
    },
    {
      label: "Guests",
      value: `${initialCriteria.guests || "2"} guest${
        initialCriteria.guests === "1" ? "" : "s"
      }`,
    },
    {
      label: "Mode",
      value: previewMode ? "Private search" : "Public discovery",
    },
  ];
  const visibleResults = useMemo(() => {
    const filteredResults = filterResults(results, filters);

    return sortResults(filteredResults, sortValue);
  }, [filters, results, sortValue]);

  /**
   * Updates one select-based filter while preserving the rest of the filter
   * state. Select values are deliberately simple strings for future API mapping.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  /**
   * Toggles an amenity chip in local state. The button uses `aria-pressed` so
   * keyboard and assistive technology users receive the selected state.
   */
  const handleAmenityToggle = (amenity) => {
    setFilters((currentFilters) => {
      const hasAmenity = currentFilters.amenities.includes(amenity);

      return {
        ...currentFilters,
        amenities: hasAmenity
          ? currentFilters.amenities.filter((item) => item !== amenity)
          : [...currentFilters.amenities, amenity],
      };
    });
  };

  /**
   * Restores the broadest local search view for empty-state recovery.
   */
  const handleClearFilters = () => {
    setFilters(userExploreData.filterDefaults);
  };

  return (
    <section
      className={`elite-user-page elite-user-explore${
        previewMode ? " is-user-shell-view" : " is-public-search"
      }`}
      data-user-page
    >
      <UserPageHeader
        eyebrow={previewMode ? "The world through EliteBNB" : "EliteBNB Discover"}
        tone="discovery"
        signature={previewMode ? "WINDOW" : "DISCOVER"}
        detailItems={heroDetails}
        title={
          previewMode
            ? "Open the world through EliteBNB."
            : "Discover the stay that changes the whole trip."
        }
        description={
          previewMode
            ? "Search by place, date and detail while the strongest stays keep their architectural character in view."
            : "Start with the feeling, then refine the dates, guests and details when the place begins to feel inevitable."
        }
        media={
          heroStay ? (
            <figure className="elite-discovery-hero-window">
              <img src={heroStay.image} alt="" loading="lazy" />
              <figcaption>
                <span>{heroStay.location}</span>
                <strong>{heroStay.name}</strong>
              </figcaption>
            </figure>
          ) : null
        }
        action={
          <button
            type="button"
            className="elite-user-page__ghost-button"
            aria-expanded={isFilterPanelOpen}
            aria-controls="elite-explore-filter-panel"
            onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
          >
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filters
          </button>
        }
      />

      <div className="elite-user-page__surface" data-user-page-reveal>
        <GuestSearch initialValues={initialCriteria} searchPath={searchPath} />
      </div>

      <div className="elite-explore__toolbar" data-user-page-reveal>
        <p>
          <strong>{visibleResults.length}</strong>{" "}
          {visibleResults.length === 1 ? "stay" : "stays"} selected
        </p>

        <label>
          Sort
          <select
            value={sortValue}
            onChange={(event) => setSortValue(event.target.value)}
          >
            {userExploreData.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isFilterPanelOpen ? (
        <aside
          className="elite-explore-filters"
          id="elite-explore-filter-panel"
          aria-label="Search filters"
          data-user-page-reveal
        >
          <div className="elite-explore-filters__header">
            <div>
              <p>Refine</p>
              <h3>Shape the stay</h3>
            </div>
            <div className="elite-explore-filters__actions">
              <button type="button" onClick={handleClearFilters}>
                Clear
              </button>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setIsFilterPanelOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="elite-explore-filters__grid">
            <label>
              Price
              <select
                name="price"
                value={filters.price}
                onChange={handleFilterChange}
              >
                {filterGroups.prices.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Property type
              <select
                name="propertyType"
                value={filters.propertyType}
                onChange={handleFilterChange}
              >
                {filterGroups.propertyTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Bedrooms
              <select
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleFilterChange}
              >
                {filterGroups.bedrooms.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Rating
              <select
                name="rating"
                value={filters.rating}
                onChange={handleFilterChange}
              >
                {filterGroups.ratings.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="elite-explore-amenities" aria-label="Amenities">
            {filterGroups.amenities.map((amenity) => (
              <button
                type="button"
                aria-pressed={filters.amenities.includes(amenity)}
                className={
                  filters.amenities.includes(amenity) ? "is-active" : ""
                }
                key={amenity}
                onClick={() => handleAmenityToggle(amenity)}
              >
                {amenity}
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="elite-explore__results" data-user-page-reveal>
        {presentationState.isLoading ? (
          <ContentSkeleton count={6} />
        ) : presentationState.error ? (
          <SectionErrorState
            title="We couldn't load these stays."
            description="Try again shortly or adjust your search."
          />
        ) : visibleResults.length ? (
          visibleResults.map((stay) => (
            <UserStayCard key={stay.id} stay={stay} variant={stay.variant} />
          ))
        ) : (
          <div className="elite-user-feedback">
            <h3>{userExploreData.emptyState.title}</h3>
            <p>{userExploreData.emptyState.description}</p>
            <button type="button" onClick={handleClearFilters}>
              {userExploreData.emptyState.actionLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
