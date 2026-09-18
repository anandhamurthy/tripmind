/** Climate-aware default packing kits, keyed off the trip's destination country. */

export const DEFAULT_SECTION_NAMES = [
  'Clothing',
  'Business Essentials',
  'Toiletries & Health',
  'Documents',
  'Electronics',
  'Miscellaneous',
] as const

export type DefaultSectionName = (typeof DEFAULT_SECTION_NAMES)[number]

export type ClimateKey = 'tropical' | 'temperate' | 'winter' | 'desert' | 'default'

export interface KitItem {
  section: DefaultSectionName
  label: string
  note?: string
}

const TROPICAL = ['thailand', 'singapore', 'malaysia', 'indonesia', 'philippines', 'vietnam']
const TEMPERATE = [
  'uk',
  'united kingdom',
  'england',
  'scotland',
  'britain',
  'france',
  'germany',
  'netherlands',
  'holland',
  'italy',
  'spain',
  'belgium',
  'ireland',
  'portugal',
]
const WINTER = ['canada', 'sweden', 'norway', 'finland', 'denmark', 'iceland', 'russia', 'scandinavia']
const DESERT = ['uae', 'united arab emirates', 'dubai', 'saudi arabia', 'saudi', 'qatar', 'bahrain', 'kuwait', 'oman']

/**
 * Japan is seasonal: Dec–Feb is treated as a hard winter destination,
 * the rest of the year as temperate.
 */
export const resolveClimate = (country: string, startMonth: number | null): ClimateKey => {
  const c = country.trim().toLowerCase()
  if (!c) return 'default'
  const has = (list: string[]) => list.some((entry) => c === entry || c.includes(entry))

  if (c.includes('japan')) {
    return startMonth !== null && (startMonth === 12 || startMonth === 1 || startMonth === 2)
      ? 'winter'
      : 'temperate'
  }
  if (has(WINTER)) return 'winter'
  if (has(DESERT)) return 'desert'
  if (has(TROPICAL)) return 'tropical'
  if (has(TEMPERATE)) return 'temperate'
  return 'default'
}

export const CLIMATE_LABEL: Record<ClimateKey, string> = {
  tropical: 'Tropical / humid',
  temperate: 'Cool & rainy (Europe)',
  winter: 'Cold winter',
  desert: 'Desert / Middle East',
  default: 'Neutral travel kit',
}

/** Items every trip needs, regardless of climate. */
const UNIVERSAL: KitItem[] = [
  { section: 'Business Essentials', label: 'Laptop + charger' },
  { section: 'Business Essentials', label: 'Business cards', note: '2 boxes for a multi-day event' },
  { section: 'Business Essentials', label: 'Notebook + pens' },
  { section: 'Business Essentials', label: 'Presentation clicker' },
  { section: 'Business Essentials', label: 'Lanyard & event badge' },

  { section: 'Toiletries & Health', label: 'Toothbrush + toothpaste' },
  { section: 'Toiletries & Health', label: 'Deodorant' },
  { section: 'Toiletries & Health', label: 'Shampoo + body wash', note: 'Under 100ml for cabin bags' },
  { section: 'Toiletries & Health', label: 'Prescription medication' },
  { section: 'Toiletries & Health', label: 'Painkillers & antacids' },
  { section: 'Toiletries & Health', label: 'Hand sanitiser' },

  { section: 'Documents', label: 'Passport', note: 'Check 6-month validity' },
  { section: 'Documents', label: 'Visa / entry approval' },
  { section: 'Documents', label: 'Flight tickets (printed + digital)' },
  { section: 'Documents', label: 'Hotel booking confirmation' },
  { section: 'Documents', label: 'Travel insurance policy' },
  { section: 'Documents', label: 'Event registration confirmation' },
  { section: 'Documents', label: 'Forex card + backup credit card' },

  { section: 'Electronics', label: 'Phone + charger' },
  { section: 'Electronics', label: 'Universal travel adapter' },
  { section: 'Electronics', label: 'Power bank', note: 'Cabin baggage only' },
  { section: 'Electronics', label: 'Noise-cancelling headphones' },
  { section: 'Electronics', label: 'USB-C / HDMI dongle', note: 'For the venue projector' },

  { section: 'Miscellaneous', label: 'Reusable water bottle' },
  { section: 'Miscellaneous', label: 'Laundry bag' },
  { section: 'Miscellaneous', label: 'Snacks for the flight' },
  { section: 'Miscellaneous', label: 'Foldable tote for conference swag' },
]

