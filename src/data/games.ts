export interface Game {
  id: string;
  emoji: string;
  icon?: string;
  name: string;
  tagline: string;
  players: string;
  color: string;
  featured: boolean;
  description: string;
}

export interface ComingSoonGame {
  emoji: string;
  name: string;
  color: string;
}

export const games: Game[] = [
  {
    id: "imposter",
    emoji: "\ud83d\udd75\ufe0f",
    icon: "/images/imposter.png",
    name: "Imposter",
    tagline: "Find the fake",
    players: "3\u201320",
    color: "#8B5CF6",
    featured: true,
    description:
      "Everyone gets a secret word\u2014except the imposter. Discuss, deduce, and vote to find the fake before they blend in.",
  },
  {
    id: "odd-one-out",
    emoji: "\ud83e\udd14",
    icon: "/images/odd-one-out.png",
    name: "Odd One Out",
    tagline: "Spot the different question",
    players: "3\u201315",
    color: "#F59E0B",
    featured: false,
    description:
      "Everyone gets the same question\u2014except one player. Answer, discuss, and figure out who got the odd question.",
  },
  {
    id: "spin-and-guess",
    emoji: "\ud83c\udfaf",
    icon: "/images/wavelength.png",
    name: "Wavelength",
    tagline: "Spin, clue, guess the wavelength",
    players: "3\u201310",
    color: "#06B6D4",
    featured: false,
    description:
      "Spin the wheel, give creative clues, and race to guess the secret number. The closer you get, the more you score.",
  },
];

export const comingSoon: ComingSoonGame[] = [
  { emoji: "\ud83c\udfad", name: "Bluff Master", color: "#EC4899" },
  { emoji: "\u26a1", name: "Rapid Fire", color: "#F97316" },
];
