// Savings estimates, with the same formulas and default assumptions as the pitch deck (appendix A).
// Deck check: carrier 25 trucks / 2 dispatchers -> 37,500 + 22,680 = 60,180 EUR.
// Forwarder 433 loads / EUR 2,250 / 4 dispatchers -> 81,837 + 45,360 = 127,197 EUR.

export const WORKDAYS_PER_MONTH = 21;
export const HOURS_PER_FTE_MONTH = 168;

export interface TimeInputs {
  dispatchers: number;
  /** Hours per dispatcher per day spent searching, comparing and calling about loads. */
  searchHoursPerDay: number;
  /** Share of that work Cursus takes over (deck: 50 %, below vendor-reported figures). */
  automation: number;
  /** Fully loaded cost per dispatcher hour in EUR (deck: 30). */
  hourCost: number;
}

export interface CarrierInputs extends TimeInputs {
  trucks: number;
  kmPerTruck: number;
  costPerKm: number;
  /** Share of kilometres saved (deck: 1 %). */
  kmSaving: number;
}

export interface ForwarderInputs extends TimeInputs {
  loadsPerMonth: number;
  avgFreight: number;
  /** Gross margin on a load (deck partner data: 30 %). */
  grossMargin: number;
  /** How much cheaper subcontractors are bought (deck: 1 %). */
  purchaseSaving: number;
}

export function timeSavings(i: TimeInputs) {
  const hoursPerMonth = i.dispatchers * i.searchHoursPerDay * i.automation * WORKDAYS_PER_MONTH;
  return {
    hoursPerMonth,
    fte: hoursPerMonth / HOURS_PER_FTE_MONTH,
    valuePerYear: hoursPerMonth * 12 * i.hourCost,
  };
}

export function carrierSavings(i: CarrierInputs) {
  const time = timeSavings(i);
  const kmPerYear = i.trucks * i.kmPerTruck * i.kmSaving;
  const kmValue = kmPerYear * i.costPerKm;
  return { ...time, kmPerYear, kmValue, perTruck: i.kmPerTruck * i.kmSaving * i.costPerKm, total: kmValue + time.valuePerYear };
}

export function forwarderSavings(i: ForwarderInputs) {
  const time = timeSavings(i);
  const purchaseValue = i.loadsPerMonth * 12 * i.avgFreight * (1 - i.grossMargin) * i.purchaseSaving;
  return { ...time, purchaseValue, total: purchaseValue + time.valuePerYear };
}

export const CARRIER_DEFAULTS: CarrierInputs = {
  trucks: 25,
  kmPerTruck: 100000,
  costPerKm: 1.5,
  kmSaving: 0.01,
  dispatchers: 2,
  searchHoursPerDay: 3,
  automation: 0.5,
  hourCost: 30,
};

export const FORWARDER_DEFAULTS: ForwarderInputs = {
  loadsPerMonth: 430,
  avgFreight: 2250,
  grossMargin: 0.3,
  purchaseSaving: 0.01,
  dispatchers: 4,
  searchHoursPerDay: 3,
  automation: 0.5,
  hourCost: 30,
};
