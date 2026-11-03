import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductImages } from '../utils/productImages';
import ProductImageFallback from './ProductImageFallback';

export default function ProductImageGallery({
  product,
  alt,
  className = '',
  style = {},
  imageStyle = {},
  showControls = true,
  label,
  scrollable = true,
}) {
  const images = getProductImages(product);
  const trackRef = useRef(null);
  const touchStartX = useRef(null);
  const justSwiped = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const imageKey = images.join('|');

  useEffect(() => {
    setActiveIndex(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [imageKey]);

  const goTo = index => {
    const nextIndex = Math.max(0, Math.min(images.length - 1, index));
    if (scrollable) {
      trackRef.current?.scrollTo({ left: nextIndex * trackRef.current.clientWidth, behavior: 'smooth' });
    }
    setActiveIndex(nextIndex);
  };

  const onTouchEnd = event => {
    if (touchStartX.current !== null && Math.abs(event.changedTouches[0].clientX - touchStartX.current) > 12) {
      justSwiped.current = true;
      window.setTimeout(() => { justSwiped.current = false; }, 350);
    }
    touchStartX.current = null;
  };

  const stopCardClickAfterSwipe = event => {
    if (justSwiped.current) {
      event.stopPropagation();
      justSwiped.current = false;
    }
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (scrollable && track) setActiveIndex(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
  };

  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      onClick={stopCardClickAfterSwipe}
      onTouchStart={scrollable ? event => { touchStartX.current = event.touches[0].clientX; } : undefined}
      onTouchEnd={scrollable ? onTouchEnd : undefined}
    >
      {images.length ? (
        <div
          ref={trackRef}
          onScroll={scrollable ? onScroll : undefined}
          style={{
            width: '100%', height: '100%', display: 'flex', overflowX: scrollable && images.length > 1 ? 'auto' : 'hidden',
            overflowY: 'hidden', scrollSnapType: scrollable ? 'x mandatory' : 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: scrollable ? 'touch' : 'auto',
          }}
        >
          {images.map((src, index) => (
            <div key={`${src}-${index}`} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'start', display: scrollable || index === activeIndex ? 'grid' : 'none', placeItems: 'center' }}>
              {failedImages[src] ? (
                <ProductImageFallback label={label || `No image available for ${alt || product?.name || 'product'}`} />
              ) : (
                <img
                  src={src}
                  alt={index === 0 ? (alt || product?.name || 'Product') : `${alt || product?.name || 'Product'} image ${index + 1}`}
                  loading="lazy"
                  onError={() => setFailedImages(current => ({ ...current, [src]: true }))}
                  style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', ...imageStyle }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <ProductImageFallback label={label || `No image available for ${alt || product?.name || 'product'}`} />
      )}

      {showControls && images.length > 1 && (
        <>
          <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <button type="button" aria-label="Previous product image" onClick={event => { event.stopPropagation(); goTo(activeIndex - 1); }} style={navButton}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Next product image" onClick={event => { event.stopPropagation(); goTo(activeIndex + 1); }} style={navButton}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div aria-label={`Image ${activeIndex + 1} of ${images.length}`} style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, padding: '5px 7px', borderRadius: 20, background: 'rgba(15,23,42,.62)' }}>
            {images.map((src, index) => (
              <button key={`${src}-dot-${index}`} type="button" aria-label={`Show image ${index + 1}`} onClick={event => { event.stopPropagation(); goTo(index); }} style={{ width: index === activeIndex ? 15 : 6, height: 6, padding: 0, border: 0, borderRadius: 9, background: index === activeIndex ? '#fff' : 'rgba(255,255,255,.55)', cursor: 'pointer', transition: 'width .18s ease' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const navButton = {
  pointerEvents: 'auto', width: 30, height: 30, border: 0, borderRadius: 20,
  display: 'grid', placeItems: 'center', padding: 0, color: '#334155',
  background: 'rgba(255,255,255,.9)', cursor: 'pointer', boxShadow: '0 1px 5px rgba(15,23,42,.15)',
};
