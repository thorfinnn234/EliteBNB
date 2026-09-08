import { homepageImages } from "./homepageContent";

const {
  editorialNightPool,
  editorialOceanVilla,
  escapeBaliSunset,
  escapeCityLightsVilla,
  escapeMaldivesPoolLounge,
  escapeMediterraneanPoolSea,
  escapeSeasideVillaSunset,
  heroVillaSunset,
  propertyModernPool,
  propertySeasideInterior,
  storyCoastalDusk,
} = homepageImages;

/**
 * Supplies a tiny development-only identity for the visual preview route.
 * It is deliberately separate from AuthContext/localStorage so it cannot
 * masquerade as a real authenticated session.
 */
export const userHomePreviewIdentity = {
  firstName: "Victor",
  lastName: "Adeyemi",
  email: "victor.preview@elitebnb.local",
  role: "USER",
};

/**
 * Centralizes the first User Home presentation data so route components stay
 * free of hardcoded mock objects. Future service responses can replace this
 * shape without changing the visual components.
 */
export const userHomeData = {
  presentationState: {
    isLoading: false,
    errors: {
      featuredStay: false,
      recommendations: false,
      upcomingTrip: false,
      savedStays: false,
    },
  },
  briefing: {
    label: "Today",
    title: "A quiet coastal stay is waiting.",
    detail: "Next window: Sep 18-22 · Lagos waterfront · private pool preferred.",
  },
  featuredStay: {
    id: 1,
    eyebrow: "Selected for your next escape",
    reason: "Because you saved waterfront stays",
    name: "Glassline Villa",
    location: "Ikoyi, Lagos",
    rating: "4.96",
    price: "₦185,000",
    qualifier: "/ night",
    image: heroVillaSunset,
    imageAlt:
      "Luxury glass villa with an infinity pool glowing at sunset above the coast",
    description:
      "A private pool, quiet terraces and wide water views designed for a slower kind of city stay.",
    attributes: ["4 guests", "Infinity pool", "Private terrace"],
  },
  recommendations: [
    {
      id: 2,
      variant: "lead",
      name: "Signal Hill Residence",
      location: "Cape Town, South Africa",
      rating: "4.91",
      price: "₦240,000",
      qualifier: "/ night",
      image: propertyModernPool,
      imageAlt: "Modern villa with a calm pool and sculptural white exterior",
      descriptor: "Mountain light and private outdoor living.",
    },
    {
      id: 3,
      variant: "portrait",
      name: "Caldera White House",
      location: "Santorini, Greece",
      rating: "4.98",
      price: "₦310,000",
      qualifier: "/ night",
      image: escapeMediterraneanPoolSea,
      imageAlt:
        "Mediterranean pool terrace overlooking bright blue sea and cliffs",
      descriptor: "Whitewashed drama above the water.",
    },
    {
      id: 4,
      variant: "wide",
      name: "Atrium Penthouse",
      location: "Victoria Island, Lagos",
      rating: "4.94",
      price: "₦195,000",
      qualifier: "/ night",
      image: propertySeasideInterior,
      imageAlt: "Luxury interior with broad windows and ocean-facing light",
      descriptor: "High-floor calm with an evening-ready view.",
    },
    {
      id: 5,
      variant: "standard",
      name: "Aegean Pool House",
      location: "Santorini, Greece",
      rating: "4.97",
      price: "₦285,000",
      qualifier: "/ night",
      image: storyCoastalDusk,
      imageAlt: "Infinity pool overlooking the sea during a warm dusk",
      descriptor: "A stay arranged around the hour before sunset.",
    },
  ],
  upcomingTrip: {
    id: "trip-azure-house",
    propertyId: 1,
    name: "Azure House",
    location: "Victoria Island, Lagos",
    status: "Confirmed",
    image: editorialOceanVilla,
    imageAlt:
      "Oceanview villa with wide glass terraces and a glowing infinity pool",
    checkIn: "Sep 18",
    checkOut: "Sep 22",
    nights: "4 nights",
    guests: "2 guests",
    note: "Arrival details will appear here once your host confirms the final welcome plan.",
  },
  savedStays: [
    {
      id: 6,
      variant: "tall",
      name: "Arched Palm Villa",
      location: "Lekki, Lagos",
      price: "₦165,000",
      image: escapeCityLightsVilla,
      imageAlt:
        "Waterfront luxury residence with arches, palms and reflected water",
    },
    {
      id: 7,
      variant: "wide",
      name: "Tropical Shore House",
      location: "Private coast",
      price: "₦220,000",
      image: escapeBaliSunset,
      imageAlt: "Hillside villa pool reflecting sunset over tropical greenery",
    },
    {
      id: 8,
      variant: "portrait",
      name: "Stillwater Retreat",
      location: "Cape Town, South Africa",
      price: "₦260,000",
      image: editorialNightPool,
      imageAlt: "Warmly lit villa and pool at night in a tropical setting",
    },
  ],
  discoveryShortcuts: [
    {
      label: "Beachfront",
      query: "beachfront",
      description: "Open water, quiet terraces and coastal arrivals.",
    },
    {
      label: "Villas",
      query: "villa",
      description: "Private homes with room to settle in.",
    },
    {
      label: "City stays",
      query: "city",
      description: "Penthouses and residences close to the evening.",
    },
    {
      label: "Private pools",
      query: "pool",
      description: "Water at the center of the stay.",
    },
    {
      label: "Weekend escapes",
      query: "weekend",
      description: "Short stays that still feel considered.",
    },
  ],
  emptyStates: {
    recommendations: {
      title: "No curated stays yet.",
      description:
        "Start exploring and EliteBNB will shape recommendations around the places you save.",
      actionLabel: "Explore stays",
      actionTo: "/search",
    },
    upcomingTrip: {
      title: "Nothing booked yet.",
      description: "Your next story can start with a stay worth remembering.",
      actionLabel: "Explore stays",
      actionTo: "/search",
    },
    savedStays: {
      title: "No saved stays yet.",
      description:
        "Save residences while browsing and they will collect here for later.",
      actionLabel: "Find stays to save",
      actionTo: "/search",
    },
  },
};

