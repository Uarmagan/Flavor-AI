import { ActionFunction, MetaFunction, redirect } from '@remix-run/node';
import { Form, useNavigation } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

// The action function that processes a submitted recipe URL and saves the recipe data.
export const action: ActionFunction = async ({ request }) => {
  // Extract the form data from the request
  const formData = await request.formData();
  const recipeUrl = formData.get('url') as string;

  if (!recipeUrl) {
    throw new Error('No recipe URL provided');
  }
  return redirect('/scraper/recipe?url=' + recipeUrl);
};

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  const navigation = useNavigation();
  const isScraping = navigation.formData?.get('intent') === 'scrape-recipe';
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='flex flex-col items-start mx-auto'>
        <h2 className='text-2xl font-bold mb-4 font-oswald'>
          The Recipe Scraper
        </h2>
        <Form className='w-full flex gap-x-2 ' method='POST'>
          <Input
            type='text'
            placeholder='Enter Recipe URL'
            name='url'
            className='w-[400px] tracking-wide'
          />
          <Button
            type='submit'
            className='bg-orange-500 text-white hover:bg-orange-400 px-4'
            name='intent'
            value='scrape-recipe'
          >
            {isScraping ? 'scraping the data...' : 'Submit'}
          </Button>
        </Form>
      </div>
    </div>
  );
}