const CLIMATE_ITEMS: Record<ClimateKey, KitItem[]> = {
  tropical: [
    { section: 'Clothing', label: 'Light cotton shirts x5' },
    { section: 'Clothing', label: 'Shorts x3' },
    { section: 'Clothing', label: 'Sandals' },
    { section: 'Clothing', label: 'Light jacket for AC', note: 'Conference halls run cold' },
    { section: 'Clothing', label: 'Formal business wear x2' },
    { section: 'Toiletries & Health', label: 'Sunscreen SPF50' },
    { section: 'Toiletries & Health', label: 'Insect repellent' },
    { section: 'Miscellaneous', label: 'Umbrella', note: 'Afternoon downpours are routine' },
    { section: 'Miscellaneous', label: 'Sunglasses' },
  ],
  temperate: [
    { section: 'Clothing', label: 'Layered shirts x5' },
    { section: 'Clothing', label: 'Trousers x3' },
    { section: 'Clothing', label: 'Waterproof jacket' },
    { section: 'Clothing', label: 'Warm mid-layer fleece' },
    { section: 'Clothing', label: 'Scarf' },
    { section: 'Clothing', label: 'Waterproof shoes' },
    { section: 'Clothing', label: 'Formal business wear x2' },
    { section: 'Miscellaneous', label: 'Compact umbrella' },
  ],
  winter: [
    { section: 'Clothing', label: 'Heavy coat' },
    { section: 'Clothing', label: 'Thermal underlayer x3' },
    { section: 'Clothing', label: 'Multiple warm layers', note: 'Merino beats cotton' },
    { section: 'Clothing', label: 'Gloves' },
    { section: 'Clothing', label: 'Beanie' },
    { section: 'Clothing', label: 'Snow boots' },
    { section: 'Clothing', label: 'Formal business wear x2' },
    { section: 'Miscellaneous', label: 'Hand warmers' },
    { section: 'Toiletries & Health', label: 'Heavy moisturiser + lip balm' },
  ],
  desert: [
    { section: 'Clothing', label: 'Loose light clothing x5' },
    { section: 'Clothing', label: 'Formal business wear x3' },
    { section: 'Clothing', label: 'Light scarf for mosques', note: 'Shoulders and knees covered' },
    { section: 'Clothing', label: 'Closed comfortable shoes' },
    { section: 'Toiletries & Health', label: 'High SPF sunscreen' },
    { section: 'Toiletries & Health', label: 'Lip balm' },
    { section: 'Miscellaneous', label: 'Sunglasses' },
  ],
  default: [
    { section: 'Clothing', label: 'Shirts x5' },
    { section: 'Clothing', label: 'Trousers x3' },
    { section: 'Clothing', label: 'Formal business wear x2' },
    { section: 'Clothing', label: 'Comfortable walking shoes' },
    { section: 'Clothing', label: 'Light jacket' },
    { section: 'Clothing', label: 'Sleepwear' },
    { section: 'Miscellaneous', label: 'Compact umbrella' },
    { section: 'Miscellaneous', label: 'Sunglasses' },
  ],
}

export const buildPackingKit = (country: string, startMonth: number | null): KitItem[] => {
  const climate = resolveClimate(country, startMonth)
  return [...CLIMATE_ITEMS[climate], ...UNIVERSAL]
}
