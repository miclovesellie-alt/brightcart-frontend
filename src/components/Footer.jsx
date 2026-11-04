import { useStore } from '../context/StoreContext';
import BrandLogo from './BrandLogo';
import { Globe, Mail, MessageCircle } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: ['All Products', 'Phones', 'Phone Accessories', 'Laptop Accessories', 'Electrical', 'New Arrivals'],
  Company: ['About Us', 'Blog', 'Careers', 'Press', 'Partners'],
  Support: ['Help Center', 'Shipping Info', 'Returns', 'Track Order', 'Contact Us'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'],
};

export default function Footer() {
  const { navigate, storeContacts = {} } = useStore();
  const year = new Date().getFullYear();
  const whatsappNumber = String(storeContacts.whatsappNumber || '').replace(/\D/g, '');
  const socialLinks = [
    { key: 'instagram', label: 'Instagram', icon: Globe },
    { key: 'facebook', label: 'Facebook', icon: Globe },
    { key: 'tiktok', label: 'TikTok', icon: Globe },
    { key: 'youtube', label: 'YouTube', icon: Globe },
    { key: 'x', label: 'X', icon: Globe },
  ].filter(item => storeContacts.socials?.[item.key]);

  return (
    <footer style={{
      background: '#050508',
      borderTop: '1px solid transparent',
      backgroundClip: 'padding-box',
      position: 'relative',
      paddingTop: '64px',
      paddingBottom: '32px',
    }}>
      {/* Top gradient border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, #4f8ef7, transparent)',
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>
        {/* Top Row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'24px', marginBottom:'48px' }}>
          <div>
            <button onClick={() => navigate('home')} aria-label="Shoppercart home" style={{ display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:'12px' }}>
              <BrandLogo width={136} height={88} />
            </button>
            <p style={{ color:'#4a5568', fontSize:'14px', maxWidth:'260px', lineHeight:1.6 }}>
              Quality tech, delivered straight to your door.
            </p>
            <div style={{ display:'grid', gap:8, marginTop:14 }}>
              {storeContacts.supportEmail && <a href={`mailto:${storeContacts.supportEmail}`} style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#8892a4', fontSize:13, textDecoration:'none' }}><Mail size={14} />{storeContacts.supportEmail}</a>}
              {whatsappNumber && <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#8892a4', fontSize:13, textDecoration:'none' }}><MessageCircle size={14} />Chat with us on WhatsApp</a>}
            </div>
          </div>

          {/* Social links */}
          <div style={{ display:'flex', gap:'12px' }}>
            {socialLinks.map(({ key, label, icon: Icon }) => (
              <a key={key} href={storeContacts.socials[key]} aria-label={label} title={label} target="_blank" rel="noreferrer" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(249,115,22,0.55)'; e.currentTarget.style.background='rgba(249,115,22,0.16)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}>
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div className="section-divider" style={{ marginBottom:'48px' }} />

        {/* Links grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'32px', marginBottom:'64px' }}>
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 style={{ color:'#fff', fontSize:'13px', fontWeight:600, marginBottom:'16px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{section}</h4>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'10px' }}>
                {links.map(link => (
                  <li key={link}>
                    <button style={{ background:'none', border:'none', color:'#4a5568', fontSize:'13px', cursor:'pointer', padding:0, transition:'color 0.2s ease', textAlign:'left' }}
                      onMouseEnter={e => e.currentTarget.style.color='#8892a4'}
                      onMouseLeave={e => e.currentTarget.style.color='#4a5568'}>
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar: copyright only, no admin button */}
        <div className="section-divider" style={{ marginBottom:'24px' }} />
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
          <p style={{ color:'#4a5568', fontSize:'13px' }}>
            © {year}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
