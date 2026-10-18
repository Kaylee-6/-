export type Currency = 'CAD' | 'JPY' | 'CNY';

/** Booking state shown everywhere: Confirmed / Planned / Optional. */
export type Status = 'confirmed' | 'planned' | 'optional';

/** Payment state. `unverified` = booked but whether the card was charged is unknown. */
export type Payment = 'paid' | 'unverified' | 'unpaid' | 'estimate';

export type ActivityKind =
  | 'flight'
  | 'drive'
  | 'car'
  | 'hotel'
  | 'ski'
  | 'sight'
  | 'food'
  | 'shopping'
  | 'onsen'
  | 'note';

export type SceneId =
  | 'hero'
  | 'otaru'
  | 'sapporo'
  | 'niseko'
  | 'rusutsu'
  | 'toya'
  | 'flight'
  | 'hotel-otaru'
  | 'hotel-sapporo'
  | 'hotel-niseko'
  | 'hotel-toya';

export interface Activity {
  id: string;
  /** "HH:mm" local time at the place of the activity, or '' when unscheduled. */
  time: string;
  endTime: string;
  title: string;
  titleEn: string;
  kind: ActivityKind;
  status: Status;
  /** Short flags such as 待确认 / 未购买 / 待核实. */
  tags: string[];
  /** Google Maps search text. Empty = no map button. */
  place: string;
  note: string;
  important?: boolean;
  /** Explore spot this activity was added from, if any. */
  spotId?: string;
}

export interface Day {
  id: string;
  index: number;
  date: string; // YYYY-MM-DD (local date of the day)
  title: string;
  titleEn: string;
  route: string;
  transport: string;
  regionId: string;
  hotelId: string | null;
  theme: string;
  warnings: string[];
  activities: Activity[];
  notes: string;
}

export interface Spot {
  id: string;
  regionId: string;
  name: string;
  nameEn: string;
  kind: ActivityKind;
  desc: string;
  place: string;
}

export interface Region {
  id: string;
  name: string;
  nameEn: string;
  nameJa: string;
  scene: SceneId;
  keywords: string[];
  intro: string;
  experiences: string[];
  foods: string[];
  dayIds: string[];
  links: LinkRef[];
}

export interface LinkRef {
  label: string;
  url: string;
}

export interface CancelPolicy {
  refundable: boolean;
  /** Last day stated on the order ("YYYY-MM-DD 前"). */
  deadlineDate: string;
  /** Exact time from the order, blank until the user fills it in. */
  deadlineTime: string;
  /** UTC offset label from the order, e.g. "+09:00"; blank until filled in. */
  deadlineOffset: string;
  note: string;
}

export interface Hotel {
  id: string;
  name: string;
  nameZh: string;
  city: string;
  cityZh: string;
  regionId: string;
  scene: SceneId;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  checkInTime: string; // '' = 待确认
  checkOutTime: string;
  roomType: string;
  breakfast: 'included' | 'none';
  breakfastNote: string;
  platform: string;
  platformUrl: string;
  /** Amount in the order's own currency. */
  price: number;
  priceCurrency: Currency;
  /** CAD amount from the user's own ledger; used instead of converting. */
  cadLedger: number | null;
  payment: Payment;
  status: Status;
  cancel: CancelPolicy;
  address: string;
  mapQuery: string;
  website: string;
  phone: string;
  phoneSource: string;
  locationNote: string;
  parking: string;
  highlights: string[];
  reminders: string[];
  /** Credits already applied to the cash amount (shown only, never deducted again). */
  credits: { label: string; amount: number; currency: Currency }[];
  confirmationNo: string;
  guestName: string;
  notes: string;
}

export interface FlightOption {
  id: string;
  airline: string;
  airlineZh: string;
  cabin: string;
  pricePerPerson: number;
  currency: Currency;
  baggage: string;
  connection: string;
  arrival: string; // ISO with offset
  pros: string;
  website: string;
}

export interface FlightBooking {
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  departLocal: string; // "YYYY-MM-DDTHH:mm"
  departOffset: string; // "+09:00"
  arriveLocal: string;
  arriveOffset: string;
  connection: string;
  cashTotal: number | null;
  cashPerPerson: boolean;
  currency: Currency;
  points: number | null;
  pointsProgram: string;
  baggage: string;
  seats: string;
  confirmationNo: string;
  status: Status;
  payment: Payment;
  note: string;
}

