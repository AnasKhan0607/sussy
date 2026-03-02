import animals from "./animals.json";
import foodDrinks from "./food-drinks.json";
import moviesTv from "./movies-tv.json";
import sports from "./sports.json";
import countriesCities from "./countries-cities.json";
import occupations from "./occupations.json";
import householdItems from "./household-items.json";
import music from "./music.json";
import nature from "./nature.json";
import technology from "./technology.json";
import fashionClothing from "./fashion-clothing.json";
import hobbiesActivities from "./hobbies-activities.json";
import type { CategoryData } from "@/lib/gameEngine";

export type { CategoryData };

export const categories: CategoryData[] = [
  animals,
  foodDrinks,
  moviesTv,
  sports,
  countriesCities,
  occupations,
  householdItems,
  music,
  nature,
  technology,
  fashionClothing,
  hobbiesActivities,
];

export {
  animals,
  foodDrinks,
  moviesTv,
  sports,
  countriesCities,
  occupations,
  householdItems,
  music,
  nature,
  technology,
  fashionClothing,
  hobbiesActivities,
};
