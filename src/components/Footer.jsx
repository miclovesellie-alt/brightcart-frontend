import { useStore } from '../context/StoreContext';
import { Zap, Globe, Code2, Camera, Briefcase } from 'lucide-react';
const [Twitter, Github, Instagram, Linkedin] = [Globe, Code2, Camera, Briefcase];

const FOOTER_LINKS = {
  Shop: ['All Products', 'Phones', 'Phone Accessories', 'Laptop Accessories', 'Electrical', 'New Arrivals'],
  Company: ['About Us', 'Blog', 'Careers', 'Press', 'Partners'],
  Support: ['Help Center', 'Shipping Info', 'Returns', 'Track Order', 'Contact Us'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'],
};

export default function Footer() {
  const { navigate } = useStore();
  const year = new Date().getFullYear();

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
            <button onClick={() => navigate('home')} style={{ display:'flex', alignItems:'center', gap:'8px', background:'none', border:'none', cursor:'pointer', padding:0, marginBottom:'12px' }}>
              <Zap size={20} color="#4f8ef7" fill="#4f8ef7" />
              <span style={{ color:'#fff', fontSize:'20px', fontWeight:800, letterSpacing:'-0.5px' }}>BrightCart</span>
            </button>
            <p style={{ color:'#4a5568', fontSize:'14px', maxWidth:'260px', lineHeight:1.6 }}>
              Premium tech delivered to your door. Curated for the modern world.
            </p>
          </div>

          {/* Social links */}
          <div style={{ display:'flex', gap:'12px' }}>
            {[Twitter, Github, Instagram, Linkedin].map((Icon, i) => (
              <button key={i} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', width:'36px', height:'36px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor='rgba(79,142,247,0.4)'; e.currentTarget.style.background='rgba(79,142,247,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}>
                <Icon size={15} />
              </button>
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

        {/* Bottom bar — copyright only, no admin button */}
        <div className="section-divider" style={{ marginBottom:'24px' }} />
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
          <p style={{ color:'#4a5568', fontSize:'13px' }}>
            © {year} BrightCart Tech Store. Built with ❤️ and a lot of caffeine.
          </p>
        </div>
      </div>
    </footer>
  );
}
