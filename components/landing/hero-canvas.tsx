'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Realistic living Earth centered on Africa: day/night terminator with city
 * lights, drifting cloud layer, violet atmosphere rim, and pulsing markers on
 * African university cities connected by animated collaboration arcs.
 * Reacts to pointer movement, pauses off-screen, and renders static frames
 * when the user prefers reduced motion.
 */

const EARTH_RADIUS = 2.35
const STAR_COUNT = 450

// African university cities [lat, lon]
const CITIES: [number, number][] = [
  [6.52, 3.37],    // Lagos
  [7.38, 3.95],    // Ibadan
  [11.08, 7.71],   // Zaria
  [9.06, 7.49],    // Abuja
  [5.6, -0.19],    // Accra
  [6.69, -1.62],   // Kumasi
  [14.72, -17.47], // Dakar
  [-1.29, 36.82],  // Nairobi
  [0.35, 32.58],   // Kampala
  [-6.79, 39.21],  // Dar es Salaam
  [9.03, 38.74],   // Addis Ababa
  [30.04, 31.24],  // Cairo
  [36.75, 3.06],   // Algiers
  [33.57, -7.59],  // Casablanca
  [-33.92, 18.42], // Cape Town
  [-26.2, 28.05],  // Johannesburg
  [-17.83, 31.05], // Harare
  [-1.94, 30.06],  // Kigali
]

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function makeGlowTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.6);
    vec3 color = mix(vec3(0.35, 0.45, 1.0), vec3(0.62, 0.4, 1.0), rim);
    gl_FragColor = vec4(color, rim * 0.9);
  }
