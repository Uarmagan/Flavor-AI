import { type Cheerio, load, type Element } from 'cheerio';

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

type childNode = {
  type: string;
  data: string;
};

export async function fetchRecipePage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.text();
}

function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  for (const scriptTag of scriptTags.toArray()) {
    const childNode = scriptTag.firstChild as childNode | null;
    if (childNode?.type === 'text') {
      try {
        const parsedJson = JSON.parse(childNode.data as string);
        const recipeData = extractRecipeData(parsedJson);
        if (recipeData) {
          return recipeData;
        }
      } catch (error) {
        console.error('Error parsing JSON-LD script:', error);
      }
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRecipeData(jsonData: any): PartialRecipeJSONLD | null {
  if (isPartialRecipeJSONLD(jsonData)) {
    return jsonData;
  }
  if (Array.isArray(jsonData)) {
    const recipeItem = jsonData.find(isPartialRecipeJSONLD);
    if (recipeItem) {
      return recipeItem;
    }
  }
  if (Array.isArray(jsonData['@graph'])) {
    for (const item of jsonData['@graph']) {
      if (isPartialRecipeJSONLD(item)) {
        return item;
      }
    }
  }
  return null;
}

function isPartialRecipeJSONLD(obj: unknown): obj is PartialRecipeJSONLD {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@type' in obj &&
    (Array.isArray(obj['@type'])
      ? obj['@type'].includes('Recipe')
      : obj['@type'] === 'Recipe')
  );
}

export function extractRecipeDataFromHTML(html: string): Recipe | null {
  const $ = load(html);
  const scriptTags = $('script[type="application/ld+json"]');
  const recipeJson = findRecipeJsonLd(scriptTags);
  return recipeJson ? parseRecipeJson(recipeJson) : null;
}

function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  const imageUrl = determineImageUrl(jsonData.image, jsonData.thumbnailUrl);
  const ingredients = (jsonData.recipeIngredient ?? []).map(decodeHtmlEntities);
  const instructions = flattenInstructionsArray(
    jsonData.recipeInstructions ?? []
  );
  const description = decodeHtmlEntities(jsonData.description ?? '');

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

function determineImageUrl(
  imageProp: string | string[] | ImageObject | ImageObject[] | undefined,
  fallbackUrl = ''
): string {
  if (Array.isArray(imageProp)) {
    const imageUrl = imageProp.find(
      (img) =>
        typeof img === 'string' || (typeof img === 'object' && 'url' in img)
    );
    return typeof imageUrl === 'string'
      ? imageUrl
      : (imageUrl as ImageObject)?.url ?? fallbackUrl;
  }
  return typeof imageProp === 'string'
    ? imageProp
    : (imageProp as ImageObject)?.url ?? fallbackUrl;
}

function flattenInstructionsArray(
  instructions: (string | Instruction)[]
): (string | Instruction)[] {
  return instructions.flatMap((instruction) => {
    if (typeof instruction === 'string') {
      return decodeHtmlEntities(instruction);
    }
    if (isHowToSection(instruction)) {
      return (instruction.itemListElement ?? []).map((item) =>
        decodeHtmlEntities(item.text)
      );
    }
    if (isHowToStep(instruction)) {
      return decodeHtmlEntities((instruction as Instruction).text);
    }
    return [];
  });
}

function isHowToSection(obj: unknown): obj is Instruction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@type' in obj &&
    obj['@type'] === 'HowToSection'
  );
}

function isHowToStep(obj: unknown): obj is Instruction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '@type' in obj &&
    obj['@type'] === 'HowToStep'
  );
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '-')
    .replace(/&hellip;/g, '…')
    .replace(/&#039;/g, "'");
}
