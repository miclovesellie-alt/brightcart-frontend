import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

// ── Material definitions ─────────────────────────────────────────────────────
const MAT_DEFS = {
  silver:    { color: 0xbcc4cc, metalness: 0.9,  roughness: 0.10 },
  spacegray: { color: 0x6b7480, metalness: 0.8,  roughness: 0.20 },
  darkMetal: { color: 0x374151, metalness: 0.8,  roughness: 0.25 },
  black:     { color: 0x111827, metalness: 0.3,  roughness: 0.50 },
  screen:    { color: 0x0f172a, metalness: 0.1,  roughness: 0.05, emissive: 0x1e40af, emissiveIntensity: 0.35 },
  glowBlue:  { color: 0x1d4ed8, metalness: 0.0,  roughness: 0.00, emissive: 0x3b82f6, emissiveIntensity: 0.90 },
  pcbGreen:  { color: 0x166534, metalness: 0.1,  roughness: 0.70 },
  copper:    { color: 0xb45309, metalness: 0.85, roughness: 0.20 },
  gold:      { color: 0xca8a04, metalness: 0.90, roughness: 0.10 },
  white:     { color: 0xf0f4f8, metalness: 0.05, roughness: 0.40 },
  offWhite:  { color: 0xe2e8f0, metalness: 0.10, roughness: 0.30 },
  red:       { color: 0xb91c1c, metalness: 0.3,  roughness: 0.40, emissive: 0xdc2626, emissiveIntensity: 0.30 },
  blue:      { color: 0x1e40af, metalness: 0.3,  roughness: 0.40, emissive: 0x3b82f6, emissiveIntensity: 0.20 },
  darkGlass: { color: 0x0f172a, metalness: 0.9,  roughness: 0.05 },
  titanium:  { color: 0x9ca3af, metalness: 0.95, roughness: 0.08 },
  glowRed:   { color: 0xdc2626, metalness: 0.1,  roughness: 0.2,  emissive: 0xef4444, emissiveIntensity: 0.70 },
  amber:     { color: 0xd97706, metalness: 0.7,  roughness: 0.20, emissive: 0xf59e0b, emissiveIntensity: 0.30 },
};

// ── Geometry spec helpers ────────────────────────────────────────────────────
const B  = (w, h, d)         => ({ t: 'box', a: [w, h, d] });
const C  = (r, h, s = 12)    => ({ t: 'cyl', a: [r, r, h, s] });
const S  = (r, s = 12)       => ({ t: 'sph', a: [r, s, s] });
const TC = (r1, r2, h, s=12) => ({ t: 'cyl', a: [r1, r2, h, s] });

// ── Part scatter direction biases ─────────────────────────────────────────────
// 'top','bot','left','right','front','back','random'
const DIRS = {
  top:   () => [rnd(-3,3),  7+rnd(0,4),   rnd(-2,2)],
  bot:   () => [rnd(-3,3), -7-rnd(0,4),   rnd(-2,2)],
  left:  () => [-9-rnd(0,4), rnd(-3,3),   rnd(-2,2)],
  right: () => [9+rnd(0,4),  rnd(-3,3),   rnd(-2,2)],
  front: () => [rnd(-3,3),   rnd(-3,3),   8+rnd(0,4)],
  back:  () => [rnd(-3,3),   rnd(-3,3),  -8-rnd(0,4)],
  rnd:   () => [(rnd(-1,1))*10, (rnd(-1,1))*8, rnd(-4,4)],
};
function rnd(a, b) { return a + Math.random()*(b-a); }