`

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = mount.clientWidth || 1
    let height = mount.clientHeight || 1

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(width, height)
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.35, 6.6)
    camera.lookAt(0, 0, 0)

    // Sun from the upper left; dim violet ambient so the night side stays readable
    const sun = new THREE.DirectionalLight(0xfff2e0, 2.1)
    sun.position.set(-5, 2, 3.5)
    scene.add(sun)
    scene.add(new THREE.AmbientLight(0x8a7bff, 0.32))

    const disposables: { dispose(): void }[] = []
    const glowTexture = makeGlowTexture()
    disposables.push(glowTexture)

    const loader = new THREE.TextureLoader()
    const loadTexture = (url: string, colorSpace?: THREE.ColorSpace) => {
      const tex = loader.load(url, () => {
        if (prefersReducedMotion) renderFrame()
      })
      if (colorSpace) tex.colorSpace = colorSpace
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
      disposables.push(tex)
      return tex
    }

    // Parallax group (pointer) wraps the spin group (rotation)
    const parallaxGroup = new THREE.Group()
    // Sit the planet low in the frame so the copy reads above its horizon
    parallaxGroup.position.y = -1.35
    scene.add(parallaxGroup)
    const earthGroup = new THREE.Group()
    // Start with Africa (~lon 17E) facing the camera: facing lon L requires
    // rotation.y = -(PI/2 + L) given the equirect UV mapping used by three.js
    earthGroup.rotation.y = -(Math.PI / 2 + (17 * Math.PI) / 180)
    parallaxGroup.add(earthGroup)

    // ── Earth ──
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 96, 96)
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: loadTexture('/textures/earth_atmos_2048.jpg', THREE.SRGBColorSpace),
      normalMap: loadTexture('/textures/earth_normal_2048.jpg'),
      normalScale: new THREE.Vector2(0.85, 0.85),
      specularMap: loadTexture('/textures/earth_specular_2048.jpg'),
      specular: new THREE.Color(0x5577aa),
      shininess: 18,
      emissiveMap: loadTexture('/textures/earth_lights_2048.png', THREE.SRGBColorSpace),
      emissive: new THREE.Color(0xffc97a),
      emissiveIntensity: 1.15,
    })
    disposables.push(earthGeometry, earthMaterial)
    earthGroup.add(new THREE.Mesh(earthGeometry, earthMaterial))

    // ── Clouds ──
    const cloudGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.008, 64, 64)
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: loadTexture('/textures/earth_clouds_1024.png', THREE.SRGBColorSpace),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    disposables.push(cloudGeometry, cloudMaterial)
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
    earthGroup.add(clouds)

    // ── Atmosphere rim ──
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.14, 64, 64)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX,
      fragmentShader: ATMOSPHERE_FRAGMENT,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    disposables.push(atmosphereGeometry, atmosphereMaterial)
    parallaxGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial))

    // ── City markers (pulse with the animation loop) ──
    const cityPositions = CITIES.map(([lat, lon]) => latLonToVector3(lat, lon, EARTH_RADIUS * 1.005))
    const markerPositions = new Float32Array(cityPositions.length * 3)
    cityPositions.forEach((p, i) => markerPositions.set([p.x, p.y, p.z], i * 3))
    const markerGeometry = new THREE.BufferGeometry()
    markerGeometry.setAttribute('position', new THREE.BufferAttribute(markerPositions, 3))
    const markerMaterial = new THREE.PointsMaterial({
      size: 0.085,
      color: new THREE.Color('#E9D5FF'),
      map: glowTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    disposables.push(markerGeometry, markerMaterial)
    const markers = new THREE.Points(markerGeometry, markerMaterial)
    earthGroup.add(markers)

    // ── Collaboration arcs between cities ──
    const curves: THREE.QuadraticBezierCurve3[] = []
    const arcVertices: number[] = []
    const usedPairs = new Set<string>()
    let guard = 0
    while (curves.length < 14 && guard < 500) {
      guard++
      const ai = Math.floor(Math.random() * cityPositions.length)
      const bi = Math.floor(Math.random() * cityPositions.length)
      const key = ai < bi ? `${ai}-${bi}` : `${bi}-${ai}`
      if (ai === bi || usedPairs.has(key)) continue
      const a = cityPositions[ai]
      const b = cityPositions[bi]
      const angle = a.angleTo(b)
      if (angle < 0.12 || angle > 1.35) continue
      usedPairs.add(key)
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(EARTH_RADIUS * (1.05 + angle * 0.28))
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone())
      curves.push(curve)
      const pts = curve.getPoints(30)
      for (let i = 0; i < pts.length - 1; i++) {
        arcVertices.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
    }
    const arcGeometry = new THREE.BufferGeometry()
    arcGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arcVertices), 3))
    const arcMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#A78BFA'),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    disposables.push(arcGeometry, arcMaterial)
    earthGroup.add(new THREE.LineSegments(arcGeometry, arcMaterial))

    // ── Pulses traveling along arcs ──
    const pulses = curves.map((_, i) => ({ curve: i, t: Math.random(), speed: 0.0016 + Math.random() * 0.0026 }))
    const pulsePositions = new Float32Array(pulses.length * 3)
    const pulseGeometry = new THREE.BufferGeometry()
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3))
    const pulseMaterial = new THREE.PointsMaterial({
      size: 0.11,
      color: new THREE.Color('#FDE68A'),
      map: glowTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    disposables.push(pulseGeometry, pulseMaterial)
    earthGroup.add(new THREE.Points(pulseGeometry, pulseMaterial))

    // ── Star field ──
    const starPositions = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(12 + Math.random() * 28)
      starPositions.set([v.x, v.y, v.z], i * 3)
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: new THREE.Color('#C4B5FD'),
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    disposables.push(starGeometry, starMaterial)
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    // ── Interaction & loop ──
    const pointerTarget = { x: 0, y: 0 }
    const pointerCurrent = { x: 0, y: 0 }
    const onPointerMove = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1
    }

    const clock = new THREE.Clock()
    let rafId = 0
    let running = false
    let inView = true
    let pageVisible = !document.hidden

    const renderFrame = () => {
      const delta = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.elapsedTime

      // Slow spin keeps the planet alive without losing Africa for minutes
      earthGroup.rotation.y += delta * 0.011
      clouds.rotation.y += delta * 0.008
      stars.rotation.y += delta * 0.004

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.04
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.04
      parallaxGroup.rotation.y = pointerCurrent.x * 0.1
      parallaxGroup.rotation.x = pointerCurrent.y * 0.08
      camera.position.y = 0.35 + Math.sin(elapsed * 0.35) * 0.05

      // Breathe the city markers
      markerMaterial.size = 0.085 + Math.sin(elapsed * 2.2) * 0.018

      const positions = pulseGeometry.getAttribute('position') as THREE.BufferAttribute
      pulses.forEach((pulse, i) => {
        pulse.t += pulse.speed * delta * 60
        if (pulse.t > 1) {
          pulse.t = 0
          pulse.curve = Math.floor(Math.random() * curves.length)
        }
        const p = curves[pulse.curve].getPoint(pulse.t)
        positions.setXYZ(i, p.x, p.y, p.z)
      })
      positions.needsUpdate = true

      renderer.render(scene, camera)
    }

    const loop = () => {
      renderFrame()
      rafId = requestAnimationFrame(loop)
    }

    const syncRunning = () => {
      const shouldRun = inView && pageVisible && !prefersReducedMotion
      if (shouldRun && !running) {
        running = true
        clock.getDelta()
        rafId = requestAnimationFrame(loop)
      } else if (!shouldRun && running) {
        running = false
        cancelAnimationFrame(rafId)
      }
    }

    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      syncRunning()
    })
    intersection.observe(mount)

    const onVisibility = () => {
      pageVisible = !document.hidden
      syncRunning()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const resize = new ResizeObserver(() => {
      width = mount.clientWidth || 1
      height = mount.clientHeight || 1
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      if (prefersReducedMotion) renderFrame()
    })
    resize.observe(mount)

    if (prefersReducedMotion) {
      renderFrame()
    } else {
      window.addEventListener('pointermove', onPointerMove)
      syncRunning()
    }

    return () => {
      cancelAnimationFrame(rafId)
      running = false
      intersection.disconnect()
      resize.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
}
