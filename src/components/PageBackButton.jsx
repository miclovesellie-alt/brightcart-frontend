import { ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function PageBackButton({ className = '' }) {
  const { canGoBack, goBack } = useStore();

  return (
    <button
      type="button"
      className={`page-back-button ${className}`.trim()}
      aria-label="Go back to the previous page"
      title={canGoBack ? 'Go back' : 'You are on the first page'}
      disabled={!canGoBack}
      onClick={goBack}
    >
      <ArrowLeft size={17} aria-hidden="true" />
    </button>
  );
}