/**
 * Supplies mockable discovery data for the Explore/Search route.
 * The filter fields intentionally map to visible UI concepts, not backend
 * endpoints, so API-backed search can replace the array later.
 */
export const userExploreData = {
  presentationState: {
    isLoading: false,
    error: false,
  },
  defaultCriteria: {
    destination: "Lagos",
    checkIn: "",
    checkOut: "",
    guests: "2",
  },
  filterDefaults: {
    price: "all",
    propertyType: "all",
    bedrooms: "all",
    rating: "all",
    amenities: [],
  },
  sortOptions: [
    { label: "Recommended", value: "recommended" },
    { label: "Highest rated", value: "rating" },
    { label: "Price: low to high", value: "price-low" },
    { label: "Price: high to low", value: "price-high" },
  ],
  filterGroups: {
    prices: [
      { label: "Any price", value: "all" },
      { label: "Under ₦180k", value: "under-180" },
      { label: "₦180k-₦260k", value: "180-260" },
      { label: "₦260k+", value: "260-plus" },
    ],
    propertyTypes: [
      { label: "Any stay", value: "all" },
      { label: "Villa", value: "Villa" },
      { label: "Penthouse", value: "Penthouse" },
      { label: "Retreat", value: "Retreat" },
      { label: "Apartment", value: "Apartment" },
    ],
    bedrooms: [
      { label: "Any bedrooms", value: "all" },
      { label: "1+ bedrooms", value: "1" },
      { label: "2+ bedrooms", value: "2" },
      { label: "3+ bedrooms", value: "3" },
      { label: "4+ bedrooms", value: "4" },
    ],
    ratings: [
      { label: "Any rating", value: "all" },
      { label: "4.8+", value: "4.8" },
      { label: "4.9+", value: "4.9" },
      { label: "4.95+", value: "4.95" },
    ],
    amenities: [
      "Infinity pool",
      "Private terrace",
      "Ocean view",
      "Chef-ready kitchen",
      "Concierge",
      "Workspace",
    ],
  },
  results: [
    {
      id: 1,
      variant: "feature-wide",
      name: "Glassline Villa",
      location: "Ikoyi, Lagos",
      propertyType: "Villa",
      rating: "4.96",
      ratingNumber: 4.96,
      price: "₦185,000",
      priceNumber: 185000,
      qualifier: "/ night",
      bedrooms: 3,
      amenities: ["Infinity pool", "Private terrace", "Ocean view", "Concierge"],
      image: heroVillaSunset,
      imageAlt:
        "Luxury glass villa with an infinity pool glowing at sunset above the coast",
      descriptor: "Private water, quiet terraces and a composed city arrival.",
    },
    {
      id: 2,
      variant: "feature-tall",
      name: "Signal Hill Residence",
      location: "Cape Town, South Africa",
      propertyType: "Villa",
      rating: "4.91",
      ratingNumber: 4.91,
      price: "₦240,000",
      priceNumber: 240000,
      qualifier: "/ night",
      bedrooms: 4,
      amenities: ["Private terrace", "Ocean view", "Chef-ready kitchen"],
      image: propertyModernPool,
      imageAlt: "Modern villa with a calm pool and sculptural white exterior",
      descriptor: "Mountain light and outdoor rooms made for slower mornings.",
    },
    {
      id: 3,
      variant: "landscape",
      name: "Caldera White House",
      location: "Santorini, Greece",
      propertyType: "Villa",
      rating: "4.98",
      ratingNumber: 4.98,
      price: "₦310,000",
      priceNumber: 310000,
      qualifier: "/ night",
      bedrooms: 3,
      amenities: ["Infinity pool", "Ocean view", "Concierge"],
      image: escapeMediterraneanPoolSea,
      imageAlt:
        "Mediterranean pool terrace overlooking bright blue sea and cliffs",
      descriptor: "Whitewashed drama with the Aegean held in every frame.",
    },
    {
      id: 4,
      variant: "standard",
      name: "Atrium Penthouse",
      location: "Victoria Island, Lagos",
      propertyType: "Penthouse",
      rating: "4.94",
      ratingNumber: 4.94,
      price: "₦195,000",
      priceNumber: 195000,
      qualifier: "/ night",
      bedrooms: 2,
      amenities: ["Ocean view", "Workspace", "Chef-ready kitchen"],
      image: propertySeasideInterior,
      imageAlt: "Luxury interior with broad windows and ocean-facing light",
      descriptor: "High-floor calm with the city held just beyond the glass.",
    },
    {
      id: 5,
      variant: "portrait",
      name: "Aegean Pool House",
      location: "Santorini, Greece",
      propertyType: "Retreat",
      rating: "4.97",
      ratingNumber: 4.97,
      price: "₦285,000",
      priceNumber: 285000,
      qualifier: "/ night",
      bedrooms: 2,
      amenities: ["Infinity pool", "Private terrace", "Ocean view"],
      image: storyCoastalDusk,
      imageAlt: "Infinity pool overlooking the sea during a warm dusk",
      descriptor: "A stay arranged around the hour before sunset.",
    },
    {
      id: 6,
      variant: "standard",
      name: "Arched Palm Villa",
      location: "Lekki, Lagos",
      propertyType: "Villa",
      rating: "4.9",
      ratingNumber: 4.9,
      price: "₦165,000",
      priceNumber: 165000,
      qualifier: "/ night",
      bedrooms: 3,
      amenities: ["Private terrace", "Concierge", "Chef-ready kitchen"],
      image: escapeCityLightsVilla,
      imageAlt:
        "Waterfront luxury residence with arches, palms and reflected water",
      descriptor: "Architectural privacy close to the evening energy.",
    },
    {
      id: 7,
      variant: "tall",
      name: "Stillwater Retreat",
      location: "Cape Town, South Africa",
      propertyType: "Retreat",
      rating: "4.89",
      ratingNumber: 4.89,
      price: "₦260,000",
      priceNumber: 260000,
      qualifier: "/ night",
      bedrooms: 4,
      amenities: ["Infinity pool", "Workspace", "Private terrace"],
      image: editorialNightPool,
      imageAlt: "Warmly lit villa and pool at night in a tropical setting",
      descriptor: "A private night swim, a quiet deck and nothing rushed.",
    },
    {
      id: 8,
      variant: "landscape",
      name: "Tropical Shore House",
      location: "Private coast",
      propertyType: "Retreat",
      rating: "4.93",
      ratingNumber: 4.93,
      price: "₦220,000",
      priceNumber: 220000,
      qualifier: "/ night",
      bedrooms: 2,
      amenities: ["Ocean view", "Private terrace", "Concierge"],
      image: escapeBaliSunset,
      imageAlt: "Hillside villa pool reflecting sunset over tropical greenery",
      descriptor: "Tropical quiet with water, light and a slower clock.",
    },
  ],
  emptyState: {
    title: "No stays match those filters.",
    description: "Try widening your search or removing one of the filters.",
    actionLabel: "Clear filters",
  },
};