// ── DEVICE DEFINITIONS ───────────────────────────────────────────────────────
// Each part: { g:geoSpec, m:matKey, p:[x,y,z], r:[rx,ry,rz], n:'Name', d:scatter_dir }
const DEVICES = [
  // ─────────────────────────────────────────────────────── LAPTOP
  {
    id: 'laptop', name: 'MacBook Pro', sub: 'M3 Chip · 16GB RAM · 512GB SSD',
    color: '#4f8ef7', lightColor: 0x4f8ef7,
    parts: [
      // chassis must appear first (foundation)
      { g:B(3.6,0.18,2.4),   m:'silver',    p:[0,-0.9,0],          r:[0,0,0],       n:'Aluminum Unibody Chassis',     d:'bot'   },
      { g:B(2.2,0.09,0.75),  m:'darkMetal', p:[0,-0.84,0.62],      r:[0,0,0],       n:'100Wh Lithium Battery',        d:'bot'   },
      { g:B(2.4,0.05,1.4),   m:'pcbGreen',  p:[0,-0.85,-0.2],      r:[0,0,0],       n:'Logic Board (PCB)',            d:'back'  },
      { g:B(0.44,0.09,0.44), m:'silver',    p:[0.3,-0.8,-0.4],     r:[0,0,0],       n:'Apple M3 Pro Chip',           d:'back'  },
      { g:B(0.8,0.09,0.18),  m:'darkMetal', p:[-0.4,-0.8,-0.2],    r:[0,0,0],       n:'Unified Memory (RAM)',         d:'left'  },
      { g:B(0.6,0.06,0.2),   m:'darkMetal', p:[0.3,-0.8,0.05],     r:[0,0,0],       n:'NVMe SSD Storage',            d:'right' },
      { g:B(0.07,0.07,0.07), m:'copper',    p:[0.0,-0.8,-0.52],    r:[0,0,0],       n:'SMD Capacitor',               d:'back'  },
      { g:B(0.07,0.07,0.07), m:'copper',    p:[0.15,-0.8,-0.52],   r:[0,0,0],       n:'SMD Capacitor',               d:'back'  },
      { g:B(0.07,0.07,0.07), m:'copper',    p:[-0.1,-0.8,-0.52],   r:[0,0,0],       n:'SMD Capacitor',               d:'back'  },
      { g:B(0.07,0.07,0.07), m:'gold',      p:[0.55,-0.8,-0.45],   r:[0,0,0],       n:'SMD Resistor',                d:'back'  },
      { g:B(3.3,0.03,1.9),   m:'spacegray', p:[0,-0.79,-0.1],      r:[0,0,0],       n:'Keyboard Deck Surface',       d:'top'   },
      { g:B(1.1,0.025,0.75), m:'silver',    p:[0,-0.785,0.75],     r:[0,0,0],       n:'Force Touch Trackpad',        d:'bot'   },
      // keys – row 1
      ...[-1.1,-0.83,-0.56,-0.29,-0.02,0.25,0.52,0.79].map((x,i)=>({
        g:B(0.23,0.06,0.21), m:'spacegray', p:[x,-0.77,-0.62], r:[0,0,0], n:`Key ${String.fromCharCode(65+i)}`, d:'top'
      })),
      // keys – row 2
      ...[-1.0,-0.73,-0.46,-0.19,0.08,0.35,0.62].map((x,i)=>({
        g:B(0.23,0.06,0.21), m:'spacegray', p:[x,-0.77,-0.38], r:[0,0,0], n:`Key ${String.fromCharCode(81+i)}`, d:'top'
      })),
      // hinges
      { g:C(0.09,0.4,16),    m:'darkMetal', p:[-1.4,-0.72,-1.14],  r:[0,1.57,0],    n:'Hinge Assembly Left',         d:'left'  },
      { g:C(0.09,0.4,16),    m:'darkMetal', p:[1.4,-0.72,-1.14],   r:[0,1.57,0],    n:'Hinge Assembly Right',        d:'right' },
      // speakers
      { g:B(0.5,0.025,0.1),  m:'spacegray', p:[-1.42,-0.78,0.1],   r:[0,0,0],       n:'Speaker Grille Left',         d:'left'  },
      { g:B(0.5,0.025,0.1),  m:'spacegray', p:[1.42,-0.78,0.1],    r:[0,0,0],       n:'Speaker Grille Right',        d:'right' },
      // ports
      { g:B(0.22,0.09,0.07), m:'darkMetal', p:[-1.82,-0.9,-0.3],   r:[0,0,0],       n:'Thunderbolt 4 Port',          d:'left'  },
      { g:B(0.22,0.09,0.07), m:'darkMetal', p:[1.82,-0.9,-0.3],    r:[0,0,0],       n:'MagSafe 3 Charging Port',     d:'right' },
      // screen lid
      { g:B(3.6,2.4,0.1),    m:'silver',    p:[0,0.3,-1.22],        r:[-1.05,0,0],   n:'Display Lid (Aluminum)',      d:'top'   },
      { g:B(3.1,1.95,0.03),  m:'screen',    p:[0,0.28,-1.18],       r:[-1.05,0,0],   n:'Liquid Retina XDR Display',   d:'top'   },
      { g:B(0.38,0.1,0.03),  m:'black',     p:[0,1.27,-1.18],       r:[-1.05,0,0],   n:'Display Notch',               d:'top'   },
      { g:C(0.05,0.04,12),   m:'black',     p:[0,1.27,-1.2],        r:[-0.46,0,0],   n:'FaceTime HD Camera',          d:'top'   },
    ]
  },

  // ─────────────────────────────────────────────────────── PHONE
  {
    id: 'phone', name: 'BrightPhone Pro 15', sub: '200MP · Snapdragon 8 Gen 4 · 5G',
    color: '#a855f7', lightColor: 0xa855f7,
    parts: [
      { g:B(1.8,3.8,0.16),   m:'titanium',  p:[0,0,0],             r:[0,0,0],       n:'Titanium Frame',              d:'rnd'   },
      { g:B(1.72,3.72,0.05), m:'darkGlass', p:[0,0,-0.07],         r:[0,0,0],       n:'Gorilla Glass Back Panel',    d:'back'  },
      { g:B(1.5,1.0,0.06),   m:'pcbGreen',  p:[0,0.3,-0.02],       r:[0,0,0],       n:'Main Logic Board',            d:'back'  },
      { g:B(0.3,0.3,0.05),   m:'silver',    p:[0,0.35,-0.01],      r:[0,0,0],       n:'Snapdragon 8 Gen 4 SoC',      d:'back'  },
      { g:B(1.5,2.0,0.07),   m:'blue',      p:[0,-0.7,-0.02],      r:[0,0,0],       n:'5000mAh Silicon-Carbon Battery', d:'bot' },
      // capacitors
      ...[-0.38,-0.19,0.0,0.19,0.38].map((x,i)=>({
        g:B(0.06,0.06,0.06), m:'copper', p:[x,0.65,-0.01], r:[0,0,0], n:`SMD Capacitor ${i+1}`, d:'back'
      })),
      { g:B(1.72,3.72,0.04), m:'screen',    p:[0,0,0.09],          r:[0,0,0],       n:'Dynamic AMOLED 2X Display',   d:'front' },
      // camera island
      { g:B(0.9,1.0,0.12),   m:'darkMetal', p:[-0.35,1.3,-0.1],    r:[0,0,0],       n:'Camera Island Housing',       d:'top'   },
      { g:C(0.22,0.08,16),   m:'black',     p:[-0.35,1.55,-0.14],  r:[1.57,0,0],    n:'200MP Main Camera Sensor',    d:'top'   },
      { g:C(0.16,0.02,16),   m:'glowBlue',  p:[-0.35,1.55,-0.09],  r:[1.57,0,0],    n:'Main Lens Element',           d:'top'   },
      { g:C(0.15,0.07,16),   m:'black',     p:[-0.35,1.22,-0.14],  r:[1.57,0,0],    n:'12MP Ultrawide Camera',       d:'top'   },
      { g:C(0.10,0.02,16),   m:'glowBlue',  p:[-0.35,1.22,-0.09],  r:[1.57,0,0],    n:'Ultrawide Lens',              d:'top'   },
      { g:C(0.15,0.07,16),   m:'black',     p:[-0.35,0.9,-0.14],   r:[1.57,0,0],    n:'50x Periscope Zoom Lens',     d:'top'   },
      { g:C(0.10,0.02,16),   m:'glowBlue',  p:[-0.35,0.9,-0.09],   r:[1.57,0,0],    n:'Periscope Lens Glass',        d:'top'   },
      { g:C(0.07,0.04,8),    m:'gold',      p:[0.0,1.25,-0.14],    r:[1.57,0,0],    n:'Quad-LED Flash Module',       d:'top'   },
      { g:C(0.07,0.04,12),   m:'black',     p:[0,1.7,0.1],         r:[1.57,0,0],    n:'12MP Front Camera',           d:'top'   },
      // buttons
      { g:B(0.06,0.3,0.08),  m:'titanium',  p:[-0.93,0.4,0],       r:[0,0,0],       n:'Volume Up Button',            d:'left'  },
      { g:B(0.06,0.3,0.08),  m:'titanium',  p:[-0.93,-0.05,0],     r:[0,0,0],       n:'Volume Down Button',          d:'left'  },
      { g:B(0.06,0.4,0.08),  m:'titanium',  p:[0.93,0.2,0],        r:[0,0,0],       n:'Power Button',                d:'right' },
      { g:B(0.06,0.25,0.08), m:'titanium',  p:[-0.93,-0.6,0],      r:[0,0,0],       n:'SIM Card Tray',               d:'left'  },
      // bottom
      { g:B(0.35,0.08,0.08), m:'darkMetal', p:[0,-1.92,0],         r:[0,0,0],       n:'USB-C Port',                  d:'bot'   },
      { g:B(0.6,0.06,0.08),  m:'darkMetal', p:[0.15,-1.92,0],      r:[0,0,0],       n:'Stereo Speaker Grille',       d:'bot'   },
    ]
  },

  // ─────────────────────────────────────────────────────── EARBUDS
  {
    id: 'earbuds', name: 'ProBuds X3 Ultra', sub: 'ANC · Spatial Audio · 30hr Total',
    color: '#22c55e', lightColor: 0x22c55e,
    parts: [
      { g:B(3.2,2.0,1.5),    m:'white',     p:[0,-0.5,0],          r:[0,0,0],       n:'Charging Case Body',          d:'bot'   },
      { g:B(2.5,0.6,0.8),    m:'blue',      p:[0,-1.0,0],          r:[0,0,0],       n:'Case Battery Cell',           d:'bot'   },
      { g:B(1.5,0.1,0.6),    m:'pcbGreen',  p:[0,-1.35,0],         r:[0,0,0],       n:'Wireless Charging PCB',       d:'bot'   },
      { g:B(3.2,0.3,1.5),    m:'offWhite',  p:[0,0.6,0],           r:[0,0,0],       n:'Magnetic Case Lid',           d:'top'   },
      { g:C(0.08,3.1,8),     m:'silver',    p:[0,0.45,-0.72],      r:[0,1.57,0],    n:'Case Hinge Mechanism',        d:'back'  },
      { g:B(0.2,0.08,0.05),  m:'glowBlue',  p:[0,-1.4,0.76],       r:[0,0,0],       n:'LED Status Indicator',        d:'front' },
      { g:B(0.35,0.1,0.05),  m:'silver',    p:[0,-1.45,0.76],      r:[0,0,0],       n:'USB-C Charging Port',         d:'bot'   },
      // LEFT earbud
      { g:S(0.55,16),        m:'white',     p:[-0.9,0,0.2],        r:[0,0,0],       n:'Left Earbud Shell',           d:'left'  },
      { g:C(0.12,0.9,8),     m:'offWhite',  p:[-0.9,-0.7,0.2],     r:[0,0,0],       n:'Left Stem',                   d:'left'  },
      { g:C(0.3,0.04,12),    m:'spacegray', p:[-0.9,0,0.5],        r:[1.57,0,0],    n:'Left 11mm Speaker Driver',    d:'left'  },
      { g:TC(0.42,0.28,0.22),m:'offWhite',  p:[-0.9,0,0.62],       r:[1.57,0,0],    n:'Left Silicone Ear Tip',       d:'left'  },
      { g:C(0.06,0.06,8),    m:'darkMetal', p:[-0.9,0.3,0.48],     r:[1.57,0,0],    n:'Left ANC Microphone (Inner)', d:'left'  },
      { g:C(0.06,0.06,8),    m:'darkMetal', p:[-0.9,-1.1,0.2],     r:[0,0,0],       n:'Left ANC Mic (Outer)',        d:'left'  },
      { g:B(0.5,0.5,0.04),   m:'silver',    p:[-0.9,0.2,-0.45],    r:[0,0,0],       n:'Left Touch Control Surface',  d:'left'  },
      { g:B(0.15,0.08,0.15), m:'gold',      p:[-0.9,-1.12,0.2],    r:[0,0,0],       n:'Left Pogo Charging Pins',     d:'bot'   },
      // RIGHT earbud
      { g:S(0.55,16),        m:'white',     p:[0.9,0,0.2],         r:[0,0,0],       n:'Right Earbud Shell',          d:'right' },
      { g:C(0.12,0.9,8),     m:'offWhite',  p:[0.9,-0.7,0.2],      r:[0,0,0],       n:'Right Stem',                  d:'right' },
      { g:C(0.3,0.04,12),    m:'spacegray', p:[0.9,0,0.5],         r:[1.57,0,0],    n:'Right 11mm Speaker Driver',   d:'right' },
      { g:TC(0.42,0.28,0.22),m:'offWhite',  p:[0.9,0,0.62],        r:[1.57,0,0],    n:'Right Silicone Ear Tip',      d:'right' },
      { g:C(0.06,0.06,8),    m:'darkMetal', p:[0.9,0.3,0.48],      r:[1.57,0,0],    n:'Right ANC Microphone (Inner)',d:'right' },
      { g:C(0.06,0.06,8),    m:'darkMetal', p:[0.9,-1.1,0.2],      r:[0,0,0],       n:'Right ANC Mic (Outer)',       d:'right' },
      { g:B(0.5,0.5,0.04),   m:'silver',    p:[0.9,0.2,-0.45],     r:[0,0,0],       n:'Right Touch Control',         d:'right' },
      { g:B(0.15,0.08,0.15), m:'gold',      p:[0.9,-1.12,0.2],     r:[0,0,0],       n:'Right Pogo Charging Pins',    d:'bot'   },
    ]
  },

  // ─────────────────────────────────────────────────────── HEADPHONES
  {
    id: 'headphones', name: 'Studio Pro Max', sub: 'Hi-Res Audio · 40mm Drivers · 40hr',
    color: '#f59e0b', lightColor: 0xf59e0b,
    parts: [
      { g:B(4.5,0.25,0.3),   m:'silver',    p:[0,2.2,0],           r:[0,0,0],       n:'Headband Frame (Aluminum)',   d:'top'   },
      { g:B(3.8,0.15,0.22),  m:'black',     p:[0,2.0,0],           r:[0,0,0],       n:'Memory Foam Headband Pad',    d:'top'   },
      // arms
      { g:B(0.18,1.4,0.25),  m:'silver',    p:[-2.25,1.3,0],       r:[0,0,0],       n:'Left Adjustment Arm',         d:'left'  },
      { g:B(0.18,1.4,0.25),  m:'silver',    p:[2.25,1.3,0],        r:[0,0,0],       n:'Right Adjustment Arm',        d:'right' },
      // hinges
      { g:C(0.18,0.3,12),    m:'darkMetal', p:[-2.25,0.5,0],       r:[0,0,1.57],    n:'Left Pivot Hinge',            d:'left'  },
      { g:C(0.18,0.3,12),    m:'darkMetal', p:[2.25,0.5,0],        r:[0,0,1.57],    n:'Right Pivot Hinge',           d:'right' },
      // cups
      { g:C(1.2,0.9,24),     m:'black',     p:[-2.25,0,0],         r:[0,0,1.57],    n:'Left Ear Cup Housing',        d:'left'  },
      { g:C(1.2,0.9,24),     m:'black',     p:[2.25,0,0],          r:[0,0,1.57],    n:'Right Ear Cup Housing',       d:'right' },
      // cushions
      { g:C(1.0,0.35,24),    m:'spacegray', p:[-2.25,0.28,0],      r:[0,0,1.57],    n:'Left Protein Leather Cushion',d:'left'  },
      { g:C(1.0,0.35,24),    m:'spacegray', p:[2.25,0.28,0],       r:[0,0,1.57],    n:'Right Protein Leather Cushion',d:'right'},
      // drivers
      { g:C(0.8,0.1,20),     m:'darkMetal', p:[-2.25,0,0],         r:[0,0,1.57],    n:'Left 40mm Dynamic Driver',    d:'left'  },
      { g:C(0.8,0.1,20),     m:'darkMetal', p:[2.25,0,0],          r:[0,0,1.57],    n:'Right 40mm Dynamic Driver',   d:'right' },
      // magnets
      { g:C(0.45,0.25,16),   m:'copper',    p:[-2.25,-0.3,0],      r:[0,0,1.57],    n:'Left Neodymium Magnet',       d:'left'  },
      { g:C(0.45,0.25,16),   m:'copper',    p:[2.25,-0.3,0],       r:[0,0,1.57],    n:'Right Neodymium Magnet',      d:'right' },
      // PCBs
      { g:B(0.9,0.9,0.06),   m:'pcbGreen',  p:[-2.25,0,0.36],      r:[0,0,0],       n:'Left Electronics PCB',        d:'back'  },
      { g:B(0.9,0.9,0.06),   m:'pcbGreen',  p:[2.25,0,0.36],       r:[0,0,0],       n:'Right Electronics PCB',       d:'back'  },
      // batteries
      { g:B(0.7,0.5,0.2),    m:'blue',      p:[-2.25,0,0.25],      r:[0,0,0],       n:'Left Battery Cell',           d:'back'  },
      { g:B(0.7,0.5,0.2),    m:'blue',      p:[2.25,0,0.25],       r:[0,0,0],       n:'Right Battery Cell',          d:'back'  },
      // mics
      { g:C(0.08,0.1,8),     m:'darkMetal', p:[-2.25,0.9,-0.15],   r:[0,0,1.57],    n:'Left ANC Microphone',         d:'top'   },
      { g:C(0.08,0.1,8),     m:'darkMetal', p:[2.25,0.9,-0.15],    r:[0,0,1.57],    n:'Right ANC Microphone',        d:'top'   },
      // logos
      { g:B(0.5,0.5,0.05),   m:'amber',     p:[-2.25,0,-0.46],     r:[0,1.57,0],    n:'Left Brand Badge',            d:'left'  },
      { g:B(0.5,0.5,0.05),   m:'amber',     p:[2.25,0,-0.46],      r:[0,1.57,0],    n:'Right Brand Badge',           d:'right' },
      // ports
      { g:B(0.3,0.08,0.1),   m:'darkMetal', p:[2.25,-0.8,0],       r:[0,0,1.57],    n:'USB-C Charging Port',         d:'bot'   },
      { g:C(0.05,0.15,8),    m:'silver',    p:[-2.25,-0.8,0],      r:[0,0,1.57],    n:'3.5mm Audio Jack',            d:'bot'   },
    ]
  },

  // ─────────────────────────────────────────────────────── SMARTWATCH
  {
    id: 'smartwatch', name: 'BrightBand Pro', sub: 'AMOLED · SpO2 · GPS · 7-Day Battery',
    color: '#ec4899', lightColor: 0xec4899,
    parts: [
      { g:B(1.8,2.0,0.45),   m:'titanium',  p:[0,0,0],             r:[0,0,0],       n:'Titanium Watch Case',         d:'rnd'   },
      { g:B(1.4,1.6,0.06),   m:'darkMetal', p:[0,0,-0.25],         r:[0,0,0],       n:'Sensor Array PCB',            d:'back'  },
      { g:B(1.3,1.4,0.12),   m:'blue',      p:[0,0,-0.1],          r:[0,0,0],       n:'500mAh Battery',              d:'back'  },
      { g:C(0.25,0.6,12),    m:'darkMetal', p:[0,-0.4,-0.15],      r:[0,0,0],       n:'Taptic Engine (Haptic Motor)', d:'back'  },
      { g:B(0.25,0.25,0.05), m:'silver',    p:[0,0.2,-0.2],        r:[0,0,0],       n:'S9 SiP Processor',            d:'back'  },
      // sensors on back
      { g:C(0.2,0.04,12),    m:'glowRed',   p:[-0.3,0,-0.26],      r:[1.57,0,0],    n:'Heart Rate LED Sensor',       d:'back'  },
      { g:C(0.2,0.04,12),    m:'glowRed',   p:[0.3,0,-0.26],       r:[1.57,0,0],    n:'Blood Oxygen (SpO2) Sensor',  d:'back'  },
      { g:B(0.6,0.05,0.3),   m:'copper',    p:[0,0.5,-0.2],        r:[0,0,0],       n:'GPS Antenna Module',          d:'back'  },
      // screen
      { g:B(1.55,1.75,0.05), m:'screen',    p:[0,0,0.24],          r:[0,0,0],       n:'Always-On AMOLED Display',    d:'front' },
      { g:B(1.6,1.8,0.03),   m:'darkGlass', p:[0,0,0.26],          r:[0,0,0],       n:'Sapphire Crystal Glass',      d:'front' },
      // buttons
      { g:C(0.12,0.4,12),    m:'titanium',  p:[0.93,0.3,0],        r:[0,0,1.57],    n:'Digital Crown',               d:'right' },
      { g:B(0.08,0.4,0.2),   m:'titanium',  p:[0.93,-0.3,0],       r:[0,0,0],       n:'Action Button',               d:'right' },
      { g:C(0.05,0.1,8),     m:'darkMetal', p:[-0.93,0.4,0],       r:[0,0,1.57],    n:'Microphone Port',             d:'left'  },
      { g:B(0.06,0.5,0.12),  m:'darkMetal', p:[-0.93,-0.1,0],      r:[0,0,0],       n:'Speaker Grille',              d:'left'  },
      // band top
      { g:B(1.5,0.7,0.2),    m:'black',     p:[0,1.45,0],          r:[0,0,0],       n:'Band Top Segment 1',          d:'top'   },
      { g:B(1.5,0.6,0.2),    m:'black',     p:[0,2.1,0],           r:[0,0,0],       n:'Band Top Segment 2',          d:'top'   },
      { g:B(1.5,0.6,0.2),    m:'black',     p:[0,2.7,0],           r:[0,0,0],       n:'Band Top Segment 3',          d:'top'   },
      // band bottom
      { g:B(1.5,0.7,0.2),    m:'black',     p:[0,-1.45,0],         r:[0,0,0],       n:'Band Bottom Segment 1',       d:'bot'   },
      { g:B(1.5,0.6,0.2),    m:'black',     p:[0,-2.1,0],          r:[0,0,0],       n:'Band Bottom Segment 2',       d:'bot'   },
      { g:B(1.5,0.6,0.2),    m:'black',     p:[0,-2.7,0],          r:[0,0,0],       n:'Band Bottom Segment 3',       d:'bot'   },
      { g:B(1.5,0.3,0.12),   m:'silver',    p:[0,-3.0,0],          r:[0,0,0],       n:'Magnetic Band Clasp',         d:'bot'   },
    ]
  },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function HeroAssembler() {
  const mountRef    = useRef(null);
  const partTagRef  = useRef(null);
  const deviceNameRef = useRef(null);
  const deviceSubRef  = useRef(null);
  const glowOrbRef  = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // WebGL support check
    try {
      const tc = document.createElement('canvas');
      if (!tc.getContext('webgl2') && !tc.getContext('webgl')) return;
    } catch (e) { return; }

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const aspect = mount.clientWidth / mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    // ── Lights ────────────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x8ab4f8, 2.8);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
    fillLight.position.set(-4, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x4f8ef7, 1.8);
    rimLight.position.set(0, -5, -4);
    scene.add(rimLight);

    const accentPoint = new THREE.PointLight(0x4f8ef7, 4, 12);
    accentPoint.position.set(3, 2, 3);
    scene.add(accentPoint);

    // ── Materials ─────────────────────────────────────────────────────────────
    const mats = {};
    for (const [key, def] of Object.entries(MAT_DEFS)) {
      const m = new THREE.MeshStandardMaterial({
        color:     def.color,
        metalness: def.metalness ?? 0.5,
        roughness: def.roughness ?? 0.5,
      });
      if (def.emissive) {
        m.emissive          = new THREE.Color(def.emissive);
        m.emissiveIntensity = def.emissiveIntensity ?? 0.2;
      }
      mats[key] = m;
    }

    // ── Geometry builder ──────────────────────────────────────────────────────
    function buildGeo(spec) {
      switch (spec.t) {
        case 'box': return new THREE.BoxGeometry(...spec.a);
        case 'cyl': return new THREE.CylinderGeometry(...spec.a);
        case 'sph': return new THREE.SphereGeometry(...spec.a);
        default:    return new THREE.BoxGeometry(0.3, 0.3, 0.3);
      }
    }

    // ── Device group (rotates with mouse) ─────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    // ── Background particles ───────────────────────────────────────────────────
    const PCNT = 120;
    const pPos = new Float32Array(PCNT * 3);
    const pSpd = [];
    for (let i = 0; i < PCNT; i++) {
      pPos[i*3]   = (Math.random()-0.5)*22;
      pPos[i*3+1] = (Math.random()-0.5)*14;
      pPos[i*3+2] = (Math.random()-0.5)*8 - 5;
      pSpd.push({ x: (Math.random()-0.5)*0.0018, y: (Math.random()-0.5)*0.0018 });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x4f8ef7, size: 0.055, transparent: true, opacity: 0.28 });
    scene.add(new THREE.Points(pGeo, pMat));

    // ── State ─────────────────────────────────────────────────────────────────
    let currentIndex  = 0;
    let activeMeshes  = [];
    let activeGeos    = [];
    let alive         = true;
    let assemblingTimeout = null;
    let shredTimeout  = null;

    // ── Scatter position from direction bias ───────────────────────────────────
    function scatterPos(dir) {
      const fn = DIRS[dir] || DIRS.rnd;
      const [x, y, z] = fn();
      return new THREE.Vector3(x, y, z);
    }

    // ── DOM helpers ──────────────────────────────────────────────────────────
    function showPartTag(text) {
      if (!partTagRef.current) return;
      const el = partTagRef.current;
      el.textContent = text;
      el.style.opacity = '1';
      clearTimeout(el._t);
      el._t = setTimeout(() => { if (el) el.style.opacity = '0'; }, 1400);
    }

    function setDeviceOverlay(device) {
      if (deviceNameRef.current) {
        deviceNameRef.current.textContent = device.name;
        deviceNameRef.current.style.color  = device.color;
      }
      if (deviceSubRef.current) deviceSubRef.current.textContent = device.sub;
      if (glowOrbRef.current) glowOrbRef.current.style.background =
        `radial-gradient(circle, ${device.color}28 0%, transparent 70%)`;
    }

    // ── Clear meshes ──────────────────────────────────────────────────────────
    function clearMeshes() {
      for (const m of activeMeshes) {
        gsap.killTweensOf(m.position);
        gsap.killTweensOf(m.rotation);
        gsap.killTweensOf(m.scale);
        group.remove(m);
      }
      for (const g of activeGeos) g.dispose();
      activeMeshes = [];
      activeGeos   = [];
    }

    // ── SHRED exit animation ──────────────────────────────────────────────────
    function shredDevice(onDone) {
      if (activeMeshes.length === 0) { onDone(); return; }
      let done = 0; const total = activeMeshes.length;

      for (const mesh of activeMeshes) {
        const dx = (Math.random()-0.5)*18;
        const dy = (Math.random()-0.5)*16;
        const dz = (Math.random()-0.5)*6;

        gsap.to(mesh.position, { x: mesh.position.x+dx, y: mesh.position.y+dy, z: mesh.position.z+dz,
          duration: 0.6, ease: 'power3.in' });
        gsap.to(mesh.rotation, {
          x: mesh.rotation.x + (Math.random()-0.5)*Math.PI*10,
          y: mesh.rotation.y + (Math.random()-0.5)*Math.PI*10,
          z: mesh.rotation.z + (Math.random()-0.5)*Math.PI*10,
          duration: 0.6, ease: 'power2.in' });
        gsap.to(mesh.scale, { x:0.05, y:0.05, z:0.05, duration: 0.6, ease: 'power3.in',
          onComplete: () => { done++; if (done >= total) { clearMeshes(); if (alive) onDone(); } }
        });
      }
    }

    // ── ASSEMBLE animation ─────────────────────────────────────────────────────
    function assembleDevice(idx) {
      if (!alive) return;
      const device = DEVICES[idx];
      setDeviceOverlay(device);

      // Update accent light colors
      rimLight.color.set(device.lightColor);
      accentPoint.color.set(device.lightColor);
      pMat.color.set(device.lightColor);

      // Build meshes at scatter positions
      device.parts.forEach((part) => {
        const geo  = buildGeo(part.g);
        const mesh = new THREE.Mesh(geo, mats[part.m] || mats.silver);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;

        const sp = scatterPos(part.d);
        mesh.position.copy(sp);
        mesh.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
        mesh.scale.setScalar(0.05 + Math.random()*0.15);

        group.add(mesh);
        activeMeshes.push(mesh);
        activeGeos.push(geo);
      });

      const STAGGER  = 0.055;
      const DURATION = 0.9;
      let   assembled = 0;
      const total     = device.parts.length;

      device.parts.forEach((part, i) => {
        const mesh  = activeMeshes[i];
        const delay = i * STAGGER;

        gsap.to(mesh.position, {
          x: part.p[0], y: part.p[1], z: part.p[2],
          duration: DURATION, delay, ease: 'power4.out',
          onStart: () => { if (alive) showPartTag(part.n); },
        });
        gsap.to(mesh.rotation, {
          x: part.r[0], y: part.r[1], z: part.r[2],
          duration: DURATION, delay, ease: 'power4.out',
        });
        gsap.to(mesh.scale, {
          x: 1, y: 1, z: 1,
          duration: DURATION, delay, ease: 'back.out(1.3)',
          onComplete: () => {
            assembled++;
            if (assembled >= total && alive) {
              // Fully assembled — show for 3s then shred
              shredTimeout = setTimeout(() => {
                if (!alive) return;
                shredDevice(() => {
                  if (!alive) return;
                  currentIndex = (currentIndex + 1) % DEVICES.length;
                  assemblingTimeout = setTimeout(() => assembleDevice(currentIndex), 120);
                });
              }, 3200);
            }
          },
        });
      });
    }

    // ── Mouse interactivity ───────────────────────────────────────────────────
    let targetRX = 0, targetRY = 0;
    let curRX    = 0, curRY    = 0;

    function onMouseMove(e) {
      const r = mount.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const ny = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      targetRY =  nx * 0.38;
      targetRX = -ny * 0.22;
    }
    mount.addEventListener('mousemove', onMouseMove);

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId, prevTime = 0;
    function animate(t) {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min((t - prevTime) / 1000, 0.05);
      prevTime = t;

      // Smooth mouse rotation
      const s = 1 - Math.pow(0.005, dt);
      curRX += (targetRX - curRX) * s * 8;
      curRY += (targetRY - curRY) * s * 8;
      group.rotation.x = curRX;
      group.rotation.y = curRY;

      // Particles drift
      const pa = pGeo.attributes.position.array;
      for (let i = 0; i < PCNT; i++) {
        pa[i*3]   += pSpd[i].x;
        pa[i*3+1] += pSpd[i].y;
        if (pa[i*3]   >  11) pa[i*3]   = -11;
        if (pa[i*3]   < -11) pa[i*3]   =  11;
        if (pa[i*3+1] >   7) pa[i*3+1] =  -7;
        if (pa[i*3+1] <  -7) pa[i*3+1] =   7;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Slow accent point light orbit
      accentPoint.position.x = Math.sin(t * 0.0004) * 4 + 2;
      accentPoint.position.y = Math.cos(t * 0.0003) * 3 + 2;

      renderer.render(scene, camera);
    }

    // ── Resize ────────────────────────────────────────────────────────────────
    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // ── Kick off ──────────────────────────────────────────────────────────────
    rafId = requestAnimationFrame(animate);
    assemblingTimeout = setTimeout(() => assembleDevice(0), 400);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      clearTimeout(assemblingTimeout);
      clearTimeout(shredTimeout);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousemove', onMouseMove);
      for (const m of activeMeshes) {
        gsap.killTweensOf(m.position);
        gsap.killTweensOf(m.rotation);
        gsap.killTweensOf(m.scale);
      }
      clearMeshes();
      renderer.dispose();
      for (const m of Object.values(mats)) m.dispose();
      pGeo.dispose(); pMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Animated accent glow orb (color changes with device) */}
      <div
        ref={glowOrbRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 70%)',
          transition: 'background 1s ease',
          filter: 'blur(60px)',
        }}
      />

      {/* WebGL canvas */}
      <div ref={mountRef} style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }} />

      {/* Part name tag — appears as each part assembles */}
      <div style={{
        position: 'absolute', bottom: '72px', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 10,
      }}>
        <div
          ref={partTagRef}
          style={{
            padding: '5px 14px',
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(79,142,247,0.35)',
            borderRadius: '100px',
            fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em',
            color: '#93c5fd',
            opacity: 0,
            transition: 'opacity 0.25s ease',
            backdropFilter: 'blur(8px)',
            fontFamily: 'Inter, sans-serif',
          }}
        >—</div>
      </div>

      {/* Device name + specs */}
      <div style={{
        position: 'absolute', bottom: '18px', left: 0, right: 0,
        textAlign: 'center', pointerEvents: 'none', zIndex: 10,
      }}>
        <div
          ref={deviceNameRef}
          style={{
            fontSize: '15px', fontWeight: 700, color: '#4f8ef7',
            fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em',
            transition: 'color 0.6s ease',
          }}
        />
        <div
          ref={deviceSubRef}
          style={{
            fontSize: '11px', color: '#4a5568',
            fontFamily: 'Inter, sans-serif', marginTop: '2px',
          }}
        />
      </div>
    </div>
  );
}
