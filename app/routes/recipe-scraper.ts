import { LoaderFunctionArgs, json } from '@remix-run/node';
import { load } from 'cheerio';

// Define a structure for recipe data
interface Recipe {
  name: string;
  description: string;
  imageUrl: string;
  url: string;
  ingredients: string[];
  instructions: string[];
}

// Define a structure for a part of the recipe in JSON-LD format
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

// Define a structure for recipe instructions in JSON-LD format
interface RecipeInstructionJSONLD {
  '@type': string;
  text: string;
}

// Fetch HTML content from the URL
async function fetchRecipePage(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

// Extract recipe data from the HTML content
function extractRecipeDataFromHTML(html: string): Recipe | null {
  const $ = load(html);
  const scriptTagContent = $('script[type="application/ld+json"]').html();

  try {
    let parsedJson = JSON.parse(scriptTagContent as string);

    // Check if parsedJson contains @graph, and search within it
    if (parsedJson['@graph']) {
      parsedJson = parsedJson['@graph'].find(
        (item: PartialRecipeJSONLD) => item['@type'] === 'Recipe'
      );
    } else if (Array.isArray(parsedJson)) {
      parsedJson = parsedJson.find(
        (item: PartialRecipeJSONLD) =>
          item['@type'] === 'Recipe' || item['@type'].includes('Recipe')
      );
    }

    if (
      parsedJson &&
      (parsedJson['@type'] === 'Recipe' ||
        parsedJson['@type'].includes('Recipe'))
    ) {
      return parseRecipeJson(parsedJson);
    }
  } catch (error) {
    console.error('Error parsing JSON-LD content:', error);
  }
  return null;
}

// Parse and structure the recipe data from JSON
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

// Main loader function
export async function loader({ request }: LoaderFunctionArgs) {
  // Retrieve the URL from the query parameters
  const url = new URL(request.url);
  const recipeUrl = url.searchParams.get('url');

  if (!recipeUrl) {
    throw new Error('No recipe URL provided');
  }
  const htmlContent = await fetchRecipePage(recipeUrl);

  if (!htmlContent) {
    throw new Error('Unable to fetch recipe page content');
  }

  const recipeData = extractRecipeDataFromHTML(htmlContent);

  if (!recipeData) {
    throw new Error('Recipe data not found');
  }

  return json(recipeData);
}
