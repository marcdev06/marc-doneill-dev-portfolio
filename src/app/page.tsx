import { siteName } from '@/lib/site-config';

export default function HomePage() {
  return (
    <div className="container py-5">
      <h1>{siteName}</h1>
      <p className="lead">Placeholder home page. The real sections arrive in a later milestone.</p>
    </div>
  );
}
