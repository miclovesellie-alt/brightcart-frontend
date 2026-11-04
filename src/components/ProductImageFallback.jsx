export default function ProductImageFallback({ className = '', style = {}, label = 'Product image' }) {
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(145deg, #f5f8fc, #e8eef7)',
        ...style,
      }}
    >
      <svg viewBox="0 0 96 96" width="64%" height="64%" fill="none" aria-hidden="true">
        <path d="M25 36h46l5 48H20l5-48Z" fill="#fff" stroke="#2563eb" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M35 38v-8a13 13 0 0 1 26 0v8" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M36 53h24" stroke="#d5deec" strokeWidth="3" strokeLinecap="round" />
        <path d="m49 45-8 12h7l-2 11 10-14h-7l2-9Z" fill="#2563eb" />
        <circle cx="71" cy="25" r="7" fill="#dbeafe" />
      </svg>
    </div>
  );
}
