import confetti from 'canvas-confetti'

const COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#22D3EE', '#FBBF24', '#F5F0E8']

export function celebrateAchievement() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: COLORS,
    ticks: 200,
  })
}

export function celebrateMilestone() {
  const end = Date.now() + 2000
  const colors = ['#7C3AED', '#FBBF24', '#22D3EE']

  const frame = () => {
    confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function celebrateConnection() {
  confetti({
    particleCount: 50,
    spread: 45,
    origin: { y: 0.7 },
    colors: ['#7C3AED', '#22D3EE', '#FBBF24'],
    ticks: 150,
    gravity: 1.2,
  })
}
