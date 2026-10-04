import { ArrowLeft } from 'lucide-react';
import { CatalogImage } from './CatalogImage';

export default function ErrorPage({ kind = 'not-found' }: { kind?: 'not-found' | 'error' }) {
  const missing = kind === 'not-found';
  return (
    <section className="error-screen screen-enter" aria-labelledby="error-title">
      <a className="error-brand" href="/" aria-label="YEMUNNAI home">
        <CatalogImage src="/images/NewLogo.svg" alt="" priority />
        <span>YEMUNNAI<small>A Food Discovery Platform</small></span>
      </a>
      <div className="error-content">
        <span className="error-code" aria-hidden="true">{missing ? '404' : 'Oops'}</span>
        <h1 id="error-title">{missing ? 'Page not found' : 'Something went wrong'}</h1>
        <p>{missing ? 'This page is no longer here.' : 'We couldn’t load this screen.'}<br />Your next meal is a tap away.</p>
        <a className="error-home" href="/"><ArrowLeft size={18} aria-hidden="true" />Back to Discover</a>
        {!missing && <button className="error-retry" type="button" onClick={() => window.location.reload()}>Try again</button>}
      </div>
      <span className="error-footer">Good food. Right here.</span>
    </section>
  );
}
