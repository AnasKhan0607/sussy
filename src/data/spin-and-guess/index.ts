import categoriesData from "./categories.json";
import scalesData from "./scales.json";

export interface Category {
  id: string;
  label: string;
  emoji: string;
  scales: string[];
}

export interface Scale {
  id: string;
  label: string;
  low: string;
  high: string;
}

export const categories: Category[] = categoriesData;
export const scales: Scale[] = scalesData;

export function getScale(id: string): Scale | undefined {
  return scales.find((s) => s.id === id);
}

export function getCategoryScales(category: Category): Scale[] {
  return category.scales
    .map((id) => scales.find((s) => s.id === id))
    .filter((s): s is Scale => s !== undefined);
}
