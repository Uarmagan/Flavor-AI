import { AspectRatio } from './ui/aspect-ratio';
import { Card, CardContent } from './ui/card';
import {  Recipe } from '~/types/recipe';
export function RecipeView({ recipeData }: { recipeData: Recipe }) {
  const hasIngredients = recipeData.ingredients?.length > 0;
  const hasInstructions = recipeData.instructions?.length > 0;

  return (
    <div className='grid gap-6'>
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
        {hasIngredients && (
          <div className='col-span-1 md:col-span-2 lg:col-span-1'>
            <h3 className='text-xl font-bold mb-2'>Ingredients</h3>
            <Card className='h-full w-full pt-4 my-4 border-gray-800'>
              <CardContent className='text-sm pb-0'>
                <ul className='list-inside space-y-4'>
                  {recipeData.ingredients.map(
                    (ingredient: string, index: number) => (
                      <li key={index}>{ingredient}</li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
        {hasInstructions && (
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
        )}
      </div>
    </div>
  );
}
