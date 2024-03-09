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

interface Recipe {
  name: string;
  description: string;
  url: string;
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
  itemListElement?: {
    '@type': string;
    text: string;
    position: number;
  }[];
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
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text();
  } catch (error) {
    console.error('Error fetching recipe page:', error);
    throw error;
  }
}

// Function to find the JSON-LD script tag containing recipe data
function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  for (const scriptTag of scriptTags.toArray()) {
    try {
      const childNode = scriptTag.firstChild;
      if (childNode && childNode.type === 'text') {
        const parsedJson = JSON.parse(childNode.data as string);
        if (parsedJson['@type']?.includes('Recipe')) {
          return parsedJson as PartialRecipeJSONLD;
        }
        if (Array.isArray(parsedJson) || parsedJson['@graph']) {
          const recipeJsonArray = Array.isArray(parsedJson)
            ? parsedJson
            : parsedJson['@graph'];
          for (const item of recipeJsonArray) {
            if (item['@type']?.includes('Recipe')) {
              return item as PartialRecipeJSONLD;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing JSON-LD script:', error);
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
function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  const imageUrl = determineImageUrl(jsonData.image, jsonData.thumbnailUrl);

  const flattenedInstructions = jsonData.recipeInstructions?.flat() ?? [];
  const instructions = flattenInstructionsArray(flattenedInstructions);

  const ingredients = jsonData.recipeIngredient?.map(decodeHtmlEntities) ?? [];
  const description = decodeHtmlEntities(jsonData.description);

  return {
    name: jsonData.name,
    keywords: jsonData.keywords,
    url: jsonData.url,
    description,
    imageUrl,
    instructions,
    ingredients,
    cuisine: jsonData.recipeCuisine,
    category: jsonData.recipeCategory,
    aggregateRating: jsonData.aggregateRating,
    nutrition: jsonData.nutrition,
  };
}

// Helper function to determine the image URL from various formats
function determineImageUrl(
  imageProp: string | string[] | ImageObject | ImageObject[] | undefined,
  fallbackUrl?: string
): string {
  if (Array.isArray(imageProp)) {
    for (const img of imageProp) {
      if (typeof img === 'string' || (img as ImageObject)?.url) {
        return typeof img === 'string' ? img : (img as ImageObject).url;
      }
    }
  }

  if (typeof imageProp === 'string') {
    return imageProp;
  }

  if ((imageProp as ImageObject)?.url) {
    return (imageProp as ImageObject).url;
  }

  return fallbackUrl ?? '';
}

// Helper function to flatten the instructions array
function flattenInstructionsArray(
  instructions: (string | Instruction)[]
): (string | Instruction)[] {
  return instructions.flatMap((instruction) => {
    if (typeof instruction === 'string') {
      return decodeHtmlEntities(instruction);
    } else if (instruction['@type'] === 'HowToSection') {
      return (
        instruction.itemListElement?.map((item) => {
          return decodeHtmlEntities(item.text);
        }) ?? []
      );
    } else if (
      typeof instruction === 'object' &&
      instruction['@type'] === 'HowToStep'
    ) {
      return decodeHtmlEntities(instruction.text);
    }
    return [];
  });
}

// Helper function to decode HTML entities in a string
function decodeHtmlEntities(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '-')
    .replace(/&hellip;/g, '…')
    .replace(/&#039;/g, "'");
}
