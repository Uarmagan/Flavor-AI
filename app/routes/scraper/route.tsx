import { ActionFunction, MetaFunction, redirect } from '@remix-run/node';
import { Form, Outlet, useNavigation } from '@remix-run/react';
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
  return redirect('/recipe?url=' + recipeUrl);
};

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className='scroll-m-20 text-4xl font-extrabold  font-oswald'>
        Flavor.ly
      </h1>
      <h2 className='text-2xl font-bold mb-1'>The Recipe Scraper</h2>
      <Form
        className='flex w-full max-w-sm items-center space-x-2 '
        method='POST'
      >
        {/* The name attribute is crucial for the action to identify the field */}
        <Input type='text' placeholder='Enter recipe URL' name='url' />
        <Button
          type='submit'
          className=' bg-orange-500 text-white hover:bg-orange-400'
          name='intent'
          value='scrape-recipe'
        >
          Submit
        </Button>
      </Form>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