/**
 * Models trip-list presentation states for the guest Trips route.
 * Booking authority, cancellation eligibility and trip changes must come from
 * backend responses in a later integration pass.
 */
export const userTripsData = {
  presentationState: {
    isLoading: false,
    error: false,
  },
  tabs: [
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ],
  trips: {
    upcoming: [
      {
        id: "EB-240918-AZURE",
        propertyId: 1,
        name: "Azure House",
        location: "Victoria Island, Lagos",
        image: editorialOceanVilla,
        imageAlt:
          "Oceanview villa with wide glass terraces and a glowing infinity pool",
        dates: "Sep 18-22, 2026",
        nights: "4 nights",
        guests: "2 guests",
        status: "Confirmed",
        reference: "EB-240918-AZURE",
        note: "A host welcome note will appear once arrival details are finalized.",
      },
      {
        id: "EB-241102-CALDERA",
        propertyId: 3,
        name: "Caldera White House",
        location: "Santorini, Greece",
        image: escapeMediterraneanPoolSea,
        imageAlt:
          "Mediterranean pool terrace overlooking bright blue sea and cliffs",
        dates: "Nov 2-7, 2026",
        nights: "5 nights",
        guests: "2 guests",
        status: "Awaiting host details",
        reference: "EB-241102-CALDERA",
        note: "Your itinerary will update when the backend supplies final check-in guidance.",
      },
    ],
    completed: [
      {
        id: "EB-230614-SIGNAL",
        propertyId: 2,
        name: "Signal Hill Residence",
        location: "Cape Town, South Africa",
        image: propertyModernPool,
        imageAlt: "Modern villa with a calm pool and sculptural white exterior",
        dates: "Jun 14-18, 2026",
        nights: "4 nights",
        guests: "2 guests",
        status: "Completed",
        reference: "EB-230614-SIGNAL",
        note: "Your review helped future guests understand the stay.",
      },
    ],
    cancelled: [],
  },
  emptyStates: {
    upcoming: {
      title: "Nothing booked yet.",
      description: "Your next story can start with a stay worth remembering.",
      actionLabel: "Explore stays",
      actionTo: "/search",
    },
    completed: {
      title: "No completed trips yet.",
      description: "Completed stays will collect here after checkout.",
      actionLabel: "Explore stays",
      actionTo: "/search",
    },
    cancelled: {
      title: "No cancelled trips.",
      description: "Cancelled reservations will appear here if they happen.",
    },
  },
};

