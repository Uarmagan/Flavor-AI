import { ActionFunction, MetaFunction, json } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import { RecipeView } from '~/components/recipe-view';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Recipe } from '~/types/recipe';
import { extractRecipeDataFromHTML, fetchRecipePage } from '~/utils/scraper';

// The action function that processes a submitted recipe URL and saves the recipe data.
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const recipeUrl = formData.get('url') as string;

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
export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};
export default function Index() {
  const fetcher = useFetcher<Recipe>();
  const isScraping = fetcher.state === 'submitting';

  return (
    <div className='flex items-start justify-center h-fit flex-col'>
      <div className='flex flex-col items-center w-full pt-10'>
        <div className='w-full flex justify-center'>
          <div className='max-w-sm sm:max-w-xl w-full'>
            <h2 className='text-2xl font-bold mb-4 font-oswald text-left'>
              The Recipe Scraper
            </h2>
          </div>
        </div>
        <fetcher.Form
          method='post'
          className='gap-x-2 flex w-full max-w-sm sm:max-w-xl items-center space-x-2'
        >
          <Input
            type='text'
            placeholder='Enter Recipe URL'
            name='url'
            className='tracking-wide'
          />
          <Button
            type='submit'
            className='bg-orange-500 text-white hover:bg-orange-400 px-4'
            name='intent'
            value='scrape-recipe'
          >
            {isScraping ? 'scraping the data...' : 'Submit'}
          </Button>
        </fetcher.Form>
      </div>

      <div
        className={`transition-opacity duration-300 ${
          fetcher.data && !isScraping ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {fetcher.data && <RecipeView recipeData={fetcher.data} />}
      </div>
    </div>
  );
}