export interface Car {
  platform: string;
  platformUrl: string;
  company: string;
  companyUrl: string;
  vehicle: string;
  vehicleNote: string;
  seats: number;
  luggageCapacity: number;
  transmission: string;
  pickupAt: string; // ISO with offset
  returnAt: string;
  pickupPlace: string;
  pickupNote: string;
  price: number;
  currency: Currency;
  payment: Payment;
  status: Status;
  confirmationNo: string;
  notes: string;
  checks: CheckItem[];
  amexChecks: CheckItem[];
}

export interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  note?: string;
}

export interface DriveLeg {
  id: string;
  dayId: string;
  from: string;
  to: string;
  origin: string;
  destination: string;
  estimate: string;
  note: string;
}

export interface Traveler {
  id: string;
  label: string;
  role: string;
  name: string;
  age: number | null;
  passes: string;
  notes: string;
}

export interface Luggage {
  suitcase28: number;
  boardBag: number;
  skiBag: number;
  carryOn: number;
}

export type SkiCoverStatus = 'pass-verify' | 'pass-pending' | 'to-buy' | 'bought' | 'unset';

export interface SkiCover {
  method: string;
  status: SkiCoverStatus;
  note: string;
}

export interface SkiDay {
  dayId: string;
  resortId: string;
  area: string;
  departFrom: string;
  departTime: string;
  returnTo: string;
  returnTime: string;
  note: string;
  cover: Record<string, SkiCover>; // travelerId -> cover
}

export interface Resort {
  id: string;
  name: string;
  nameZh: string;
  regionId: string;
  scene: SceneId;
  intro: string;
  areas: { name: string; desc: string }[];
  terrain: string[];
  passNote: string;
  links: LinkRef[];
  mapQuery: string;
}

export type BudgetCategory =
  | 'hotel'
  | 'car'
  | 'flight'
  | 'ski'
  | 'fuel'
  | 'toll'
  | 'parking'
  | 'visa'
  | 'food'
  | 'sight'
  | 'shopping'
  | 'insurance'
  | 'other';

/** Hand-editable budget line (estimates and anything not derived from a booking). */
export interface BudgetLine {
  id: string;
  category: BudgetCategory;
  name: string;
  amount: number | null;
  currency: Currency;
  perPerson: boolean;
  rangeLow: number | null;
  rangeHigh: number | null;
  payment: Payment;
  note: string;
}

export interface Expense {
  id: string;
  lineId: string | null;
  category: BudgetCategory;
  date: string;
  title: string;
  amount: number;
  currency: Currency;
  note: string;
}

export type ChecklistGroup =
  | 'docs'
  | 'flight'
  | 'hotel'
  | 'car'
  | 'ski'
  | 'insurance'
  | 'luggage'
  | 'gear'
  | 'food'
  | 'plan';

export interface ChecklistItem {
  id: string;
  group: ChecklistGroup;
  label: string;
  done: boolean;
  due: string;
  priority: boolean;
  note: string;
  link: string;
}

export interface Rate {
  /** Units of this currency per 1 CAD. null = not set. */
  perCad: number | null;
  source: string;
  asOf: string;
}

export interface Settings {
  displayCurrency: Currency;
  theme: 'system' | 'light' | 'dark';
  rates: Record<'JPY' | 'CNY', Rate>;
  outboundBudgetOption: string;
}

export interface AppState {
  version: number;
  travelers: Traveler[];
  luggage: Luggage;
  days: Day[];
  hotels: Hotel[];
  outboundOptions: FlightOption[];
  outbound: FlightBooking | null;
  returnFlight: FlightBooking;
  car: Car;
  legs: DriveLeg[];
  skiDays: SkiDay[];
  budgetLines: BudgetLine[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  gear: CheckItem[];
  /** Custom cover photos keyed like 'hotel:otaru' / 'region:toya' / 'hero' (URL or compressed data URL). */
  images: Record<string, string>;
  settings: Settings;
}
