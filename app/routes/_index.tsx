import { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  return (
    <Link
      to='/scraper'
      className=' bg-gray-700 rounded-xl text-white px-5 py-3 tracking-wide font-semibold text-sm hover:bg-gray-600 transition-colors duration-200'
    >
      Recipe scraper
    </Link>
  );
}
