import { Cheerio, Element, load } from 'cheerio';

interface Recipe {
  name: string;
  description: string;
  imageUrl: string;
  url: string;
  ingredients: string[];
  instructions: string[];
}

interface PartialRecipeJSONLD {
  name: string;
  description: string;
  thumbnailUrl?: string;
  image?: { url: string };
  url: string;
  recipeIngredient: string[];
  recipeInstructions: (RecipeInstructionJSONLD | string)[];
  '@type': string;
}

interface RecipeInstructionJSONLD {
  '@type': string;
  text: string;
}

// Fetch the HTML content of a recipe page.
export async function fetchRecipePage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.text();
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Failed to fetch recipe page');
  }
}

export function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  for (const scriptTag of scriptTags.toArray()) {
    try {
      const childNode = scriptTag.firstChild;
      if (childNode && childNode.type === 'text') {
        const textNodeData = childNode.data as string;
        const parsedJson = JSON.parse(textNodeData);
        console.log('parsedJson:', parsedJson);
        // Directly check if the parsedJson is a Recipe
        if (parsedJson['@type'] === 'Recipe') {
          console.log('Directly found Recipe type JSON-LD');
          return parsedJson as PartialRecipeJSONLD;
        }

        // Check for an array or @graph only if the direct check fails
        if (Array.isArray(parsedJson) || parsedJson['@graph']) {
          const recipeJsonArray = Array.isArray(parsedJson)
            ? parsedJson
            : parsedJson['@graph'];
          for (const item of recipeJsonArray) {
            if (
              item['@type'] === 'Recipe' ||
              item['@type'].includes('Recipe')
            ) {
              return item as PartialRecipeJSONLD;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing JSON-LD script:', error);
    }
  }
  return null;
}

// Extract the recipe data from the HTML content of a webpage.
export function extractRecipeDataFromHTML(html: string): Recipe | null {
  const $ = load(html);
  const scriptTags = $('script[type="application/ld+json"]');
  const recipeJson = findRecipeJsonLd(scriptTags);
  if (!recipeJson) return null;
  return parseRecipeJson(recipeJson);
}

// Convert the JSON-LD recipe data into a Recipe object.
export function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  let imageUrl = '';
  console.log('jsonData:', jsonData);
  if (Array.isArray(jsonData.image) && jsonData.image.length > 0) {
    imageUrl = jsonData.image[0].url;
  } else if (jsonData?.image?.url) {
    imageUrl = jsonData.image.url;
  } else {
    imageUrl = jsonData.thumbnailUrl ?? '';
  }

  return {
    name: jsonData.name,
    description: jsonData.description,
    imageUrl,
    url: jsonData.url,
    ingredients: jsonData.recipeIngredient,
    instructions: jsonData.recipeInstructions.map((instruction) =>
      typeof instruction === 'string' ? instruction : instruction.text
    ),
  };
}
