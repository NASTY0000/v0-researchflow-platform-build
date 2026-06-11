'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Interactive "global research network" — a particle globe whose nodes are
 * researchers and whose arcs are collaborations, with light pulses traveling
 * between them. Reacts to pointer movement, pauses off-screen, and renders a
 * single static frame when the user prefers reduced motion.
 */

const NODE_COUNT = 560
const ARC_COUNT = 64
const PULSE_COUNT = 18
const STAR_COUNT = 420
const GLOBE_RADIUS = 2.15

const PALETTE = {
  violet: new THREE.Color('#8B5CF6'),
  purple: new THREE.Color('#A855F7'),
  cyan: new THREE.Color('#22D3EE'),
  amber: new THREE.Color('#FBBF24'),
  arc: new THREE.Color('#7C3AED'),
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

/** Evenly distribute points on a sphere (fibonacci lattice) with slight jitter. */
function fibonacciSphere(count: number, radius: number) {
  const points: THREE.Vector3[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    const jitter = 1 + (Math.random() - 0.5) * 0.04
    points.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius * jitter,
        y * radius * jitter,
        Math.sin(theta) * r * radius * jitter,
      ),
    )
  }
  return points
}

export default function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = mount.clientWidth || 1
    let height = mount.clientHeight || 1

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100)
    camera.position.set(0, 0.15, 6.4)

    const glowTexture = makeGlowTexture()
    const group = new THREE.Group()
    scene.add(group)

    // ── Nodes ──
    const nodePoints = fibonacciSphere(NODE_COUNT, GLOBE_RADIUS)
    const nodePositions = new Float32Array(NODE_COUNT * 3)
    const nodeColors = new Float32Array(NODE_COUNT * 3)
    nodePoints.forEach((p, i) => {
      nodePositions.set([p.x, p.y, p.z], i * 3)
      const roll = Math.random()
      const color = roll < 0.78 ? (roll < 0.4 ? PALETTE.violet : PALETTE.purple) : roll < 0.93 ? PALETTE.cyan : PALETTE.amber
      nodeColors.set([color.r, color.g, color.b], i * 3)
    })
    const nodeGeometry = new THREE.BufferGeometry()
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    nodeGeometry.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3))
    const nodeMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      map: glowTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    group.add(new THREE.Points(nodeGeometry, nodeMaterial))

    // ── Collaboration arcs between nearby nodes ──
    const curves: THREE.QuadraticBezierCurve3[] = []
    const arcVertices: number[] = []
    const segmentsPerArc = 28
    let guard = 0
    while (curves.length < ARC_COUNT && guard < 4000) {
      guard++
      const a = nodePoints[Math.floor(Math.random() * NODE_COUNT)]
      const b = nodePoints[Math.floor(Math.random() * NODE_COUNT)]
      const angle = a.angleTo(b)
      if (angle < 0.35 || angle > 1.25) continue
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_RADIUS * (1.08 + angle * 0.22))
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone())
      curves.push(curve)
      const pts = curve.getPoints(segmentsPerArc)
      for (let i = 0; i < pts.length - 1; i++) {
        arcVertices.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
    }
    const arcGeometry = new THREE.BufferGeometry()
    arcGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arcVertices), 3))
    const arcMaterial = new THREE.LineBasicMaterial({
      color: PALETTE.arc,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    group.add(new THREE.LineSegments(arcGeometry, arcMaterial))

    // ── Light pulses traveling along arcs ──
    const pulses = Array.from({ length: PULSE_COUNT }, () => ({
      curve: Math.floor(Math.random() * curves.length),
      t: Math.random(),
      speed: 0.0014 + Math.random() * 0.0028,
    }))
    const pulsePositions = new Float32Array(PULSE_COUNT * 3)
    const pulseGeometry = new THREE.BufferGeometry()
    pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3))
    const pulseMaterial = new THREE.PointsMaterial({
      size: 0.085,
      color: new THREE.Color('#E9D5FF'),
      map: glowTexture,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    group.add(new THREE.Points(pulseGeometry, pulseMaterial))

    // ── Inner wireframe core ──
    const coreGeometry = new THREE.IcosahedronGeometry(GLOBE_RADIUS * 0.62, 1)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: PALETTE.violet,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    })
    const core = new THREE.Mesh(coreGeometry, coreMaterial)
    group.add(core)

    // ── Ambient star field ──
    const starPositions = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 26)
      starPositions.set([v.x, v.y, v.z], i * 3)
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: new THREE.Color('#C4B5FD'),
      map: glowTexture,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
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

      group.rotation.y += delta * 0.055
      core.rotation.x -= delta * 0.04
      stars.rotation.y += delta * 0.006

      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.045
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.045
      group.rotation.x = pointerCurrent.y * 0.14
      group.position.x = pointerCurrent.x * 0.22
      camera.position.y = 0.15 + Math.sin(elapsed * 0.4) * 0.06

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
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      arcGeometry.dispose()
      arcMaterial.dispose()
      pulseGeometry.dispose()
      pulseMaterial.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      glowTexture.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
}
