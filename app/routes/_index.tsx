import { LoaderFunction, redirect } from '@remix-run/node';

// make a loader that redirects to the scraper route
export const loader: LoaderFunction = async () => {
  return redirect('/scraper');
};
