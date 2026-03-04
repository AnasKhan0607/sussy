import friends from "./friends.json";
import spicy from "./spicy.json";
import hypothetical from "./hypothetical.json";

export interface QuestionPair {
  normal: string;
  oddOneOut: string;
}

export interface QuestionCategory {
  category: string;
  emoji: string;
  questions: QuestionPair[];
}

export const categories: QuestionCategory[] = [
  friends,
  spicy,
  hypothetical,
];

export { friends, spicy, hypothetical };
