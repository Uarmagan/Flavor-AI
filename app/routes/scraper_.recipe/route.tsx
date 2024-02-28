import { LoaderFunction, json } from '@remix-run/node';
import {
  fetchRecipePage,
  extractRecipeDataFromHTML,
} from '../scraper/scraper-utils';
import { useLoaderData } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { AspectRatio } from '~/components/ui/aspect-ratio';

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

  return (
    <div className='grid gap-6 p-4 md:p-6'>
      <div className='flex gap-4 pt-8'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold tracking-tighter md:text-4xl'>
            {recipeData.name}
          </h1>
          <p className='text-gray-900 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 text-balance mt-6'>
            {recipeData.description}
          </p>
        </div>
        {recipeData.imageUrl && (
          <div className='h-full flex-1'>
            <AspectRatio ratio={16 / 9} className='flex-1'>
              <img
                alt='Delicious Pasta'
                className='object-cover inset-0 rounded-lg w-full h-full'
                src={recipeData.imageUrl}
                width={400}
              />
            </AspectRatio>
          </div>
        )}
      </div>
      <div className='grid lg:gap-8 gap-20 md:grid-cols-2'>
        <div className='col-span-1 md:col-span-2 lg:col-span-1'>
          <h3 className='text-xl font-bold mb-2'>Ingredients</h3>
          <Card className='h-full w-full pt-4 my-4 border-gray-800'>
            <CardContent className='text-sm pb-0'>
              <ul className='list-inside space-y-4'>
                {recipeData.ingredients?.map(
                  (ingredient: string, index: number) => (
                    <li key={index}>{ingredient}</li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className='col-span-1 md:col-span-2 lg:col-span-1 '>
          <h3 className='text-xl font-bold mb-2'>Instructions</h3>
          <div className='h-full w-full py-4 my-4'>
            <div className='text-sm'>
              <ol className='list-decimal list-inside space-y-4'>
                {recipeData.instructions.map(
                  (instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  )
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
