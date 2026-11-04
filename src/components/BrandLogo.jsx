export default function BrandLogo({ width = 100, height = 68, className = '', style = {} }) {
  return (
    <span className={className} role="img" aria-label="Shoppercart" style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width,
      height,
      flex: '0 0 auto',
      lineHeight: 0,
      ...style,
    }}>
      <img src="/shoppercart-mark.png" alt="" style={{ width: '73%', height: '68%', objectFit: 'contain', mixBlendMode: 'screen' }} />
      <img src="/shoppercart-wordmark.png" alt="" style={{ width: '100%', height: '28%', objectFit: 'contain', mixBlendMode: 'screen' }} />
    </span>
  );
}
