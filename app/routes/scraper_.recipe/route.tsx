import { LoaderFunction, json } from '@remix-run/node';
import {
  fetchRecipePage,
  extractRecipeDataFromHTML,
} from '../scraper/scraper-utils';
import { useLoaderData } from '@remix-run/react';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

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

  return json(recipeData);
};

export default function RecipeRoute() {
  const recipeData = useLoaderData<typeof loader>();
  console.log(recipeData);

  return (
    <div className='grid gap-6 p-4 md:p-6'>
      <h1 className='text-3xl font-bold tracking-tighter md:text-4xl'>
        {recipeData.name}
      </h1>
      {recipeData.imageUrl && (
        <img
          alt='Delicious Pasta'
          className='object-cover w-full h-64 rounded-lg'
          height={400}
          src={recipeData.imageUrl}
          style={{
            aspectRatio: '500/400',
            objectFit: 'cover',
          }}
          width={500}
        />
      )}
      <p className='text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400'>
        {recipeData.description}
      </p>
      <div className='grid gap-6 md:grid-cols-3'>
        <Card className='h-full w-full md:col-span-1'>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className='text-sm'>
            <ul className='list-disc list-inside'>
              {recipeData.ingredients.map(
                (ingredient: string, index: number) => (
                  <li key={index}>{ingredient}</li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
        <Card className='h-full w-full md:col-span-2'>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className='text-sm'>
            <ol className='list-decimal list-inside'>
              {recipeData.instructions.map(
                (instruction: string, index: number) => (
                  <li key={index}>{instruction}</li>
                )
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
