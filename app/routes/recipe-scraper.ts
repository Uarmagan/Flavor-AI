import { LoaderFunctionArgs, json } from '@remix-run/node';
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
async function fetchRecipePage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.text();
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Failed to fetch recipe page');
  }
}

// Find and return the JSON-LD data for a recipe within a set of script tags.
function findRecipeJsonLd(
  scriptTags: Cheerio<Element>
): PartialRecipeJSONLD | null {
  for (const scriptTag of scriptTags.toArray()) {
    try {
      const childNode = scriptTag.firstChild;
      if (childNode && childNode.type === 'text') {
        const textNodeData = childNode.data as string;
        const parsedJson = JSON.parse(textNodeData);
        if (Array.isArray(parsedJson) || parsedJson['@graph']) {
          const recipeJsonArray = Array.isArray(parsedJson)
            ? parsedJson
            : parsedJson['@graph'];
          for (const item of recipeJsonArray) {
            if (item['@type'] === 'Recipe') {
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
function extractRecipeDataFromHTML(html: string): Recipe | null {
  const $ = load(html);
  const scriptTags = $('script[type="application/ld+json"]');
  const recipeJson = findRecipeJsonLd(scriptTags);
  if (!recipeJson) return null;
  return parseRecipeJson(recipeJson);
}

// Convert the JSON-LD recipe data into a Recipe object.
function parseRecipeJson(jsonData: PartialRecipeJSONLD): Recipe {
  return {
    name: jsonData.name,
    description: jsonData.description,
    imageUrl: jsonData.thumbnailUrl ?? jsonData.image?.url ?? '',
    url: jsonData.url,
    ingredients: jsonData.recipeIngredient,
    instructions: jsonData.recipeInstructions.map((instruction) =>
      typeof instruction === 'string' ? instruction : instruction.text
    ),
  };
}

// The loader function that processes a recipe URL and returns the recipe data.
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const recipeUrl = url.searchParams.get('url');

  if (!recipeUrl) {
    throw new Error('No recipe URL provided');
  }

  const htmlContent = await fetchRecipePage(recipeUrl);
  const recipeData = extractRecipeDataFromHTML(htmlContent);

  if (!recipeData) {
    throw new Error('Recipe data not found');
  }

  return json(recipeData);
}
