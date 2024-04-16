export interface BaseRecipe {
  name: string;
  description: string;
  url: string;
  recipeIngredient: string[];
}

export interface ImageObject {
  url: string;
}

export interface Recipe {
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  cuisine?: string;
  category?: string;
  keywords?: string[];
  aggregateRating?: AggregateRating;
  nutrition?: NutritionInformation;
}

export interface Instruction {
  '@type': string;
  text: string;
  position?: number;
  name?: string;
  url?: string;
  itemListElement?: {
    '@type': string;
    text: string;
    position: number;
  }[];
}

export interface AggregateRating {
  ratingValue: string;
  reviewCount: number;
}

export interface NutritionInformation {
  calories: string;
  carbohydrateContent: string;
  fatContent: string;
  proteinContent: string;
  fiberContent: string;
  sugarContent: string;
  servingSize: string;
}

export interface PartialRecipeJSONLD extends BaseRecipe {
  thumbnailUrl?: string;
  image?: string | string[] | ImageObject | ImageObject[];
  recipeInstructions?: (string | Instruction)[];
  recipeCuisine?: string;
  recipeCategory?: string;
  keywords?: string[];
  aggregateRating?: AggregateRating;
  nutrition?: NutritionInformation;
}
