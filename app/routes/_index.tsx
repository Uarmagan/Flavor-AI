import { ActionFunction, MetaFunction, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { fetchRecipePage, extractRecipeDataFromHTML } from '~/utils/scraper';

// The action function that processes a submitted recipe URL and saves the recipe data.
export const action: ActionFunction = async ({ request }) => {
  // Extract the form data from the request
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
  const actionData = useActionData<typeof action>();
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1 className='scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl font-oswald'>
        Flavor Recipe Scraper
      </h1>
      <Form
        className='flex w-full max-w-sm items-center space-x-2 '
        method='POST'
      >
        {/* The name attribute is crucial for the action to identify the field */}
        <Input type='text' placeholder='Enter recipe URL' name='url' />
        <Button
          type='submit'
          className=' bg-orange-500 text-white hover:bg-orange-400'
        >
          Submit
        </Button>
      </Form>

      <div>
        {actionData ? (
          <div>
            <h2>Recipe</h2>
            <pre>{JSON.stringify(actionData, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
