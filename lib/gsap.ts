'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  // Layout settles late (fonts, dynamic three.js chunk), so recalc trigger
  // positions once everything has loaded.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
}

export { gsap, ScrollTrigger }
