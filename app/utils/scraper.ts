import { type Cheerio, load, type Element } from 'cheerio';
import {
  PartialRecipeJSONLD,
  Recipe,
  ImageObject,
  Instruction,
} from '~/types/recipe';

type ChildNode = {
  type: string;
  data: string;
};

const htmlEntities: Record<string, string> = {
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&#8211;': '-',
  '&hellip;': '…',
  '&#039;': "'",
  '&nbsp;': ' ',
  '&apos;': "'",
  '&cent;': '¢',
  '&pound;': '£',
  '&yen;': '¥',
  '&euro;': '€',
  '&copy;': '©',
  '&reg;': '®',
};

function decodeHtmlEntities(str: string): string {
  return str.replace(
    /&[a-zA-Z0-9#]+;/g,
    (entity) => htmlEntities[entity] || entity
  );
}

export async function fetchRecipePage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch recipe page: ${error}`);
    throw new Error(`Unable to fetch ${url}`);
  }
}

function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  for (const scriptTag of scriptTags.toArray()) {
    const childNode = scriptTag.firstChild as ChildNode | null;
    if (childNode?.type === 'text') {
      try {
        const parsedJson = JSON.parse(childNode.data) as Record<
          string,
          unknown
        >;
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

function extractRecipeData(data: unknown): PartialRecipeJSONLD | null {
  if (isPartialRecipeJSONLD(data)) {
    return data;
  }
  const jsonData = Array.isArray(data) ? data : [data];
  for (const item of jsonData) {
    if (typeof item === 'object' && item !== null) {
      if (isPartialRecipeJSONLD(item)) {
        return item;
      }
      // Deep traversal for nested objects
      for (const key in item) {
        if (key in item) {
          const nestedData = extractRecipeData(item[key]);
          if (nestedData) {
            return nestedData;
          }
        }
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
  try {
    const $ = load(html);
    const scriptTags = $('script[type="application/ld+json"]');
    const recipeJson = findRecipeJsonLd(scriptTags);
    return recipeJson ? parseRecipeJson(recipeJson) : null;
  } catch (error) {
    console.error(`Error extracting recipe data from HTML: ${error}`);
    return null;
  }
}

function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  const imageUrl = determineImageUrl(jsonData.image, jsonData.thumbnailUrl);
  return {
    name: jsonData.name,
    keywords: jsonData.keywords,
    url: jsonData.url,
    description: decodeHtmlEntities(jsonData.description ?? ''),
    imageUrl,
    instructions: flattenInstructionsArray(jsonData.recipeInstructions ?? []),
    ingredients: (jsonData.recipeIngredient ?? []).map(decodeHtmlEntities),
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
): string[] {
  return instructions.flatMap((instruction) => {
    if (typeof instruction === 'string') {
      return decodeHtmlEntities(instruction);
    }
    return parseInstruction(instruction);
  });
}

function parseInstruction(instruction: Instruction): string[] {
  if (isHowToSection(instruction)) {
    return (instruction.itemListElement ?? []).map((item) =>
      decodeHtmlEntities(item.text)
    );
  }
  if (isHowToStep(instruction)) {
    return [decodeHtmlEntities((instruction as Instruction).text)];
  }
  return [];
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
