import destinationAbuja from "../assets/home/destination-abuja.jpg";
import destinationCapeTown from "../assets/home/destination-cape-town.jpg";
import destinationLagos from "../assets/home/destination-lagos.jpg";
import destinationSantorini from "../assets/home/destination-santorini.jpg";
import editorialNightPool from "../assets/home/editorial-night-pool.jpg";
import editorialOceanVilla from "../assets/home/editorial-ocean-villa.jpg";
import escapeArchitecturalPool from "../assets/home/escape-architectural-pool.jpg";
import escapeArchedVilla from "../assets/home/escape-arched-villa.jpg";
import escapeBaliSunset from "../assets/home/escape-bali-sunset.jpg";
import escapeCityLightsVilla from "../assets/home/escape-city-lights-villa.jpg";
import escapeMaldivesPoolLounge from "../assets/home/escape-maldives-pool-lounge.jpg";
import escapeMediterraneanPoolSea from "../assets/home/escape-mediterranean-pool-sea.jpg";
import escapeNightReflection from "../assets/home/escape-night-reflection.jpg";
import escapeSeasideVillaSunset from "../assets/home/escape-seaside-villa-sunset.jpg";
import escapeTropicalShoreVillas from "../assets/home/escape-tropical-shore-villas.jpg";
import heroVillaSunset from "../assets/home/hero-villa-sunset.jpg";
import lifestyleBreakfastPool from "../assets/home/lifestyle-breakfast-pool.jpg";
import lifestyleCurtainsSeaView from "../assets/home/lifestyle-curtains-sea-view.jpg";
import propertyModernPool from "../assets/home/property-modern-pool.jpg";
import propertySeasideInterior from "../assets/home/property-seaside-interior.jpg";
import storyCoastalDusk from "../assets/home/story-coastal-dusk.jpg";

export const homepageImages = {
  destinationAbuja,
  destinationCapeTown,
  destinationLagos,
  destinationSantorini,
  editorialNightPool,
  editorialOceanVilla,
  escapeArchitecturalPool,
  escapeArchedVilla,
  escapeBaliSunset,
  escapeCityLightsVilla,
  escapeMaldivesPoolLounge,
  escapeMediterraneanPoolSea,
  escapeNightReflection,
  escapeSeasideVillaSunset,
  escapeTropicalShoreVillas,
  heroVillaSunset,
  lifestyleBreakfastPool,
  lifestyleCurtainsSeaView,
  propertyModernPool,
  propertySeasideInterior,
  storyCoastalDusk,
};

export const spotlightStay = {
  location: "IKOYI · LAGOS",
  name: "The Glass House",
  price: "From ₦185,000 / night",
  imageAlt:
    "Modern oceanview villa with an infinity pool and wide glass balconies at sunset",
};

export const destinations = [
  {
    name: "Lagos",
    description: "Coastal energy. Private luxury.",
    count: "42 selected stays",
    image: destinationLagos,
    imageAlt: "Lagos waterfront skyline with boats and contemporary towers",
  },
  {
    name: "Abuja",
    description: "Quiet capital escapes with room to breathe.",
    count: "18 selected stays",
    image: destinationAbuja,
    imageAlt: "Aerial Abuja road and city lights at twilight",
  },
  {
    name: "Cape Town",
    description: "Mountain light, ocean air, architectural retreats.",
    count: "31 selected stays",
    image: destinationCapeTown,
    imageAlt: "Cape Town coastline and city viewed from above",
  },
  {
    name: "Santorini",
    description: "Whitewashed drama above the Aegean.",
    count: "24 selected stays",
    image: destinationSantorini,
    imageAlt: "Santorini white architecture and poolside terraces in bright sun",
  },
];

export const curatedProperties = [
  {
    id: 1,
    location: "Lagos, Nigeria",
    name: "Glassline Villa",
    rating: "4.96",
    price: "₦185,000",
    image: heroVillaSunset,
    imageAlt: "Luxury villa with infinity pool at sunset",
    hoverImage: editorialOceanVilla,
  },
  {
    id: 2,
    location: "Cape Town, South Africa",
    name: "Signal Hill Residence",
    rating: "4.91",
    price: "₦240,000",
    image: propertyModernPool,
    imageAlt: "Modern villa with blue pool and sculptural outdoor lines",
    hoverImage: escapeArchedVilla,
  },
  {
    id: 3,
    location: "Santorini, Greece",
    name: "Caldera White House",
    rating: "4.98",
    price: "₦310,000",
    image: destinationSantorini,
    imageAlt: "Santorini villa with white walls and pool terrace",
    hoverImage: storyCoastalDusk,
  },
  {
    id: 4,
    location: "Victoria Island, Lagos",
    name: "Atrium Penthouse",
    rating: "4.94",
    price: "₦195,000",
    image: propertySeasideInterior,
    imageAlt: "Luxury interior with broad windows and ocean-facing light",
    hoverImage: editorialNightPool,
  },
];

export const curationPrinciples = [
  {
    number: "01",
    title: "Exceptional spaces",
    copy: "Architecture, proportion and setting are treated as the beginning of the stay.",
  },
  {
    number: "02",
    title: "Thoughtful hosting",
    copy: "Hosts are selected for care, discretion and the small gestures that change a trip.",
  },
  {
    number: "03",
    title: "Confidence throughout",
    copy: "Every journey is designed to feel considered before, during and after arrival.",
  },
];