/**
 * Feeds the Saved route with a visual collection that can later be replaced by
 * a wishlist service response without changing the page composition.
 */
export const userWishlistData = {
  presentationState: {
    isLoading: false,
    error: false,
  },
  featuredSavedStay: {
    id: 6,
    name: "Arched Palm Villa",
    location: "Lekki, Lagos",
    rating: "4.90",
    price: "₦165,000",
    qualifier: "/ night",
    image: escapeCityLightsVilla,
    imageAlt:
      "Waterfront luxury residence with arches, palms and reflected water",
    descriptor: "The one to keep close when the weekend needs water and quiet.",
  },
  stays: [
    ...userHomeData.savedStays,
    {
      id: 9,
      variant: "wide",
      name: "Maldives Pool Lounge",
      location: "Private island",
      price: "₦390,000",
      qualifier: "/ night",
      rating: "4.99",
      image: escapeMaldivesPoolLounge,
      imageAlt:
        "Oceanfront pool residence with white lounge furniture and turquoise water",
      descriptor: "Clear water, still mornings and nothing overplanned.",
    },
    {
      id: 10,
      variant: "feature-tall",
      name: "Seaside Villa Sunset",
      location: "Mediterranean coast",
      price: "₦270,000",
      qualifier: "/ night",
      rating: "4.95",
      image: escapeSeasideVillaSunset,
      imageAlt: "White seaside villa and pool warmed by late afternoon light",
      descriptor: "Late light across stone, water and open terraces.",
    },
  ],
  emptyState: {
    title: "Nothing saved yet.",
    description: "Keep the places you don't want to forget.",
    actionLabel: "Explore stays",
    actionTo: "/search",
  },
};

/**
 * Provides review and review-eligibility presentation data.
 * Real eligibility and submission rules must remain backend-controlled.
 */
export const userReviewsData = {
  presentationState: {
    isLoading: false,
    error: false,
  },
  submitted: [
    {
      id: "review-signal",
      propertyId: 2,
      property: "Signal Hill Residence",
      location: "Cape Town, South Africa",
      rating: 5,
      date: "June 22, 2026",
      image: propertyModernPool,
      imageAlt: "Modern villa with a calm pool and sculptural white exterior",
      text: "The house was quiet, precise and beautifully hosted. We booked it for the view, but the small details stayed with us.",
    },
    {
      id: "review-atrium",
      propertyId: 4,
      property: "Atrium Penthouse",
      location: "Victoria Island, Lagos",
      rating: 4,
      date: "April 8, 2026",
      image: propertySeasideInterior,
      imageAlt: "Luxury interior with broad windows and ocean-facing light",
      text: "A calm city stay with strong light and a host who made arrival feel effortless.",
    },
  ],
  readyToReview: [
    {
      id: "ready-tropical",
      propertyId: 8,
      property: "Tropical Shore House",
      location: "Private coast",
      completedDate: "August 12, 2026",
      image: escapeBaliSunset,
      imageAlt: "Hillside villa pool reflecting sunset over tropical greenery",
    },
  ],
  emptyStates: {
    submitted: {
      title: "No reviews written yet.",
      description: "After checkout, your notes can help the next guest choose well.",
    },
    readyToReview: {
      title: "Nothing ready to review.",
      description: "Eligible stays will appear here after completed trips.",
    },
  },
};

