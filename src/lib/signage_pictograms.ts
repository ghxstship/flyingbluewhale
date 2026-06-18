// AUTO-GENERATED metadata for the signage pictogram sprite (public/brand/pictograms.svg).
// The SVG art lives in the sprite; this is the addressable id → label/group index
// powering pictogram pickers and `pictogram_key` validation. Do not hand-edit ids.
// The sole library is the public-domain AIGA / U.S. DOT symbol-sign set (60 signs).

export type PictogramGroup = "arrows" | "baggage" | "circulation" | "concessions" | "regulatory" | "restrooms" | "safety" | "services" | "transport" | "travel";

export interface Pictogram {
  /** Sprite symbol id — use as `<use href="/brand/pictograms.svg#${id}">`. */
  id: string;
  label: string;
  group: PictogramGroup;
}

export const PICTOGRAMS: readonly Pictogram[] = [
  {
    "id": "aiga-telephone",
    "label": "Telephone",
    "group": "services"
  },
  {
    "id": "aiga-mail",
    "label": "Mail",
    "group": "services"
  },
  {
    "id": "aiga-currency-exchange",
    "label": "Currency Exchange",
    "group": "services"
  },
  {
    "id": "aiga-cashier",
    "label": "Cashier",
    "group": "services"
  },
  {
    "id": "aiga-first-aid",
    "label": "First Aid",
    "group": "safety"
  },
  {
    "id": "aiga-lost-and-found",
    "label": "Lost and Found",
    "group": "services"
  },
  {
    "id": "aiga-coat-check",
    "label": "Coat Check",
    "group": "services"
  },
  {
    "id": "aiga-baggage-lockers",
    "label": "Baggage Lockers",
    "group": "baggage"
  },
  {
    "id": "aiga-escalator",
    "label": "Escalator",
    "group": "circulation"
  },
  {
    "id": "aiga-escalator-down",
    "label": "Escalator Down",
    "group": "circulation"
  },
  {
    "id": "aiga-escalator-up",
    "label": "Escalator Up",
    "group": "circulation"
  },
  {
    "id": "aiga-stairs",
    "label": "Stairs",
    "group": "circulation"
  },
  {
    "id": "aiga-stairs-down",
    "label": "Stairs Down",
    "group": "circulation"
  },
  {
    "id": "aiga-stairs-up",
    "label": "Stairs Up",
    "group": "circulation"
  },
  {
    "id": "aiga-elevator",
    "label": "Elevator",
    "group": "circulation"
  },
  {
    "id": "aiga-toilets-men",
    "label": "Men",
    "group": "restrooms"
  },
  {
    "id": "aiga-toilets-women",
    "label": "Women",
    "group": "restrooms"
  },
  {
    "id": "aiga-toilets",
    "label": "Restrooms",
    "group": "restrooms"
  },
  {
    "id": "aiga-nursery",
    "label": "Nursery",
    "group": "services"
  },
  {
    "id": "aiga-drinking-fountain",
    "label": "Drinking Fountain",
    "group": "services"
  },
  {
    "id": "aiga-waiting-room",
    "label": "Waiting Room",
    "group": "services"
  },
  {
    "id": "aiga-information",
    "label": "Information",
    "group": "services"
  },
  {
    "id": "aiga-hotel-information",
    "label": "Hotel Information",
    "group": "services"
  },
  {
    "id": "aiga-air-transportation",
    "label": "Air Transportation",
    "group": "transport"
  },
  {
    "id": "aiga-heliport",
    "label": "Heliport",
    "group": "transport"
  },
  {
    "id": "aiga-taxi",
    "label": "Taxi",
    "group": "transport"
  },
  {
    "id": "aiga-bus",
    "label": "Bus",
    "group": "transport"
  },
  {
    "id": "aiga-ground-transportation",
    "label": "Ground Transportation",
    "group": "transport"
  },
  {
    "id": "aiga-rail-transportation",
    "label": "Rail Transportation",
    "group": "transport"
  },
  {
    "id": "aiga-water-transportation",
    "label": "Water Transportation",
    "group": "transport"
  },
  {
    "id": "aiga-car-rental",
    "label": "Car Rental",
    "group": "transport"
  },
  {
    "id": "aiga-restaurant",
    "label": "Restaurant",
    "group": "concessions"
  },
  {
    "id": "aiga-coffee-shop",
    "label": "Coffee Shop",
    "group": "concessions"
  },
  {
    "id": "aiga-bar",
    "label": "Bar",
    "group": "concessions"
  },
  {
    "id": "aiga-shops",
    "label": "Shops",
    "group": "concessions"
  },
  {
    "id": "aiga-barber-beauty",
    "label": "Barber / Salon",
    "group": "services"
  },
  {
    "id": "aiga-barber-shop",
    "label": "Barber Shop",
    "group": "services"
  },
  {
    "id": "aiga-beauty-salon",
    "label": "Beauty Salon",
    "group": "services"
  },
  {
    "id": "aiga-ticket-purchase",
    "label": "Ticket Purchase",
    "group": "travel"
  },
  {
    "id": "aiga-baggage-check-in",
    "label": "Baggage Check-in",
    "group": "baggage"
  },
  {
    "id": "aiga-baggage-claim",
    "label": "Baggage Claim",
    "group": "baggage"
  },
  {
    "id": "aiga-departing-flights",
    "label": "Departing Flights",
    "group": "travel"
  },
  {
    "id": "aiga-arriving-flights",
    "label": "Arriving Flights",
    "group": "travel"
  },
  {
    "id": "aiga-smoking",
    "label": "Smoking",
    "group": "regulatory"
  },
  {
    "id": "aiga-no-smoking",
    "label": "No Smoking",
    "group": "regulatory"
  },
  {
    "id": "aiga-parking",
    "label": "Parking",
    "group": "regulatory"
  },
  {
    "id": "aiga-no-parking",
    "label": "No Parking",
    "group": "regulatory"
  },
  {
    "id": "aiga-no-dogs",
    "label": "No Dogs",
    "group": "regulatory"
  },
  {
    "id": "aiga-no-entry",
    "label": "No Entry",
    "group": "regulatory"
  },
  {
    "id": "aiga-exit",
    "label": "Exit",
    "group": "safety"
  },
  {
    "id": "aiga-fire-extinguisher",
    "label": "Fire Extinguisher",
    "group": "safety"
  },
  {
    "id": "aiga-litter-disposal",
    "label": "Litter Disposal",
    "group": "services"
  },
  {
    "id": "aiga-arrow-right",
    "label": "Right",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-up-right",
    "label": "Up-Right",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-up",
    "label": "Up",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-up-left",
    "label": "Up-Left",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-left",
    "label": "Left",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-down-left",
    "label": "Down-Left",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-down",
    "label": "Down",
    "group": "arrows"
  },
  {
    "id": "aiga-arrow-down-right",
    "label": "Down-Right",
    "group": "arrows"
  }
] as const;

export const PICTOGRAM_IDS: readonly string[] = PICTOGRAMS.map((p) => p.id);
const _BY_ID = new Map(PICTOGRAMS.map((p) => [p.id, p] as const));
export const isPictogramId = (v: string): boolean => _BY_ID.has(v);
export const getPictogram = (id: string): Pictogram | undefined => _BY_ID.get(id);
