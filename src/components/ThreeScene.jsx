import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      mount.style.background = 'linear-gradient(135deg, #f6f7f9 0%, #edf0f5 100%)';
      return;
    }

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x6ea8fe, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-5, -2, 3);
    scene.add(fillLight);

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.8, emissive: new THREE.Color(0x2563eb), emissiveIntensity: 0.15 });
    const keyMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6, metalness: 0.1 });
    const trackpadMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.3, metalness: 0.4 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.6, emissive: new THREE.Color(0x2563eb), emissiveIntensity: 0.08 });

    // Define laptop parts: [geometry_args, target_position, target_rotation, material]
    const parts = [];
    const meshes = [];

    function makePart(geoArgs, targetPos, targetRot, mat) {
      const geo = new THREE.BoxGeometry(...geoArgs);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Scattered initial position
      const scatter = 6;
      mesh.position.set(
        (Math.random() - 0.5) * scatter * 2,
        (Math.random() - 0.5) * scatter * 2,
        (Math.random() - 0.5) * scatter * 1.5
      );
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      scene.add(mesh);
      parts.push({ mesh, targetPos: new THREE.Vector3(...targetPos), targetRot: new THREE.Euler(...targetRot) });
      meshes.push(mesh);
      return mesh;
    }

    // Laptop body (base)
    makePart([3.6, 0.18, 2.4], [0, -0.9, 0], [0, 0, 0], bodyMat);
    // Laptop lip/hinge bar
    makePart([3.6, 0.08, 0.12], [0, -0.72, -1.14], [0, 0, 0], accentMat);

    // Screen lid (opened ~110deg)
    makePart([3.5, 2.2, 0.1], [0, 0.2, -1.2], [-1.1, 0, 0], bodyMat);
    // Screen bezel top
    makePart([3.5, 0.15, 0.06], [0, 1.32, -1.26], [-1.1, 0, 0], accentMat);
    // Display panel
    makePart([3.1, 1.9, 0.04], [0, 0.2, -1.16], [-1.1, 0, 0], screenMat);
    // Webcam dot
    makePart([0.12, 0.12, 0.06], [0, 1.22, -1.22], [-1.1, 0, 0], accentMat);

    // Keyboard area
    const keyRows = 4;
    for (let r = 0; r < keyRows; r++) {
      makePart([3.2, 0.06, 0.3], [0, -0.8, -0.5 + r * 0.38], [0, 0, 0], keyMat);
    }

    // Trackpad
    makePart([1.1, 0.05, 0.75], [0, -0.82, 0.7], [0, 0, 0], trackpadMat);

    // Left speaker grille
    makePart([0.6, 0.04, 0.1], [-1.5, -0.82, 0.9], [0, 0, 0], accentMat);
    // Right speaker grille
    makePart([0.6, 0.04, 0.1], [1.5, -0.82, 0.9], [0, 0, 0], accentMat);

    // USB port slots (left side)
    makePart([0.2, 0.1, 0.08], [-1.82, -0.9, -0.3], [0, 0, 0], accentMat);
    makePart([0.2, 0.1, 0.08], [-1.82, -0.9, 0.0], [0, 0, 0], accentMat);
    // USB port slots (right side)
    makePart([0.2, 0.1, 0.08], [1.82, -0.9, -0.3], [0, 0, 0], accentMat);

    // Corner feet (4)
    const feetPositions = [[-1.6, -1.0, 1.0], [1.6, -1.0, 1.0], [-1.6, -1.0, -1.0], [1.6, -1.0, -1.0]];
    for (const fp of feetPositions) {
      makePart([0.18, 0.04, 0.18], fp, [0, 0, 0], accentMat);
    }

    // Floating particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
      particleSpeeds.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: 0
      });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x2563eb,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Group for scroll rotation
    const laptopGroup = new THREE.Group();
    parts.forEach(p => {
      scene.remove(p.mesh);
      laptopGroup.add(p.mesh);
    });
    scene.add(laptopGroup);

    // Animation state
    let animProgress = 0;
    const ANIM_DURATION = 2500; // ms
    let startTime = null;
    let scrollY = 0;

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll);

    // Easing function
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(timestamp) {
      animFrameId = requestAnimationFrame(animate);

      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      animProgress = Math.min(elapsed / ANIM_DURATION, 1);

      // Assembly animation for each part with stagger
      parts.forEach((p, i) => {
        const stagger = i / parts.length * 0.5; // 0 to 0.5 stagger
        const partProgress = Math.max(0, Math.min((animProgress - stagger * 0.3) / 0.85, 1));
        const t = easeOutCubic(partProgress);

        // The scatter positions were set initially; we lerp toward target
        if (partProgress < 1) {
          // We need the scatter position - store it
          if (!p.scatterPos) {
            p.scatterPos = p.mesh.position.clone();
            p.scatterRot = p.mesh.rotation.clone();
          }
          p.mesh.position.lerpVectors(p.scatterPos, p.targetPos, t);
          p.mesh.rotation.x = p.scatterRot.x + (p.targetRot.x - p.scatterRot.x) * t;
          p.mesh.rotation.y = p.scatterRot.y + (p.targetRot.y - p.scatterRot.y) * t;
          p.mesh.rotation.z = p.scatterRot.z + (p.targetRot.z - p.scatterRot.z) * t;
        } else {
          p.mesh.position.copy(p.targetPos);
          p.mesh.rotation.set(p.targetRot.x, p.targetRot.y, p.targetRot.z);
        }
      });

      // Scroll-based rotation
      const scrollRotation = scrollY * 0.0008;
      laptopGroup.rotation.x = -0.1 + scrollRotation * 0.5;
      laptopGroup.rotation.y = Math.sin(timestamp * 0.0003) * 0.15 + scrollRotation * 0.3;

      // Animate particles
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += particleSpeeds[i].x;
        pos[i * 3 + 1] += particleSpeeds[i].y;
        if (pos[i * 3] > 10) pos[i * 3] = -10;
        if (pos[i * 3] < -10) pos[i * 3] = 10;
        if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = -6;
        if (pos[i * 3 + 1] < -6) pos[i * 3 + 1] = 6;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    let animFrameId = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      [bodyMat, screenMat, keyMat, trackpadMat, accentMat].forEach(m => m.dispose());
      parts.forEach(p => p.mesh.geometry.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
