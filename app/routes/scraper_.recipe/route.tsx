import { LoaderFunction, json } from '@remix-run/node';
import {
  fetchRecipePage,
  extractRecipeDataFromHTML,
} from '../scraper/scraper-utils';
import { useLoaderData } from '@remix-run/react';

export const loader: LoaderFunction = async ({ request }) => {
  const urlPath = new URL(request.url);
  const recipeUrl = urlPath.searchParams.get('url');
  if (!recipeUrl) {
    throw new Error('No recipe URL provided');
  }
  const htmlContent = await fetchRecipePage(recipeUrl);
  const recipeData = extractRecipeDataFromHTML(htmlContent);

  if (!recipeData) {
    throw new Error('Recipe data not found');
  }

  return json({ recipeData });
};

export default function RecipeRoute() {
  // get loader data
  const data = useLoaderData<typeof loader>();
  console.log(data);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className='scroll-m-20 text-4xl font-extrabold  font-oswald'>
        Heres the recipe
      </h1>
      <h2 className='text-2xl font-bold mb-1'>The Recipe Scraper</h2>
    </div>
  );
}
