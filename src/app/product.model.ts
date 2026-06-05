export type ProductId =
  | 'maurten-gel-100-caf-100'
  | 'maurten-gel-160'
  | 'maurten-drink-mix-320-caf-100'
  | 'maurten-solid-160'
  | 'maurten-solid-c-160'
  | 'baouw-puree-raspberry-strawberry-basil'
  | 'baouw-electrolytes-blackberry'
  | 'decathlon-fruit-jellies-citrus';

export type ProductKind = 'gel' | 'drink' | 'solid' | 'puree' | 'electrolyte' | 'jelly';

export interface Nutrition {
  calories: number;
  carbs: number;
  sugar: number;
  fiber: number;
  fat: number;
  protein: number;
  sodium: number;
  caffeine: number;
  salt: number;
  potassium: number;
  magnesium: number;
  calcium: number;
}

export interface FuelProduct {
  id: ProductId;
  brand: string;
  name: string;
  kind: ProductKind;
  serving: string;
  sourceLabel: string;
  sourceUrl: string;
  nutrition: Nutrition;
}

export type ProductQuantities = Record<ProductId, number>;