/**
 * Keeps profile presentation values deliberately non-sensitive.
 * Production renders available AuthContext fields while preview mode uses the
 * small identity object above and these local preferences.
 */
export const userProfileData = {
  phone: "+234 800 000 0000",
  accountRoleLabel: "Guest",
  identityStats: [
    { label: "Saved stays", value: String(userWishlistData.stays.length) },
    {
      label: "Trips",
      value: String(
        userTripsData.trips.upcoming.length +
          userTripsData.trips.completed.length +
          userTripsData.trips.cancelled.length
      ),
    },
    { label: "Reviews", value: String(userReviewsData.submitted.length) },
  ],
  recommendedStay: {
    id: 5,
    variant: "landscape",
    name: "Aegean Pool House",
    location: "Santorini, Greece",
    rating: "4.97",
    price: "₦285,000",
    qualifier: "/ night",
    image: storyCoastalDusk,
    imageAlt: "Infinity pool overlooking the sea during a warm dusk",
    descriptor:
      "A stay that matches your saved preference for water, quiet arrival and long sunset views.",
  },
  preferences: [
    {
      id: "waterfront",
      label: "Waterfront stays",
      description: "Prioritize villas, terraces and residences near water.",
      enabled: true,
    },
    {
      id: "quiet-arrival",
      label: "Quiet arrivals",
      description: "Favor stays with clear check-in and calm host communication.",
      enabled: true,
    },
    {
      id: "work-ready",
      label: "Work-ready spaces",
      description: "Keep strong Wi-Fi and comfortable desks visible while browsing.",
      enabled: false,
    },
  ],
  securityItems: [
    "Password and recovery settings stay managed through secure account access.",
    "Payment methods will appear only when payment setup is available.",
  ],
};

/**
 * Documents the local image sources reused by the authenticated dashboard.
 * This keeps the asset trail visible while we wait for API-backed property data.
 */
export const userHomePhotoCredits = [
  {
    file: "hero-villa-sunset.jpg",
    source:
      "https://www.pexels.com/photo/luxurious-modern-villa-with-infinity-pool-at-sunset-31817157/",
  },
  {
    file: "editorial-ocean-villa.jpg",
    source:
      "https://www.pexels.com/photo/luxury-oceanview-villa-with-infinity-pool-at-sunset-31817160/",
  },
  {
    file: "property-modern-pool.jpg",
    source:
      "https://www.pexels.com/photo/modern-luxury-villa-with-infinity-pool-37736542/",
  },
  {
    file: "property-seaside-interior.jpg",
    source:
      "https://www.pexels.com/photo/luxury-seaside-villa-with-modern-interior-design-31817155/",
  },
  {
    file: "escape-city-lights-villa.jpg",
    source: "https://www.pexels.com/photo/28962897/",
  },
  {
    file: "escape-bali-sunset.jpg",
    source:
      "https://www.pexels.com/photo/luxury-villa-pool-at-sunset-in-bali-indonesia-34790496/",
  },
  {
    file: "editorial-night-pool.jpg",
    source:
      "https://www.pexels.com/photo/luxury-villa-with-pool-in-tropical-setting-28915352/",
  },
  {
    file: "story-coastal-dusk.jpg",
    source:
      "https://www.pexels.com/photo/a-view-of-the-pool-and-the-ocean-at-dusk-28054848/",
  },
  {
    file: "escape-mediterranean-pool-sea.jpg",
    source: "https://www.pexels.com/photo/29702291/",
  },
  {
    file: "escape-architectural-pool.jpg",
    source: "https://www.pexels.com/photo/a-swimming-pool-by-a-building-19344317/",
  },
  {
    file: "destination-lagos.jpg",
    source:
      "https://www.pexels.com/photo/prominent-lagos-skyline-featuring-the-green-tower-37505507/",
  },
  {
    file: "destination-cape-town.jpg",
    source:
      "https://www.pexels.com/photo/cityscape-of-cape-town-from-signal-hill-19772226/",
  },
];
