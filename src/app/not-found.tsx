import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFoundPage() {
  return (
    <div className="container py-5">
      <h1>Page not found</h1>
      <p className="lead">The page you are looking for does not exist or has moved.</p>
      <Link className="btn btn-primary" href="/">
        Back to home
      </Link>
    </div>
  );
}
