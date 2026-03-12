import { create } from "zustand";
import type {
  FuelType,
  CarCondition,
  ElectricAgencyStatus,
  QuoteResult,
} from "@/lib/quote-engine";

interface QuoteState {
  // Inputs
  makeId: string | null;
  modelId: string | null;
  carValue: number;
  fuelType: FuelType;
  carCondition: CarCondition;
  manufacturingYear: number;
  electricAgencyStatus?: ElectricAgencyStatus;

  // Results
  quotes: QuoteResult[];
  carAge: number;
  isLoading: boolean;
  hasSearched: boolean;

  // Actions
  setField: <
    K extends keyof Omit<
      QuoteState,
      | "quotes"
      | "carAge"
      | "isLoading"
      | "hasSearched"
      | "setField"
      | "setResults"
      | "setIsLoading"
    >,
  >(
    field: K,
    value: QuoteState[K],
  ) => void;
  setResults: (quotes: QuoteResult[], carAge: number) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  makeId: null,
  modelId: null,
  carValue: 1000000,
  fuelType: "gasoline",
  carCondition: "new",
  manufacturingYear: new Date().getFullYear(),
  electricAgencyStatus: "agency",

  quotes: [],
  carAge: 0,
  isLoading: false,
  hasSearched: false,

  setField: (field, value) => {
    // If the user changes any input field, reset the search state so the initial placeholder returns
    set((state) => {
      if (state[field] === value) return state;
      return {
        ...state,
        [field]: value,
        hasSearched: false,
        quotes: [],
      };
    });
  },
  setResults: (quotes, carAge) =>
    set({ quotes, carAge, isLoading: false, hasSearched: true }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    makeId: null,
    modelId: null,
    carValue: 1000000,
    fuelType: "gasoline",
    carCondition: "new",
    manufacturingYear: new Date().getFullYear(),
    electricAgencyStatus: "agency",
    quotes: [],
    carAge: 0,
    isLoading: false,
    hasSearched: false,
  }),
}));
