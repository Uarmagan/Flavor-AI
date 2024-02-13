import { load, type Cheerio, type Element } from 'cheerio';

interface BaseRecipe {
  name: string;
  description: string;
  url: string;
  recipeIngredient: string[];
}

interface ImageObject {
  url: string;
}

interface Recipe extends BaseRecipe {
  imageUrl: string;
  ingredients: string[];
  instructions: (string | Instruction)[];
  cuisine?: string;
  category?: string;
  keywords?: string[];
  aggregateRating?: AggregateRating;
  nutrition?: NutritionInformation;
}

interface Instruction {
  '@type': string;
  text: string;
  position?: number;
  name?: string;
  url?: string;
}

interface AggregateRating {
  ratingValue: string;
  reviewCount: number;
}

interface NutritionInformation {
  calories: string;
  carbohydrateContent: string;
  fatContent: string;
  proteinContent: string;
  fiberContent: string;
  sugarContent: string;
  servingSize: string;
}

// Define interface for partial recipe data in JSON-LD format
interface PartialRecipeJSONLD extends BaseRecipe {
  thumbnailUrl?: string;
  image?: string | string[] | ImageObject | ImageObject[];
  recipeInstructions?: (string | Instruction)[];
  recipeCuisine?: string;
  recipeCategory?: string;
  keywords?: string[];
  aggregateRating?: AggregateRating;
  nutrition?: NutritionInformation;
}

// Function to fetch the HTML content of a recipe page
export async function fetchRecipePage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return response.text();
}

// Function to find the JSON-LD script tag containing recipe data
export function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  // Iterate over each script tag
  for (const scriptTag of scriptTags.toArray()) {
    try {
      const childNode = scriptTag.firstChild;
      if (childNode && childNode.type === 'text') {
        const parsedJson = JSON.parse(childNode.data as string);
        // Check if the JSON-LD contains a recipe
        if (parsedJson['@type']?.includes('Recipe'))
          return parsedJson as PartialRecipeJSONLD;
        // If the JSON-LD is an array or has a graph property, search within it
        if (Array.isArray(parsedJson) || parsedJson['@graph']) {
          const recipeJsonArray = Array.isArray(parsedJson)
            ? parsedJson
            : parsedJson['@graph'];
          for (const item of recipeJsonArray) {
            if (item['@type']?.includes('Recipe'))
              return item as PartialRecipeJSONLD;
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing JSON-LD script:', error);
    }
  }
  return null;
}

// Function to extract recipe data from HTML content
export function extractRecipeDataFromHTML(html: string): Recipe | null {
  const $ = load(html);
  const scriptTags = $('script[type="application/ld+json"]');
  const recipeJson = findRecipeJsonLd(scriptTags);
  return recipeJson ? parseRecipeJson(recipeJson) : null;
}

// Function to parse JSON-LD data into a full Recipe object
export function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  const imageUrl = determineImageUrl(jsonData.image, jsonData.thumbnailUrl);
  const instructions =
    jsonData.recipeInstructions?.map((instruction) =>
      typeof instruction === 'string' ? instruction : instruction.text
    ) ?? [];

  const ingredients = jsonData.recipeIngredient ?? [];

  return {
    ...jsonData,
    imageUrl,
    instructions,
    ingredients, // Add this line to include the ingredients property
  };
}

// Helper function to determine the image URL from various formats
function determineImageUrl(
  imageProp: string | string[] | ImageObject | ImageObject[] | undefined,
  fallbackUrl: string | undefined
): string {
  if (Array.isArray(imageProp)) {
    const validImage = imageProp.find(
      (img) => typeof img === 'string' || (typeof img === 'object' && img.url)
    );
    return validImage
      ? typeof validImage === 'string'
        ? validImage
        : validImage.url
      : '';
  } else if (typeof imageProp === 'string') {
    return imageProp;
  } else if (typeof imageProp === 'object' && imageProp.url) {
    return imageProp.url;
  } else {
    return fallbackUrl ?? '';
  }
}