export const escapeImages = [
  {
    src: editorialNightPool,
    alt: "Warmly lit villa and pool at night",
    caption: "Private water. No schedule.",
  },
  {
    src: propertySeasideInterior,
    alt: "Spacious luxury interior facing the sea",
    caption: "A room above the city.",
  },
  {
    src: lifestyleBreakfastPool,
    alt: "Elegant breakfast set beside a resort pool",
    caption: "Ocean before breakfast.",
  },
  {
    src: storyCoastalDusk,
    alt: "Infinity pool overlooking the sea at dusk",
    caption: "Dinner can wait.",
  },
  {
    src: escapeArchitecturalPool,
    alt: "Minimal architectural retreat and pool under clear blue sky",
    caption: "Sun, stone, silence.",
  },
  {
    src: escapeArchedVilla,
    alt: "Modern villa with arched glass doors beside a swimming pool",
  },
  {
    src: escapeBaliSunset,
    alt: "Hillside villa pool reflecting sunset over tropical greenery",
    caption: "Golden hour included.",
  },
  {
    src: escapeNightReflection,
    alt: "White villa reflected in a pool under a starry night sky",
  },
  {
    src: escapeMediterraneanPoolSea,
    alt: "Mediterranean villa pool terrace overlooking a bright blue sea",
    caption: "Blue before noon.",
  },
  {
    src: escapeMaldivesPoolLounge,
    alt: "Oceanfront pool residence with white lounge furniture and turquoise water",
  },
  {
    src: escapeTropicalShoreVillas,
    alt: "Aerial view of private beachfront villas beside turquoise water",
    caption: "The shore decides the pace.",
  },
  {
    src: escapeSeasideVillaSunset,
    alt: "White seaside villa and pool warmed by late afternoon light",
  },
  {
    src: escapeCityLightsVilla,
    alt: "Waterfront luxury residence with arches, palms and reflected water",
    caption: "Arrival feels private.",
  },
];

export const lifestyleMoments = [
  {
    src: lifestyleCurtainsSeaView,
    alt: "Hotel room curtains opened toward a calm sea view",
    label: "Morning light",
  },
  {
    src: lifestyleBreakfastPool,
    alt: "Outdoor breakfast by a pool under palm trees",
    label: "Slow breakfast",
  },
  {
    src: editorialNightPool,
    alt: "Private villa pool glowing after dark",
    label: "After dark",
  },
];

export const photoCredits = [
  {
    file: "hero-villa-sunset.jpg",
    source: "https://www.pexels.com/photo/luxurious-modern-villa-with-infinity-pool-at-sunset-31817157/",
  },
  {
    file: "editorial-ocean-villa.jpg",
    source: "https://www.pexels.com/photo/luxury-oceanview-villa-with-infinity-pool-at-sunset-31817160/",
  },
  {
    file: "editorial-night-pool.jpg",
    source: "https://www.pexels.com/photo/luxury-villa-with-pool-in-tropical-setting-28915352/",
  },
  {
    file: "destination-lagos.jpg",
    source: "https://www.pexels.com/photo/prominent-lagos-skyline-featuring-the-green-tower-37505507/",
  },
  {
    file: "destination-abuja.jpg",
    source: "https://www.pexels.com/photo/busy-urban-street-in-abuja-nigeria-at-twilight-33687708/",
  },
  {
    file: "destination-cape-town.jpg",
    source: "https://www.pexels.com/photo/cityscape-of-cape-town-from-signal-hill-19772226/",
  },
  {
    file: "destination-santorini.jpg",
    source: "https://www.pexels.com/photo/house-with-swimming-pool-on-santorini-16771759/",
  },
  {
    file: "lifestyle-curtains-sea-view.jpg",
    source: "https://www.pexels.com/photo/hotel-room-with-sea-view-19550058/",
  },
  {
    file: "lifestyle-breakfast-pool.jpg",
    source: "https://www.pexels.com/photo/elegant-outdoor-breakfast-by-the-pool-34645101/",
  },
  {
    file: "property-seaside-interior.jpg",
    source: "https://www.pexels.com/photo/luxury-seaside-villa-with-modern-interior-design-31817155/",
  },
  {
    file: "property-modern-pool.jpg",
    source: "https://www.pexels.com/photo/modern-luxury-villa-with-infinity-pool-37736542/",
  },
  {
    file: "story-coastal-dusk.jpg",
    source: "https://www.pexels.com/photo/a-view-of-the-pool-and-the-ocean-at-dusk-28054848/",
  },
  {
    file: "escape-architectural-pool.jpg",
    source: "https://www.pexels.com/photo/a-swimming-pool-by-a-building-19344317/",
  },
  {
    file: "escape-arched-villa.jpg",
    source: "https://www.pexels.com/photo/modern-villa-with-pool-and-arched-windows-38875037/",
  },
  {
    file: "escape-bali-sunset.jpg",
    source: "https://www.pexels.com/photo/luxury-villa-pool-at-sunset-in-bali-indonesia-34790496/",
  },
  {
    file: "escape-night-reflection.jpg",
    source: "https://www.pexels.com/photo/house-reflection-over-a-swimming-pool-13562772/",
  },
  {
    file: "escape-mediterranean-pool-sea.jpg",
    source: "https://www.pexels.com/photo/29702291/",
  },
  {
    file: "escape-maldives-pool-lounge.jpg",
    source: "https://www.pexels.com/photo/1268871/",
  },
  {
    file: "escape-tropical-shore-villas.jpg",
    source: "https://www.pexels.com/photo/18224158/",
  },
  {
    file: "escape-seaside-villa-sunset.jpg",
    source: "https://www.pexels.com/photo/31751017/",
  },
  {
    file: "escape-city-lights-villa.jpg",
    source: "https://www.pexels.com/photo/28962897/",
  },
];
