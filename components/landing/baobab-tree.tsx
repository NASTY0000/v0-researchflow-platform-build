'use client'

export function BaobabTree() {
  return (
    <div className="relative w-full h-full flex items-end justify-center" style={{ minHeight: '520px' }}>
      <svg
        viewBox="0 0 520 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-lg"
        style={{
          filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.15))',
          animation: 'baobabFloat 6s ease-in-out infinite',
        }}
      >
        <defs>
          <linearGradient id="trunkGrad" x1="260" y1="200" x2="260" y2="580" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4C1D95"/>
            <stop offset="60%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#FBBF24"/>
          </linearGradient>
          <radialGradient id="baseGlow" cx="50%" cy="100%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.35"/>
            <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0"/>
          </radialGradient>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="apexGlow">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="branchGlow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Base amber glow */}
        <ellipse cx="260" cy="575" rx="180" ry="40" fill="url(#baseGlow)"/>

        {/* Root spread */}
        <path d="M200 570 Q220 555 240 545 Q255 540 260 535" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" opacity="0.4"/>
        <path d="M320 570 Q300 555 280 545 Q265 540 260 535" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" opacity="0.4"/>
        <path d="M180 565 Q210 552 235 542 Q250 537 260 532" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" opacity="0.25"/>
        <path d="M340 565 Q310 552 285 542 Q270 537 260 532" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" opacity="0.25"/>

        {/* MAIN TRUNK */}
        <path d="M245 575 Q242 540 248 510 Q252 490 255 470 Q258 450 260 430 Q261 410 260 390 Q259 370 258 350 Q257 330 260 310 Q262 290 260 270 Q258 250 260 230" stroke="url(#trunkGrad)" strokeWidth="22" strokeLinecap="round" fill="none"/>
        <path d="M253 575 Q251 540 256 510 Q259 490 261 470 Q263 450 264 430 Q264 410 263 390 Q262 375 262 355 Q261 335 263 315 Q264 295 263 275" stroke="#6D28D9" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.5"/>

        {/* Branch 1: Far left lower */}
        <path d="M254 420 Q230 400 200 385 Q175 372 150 360 Q130 350 110 338" stroke="#7C3AED" strokeWidth="9" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M150 360 Q138 340 125 322" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M110 338 Q95 320 85 298" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>

        {/* Branch 2: Left mid */}
        <path d="M257 370 Q235 348 208 332 Q185 318 162 305 Q142 294 125 280" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M162 305 Q148 285 138 262" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.75"/>

        {/* Branch 3: Left upper */}
        <path d="M259 310 Q245 285 225 265 Q208 248 188 232 Q170 218 155 200" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M188 232 Q175 210 168 186" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M155 200 Q145 178 140 155" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.65"/>

        {/* Branch 4: Far right lower */}
        <path d="M264 415 Q288 395 318 378 Q345 363 370 348 Q392 335 410 320" stroke="#7C3AED" strokeWidth="9" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M370 348 Q385 328 395 305" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M410 320 Q422 298 428 274" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>

        {/* Branch 5: Right mid */}
        <path d="M261 360 Q282 338 308 320 Q330 305 355 290 Q376 277 395 260" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M355 290 Q368 268 375 244" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.75"/>

        {/* Branch 6: Right upper */}
        <path d="M260 298 Q278 272 302 252 Q322 235 345 218 Q364 203 382 185" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>
        <path d="M345 218 Q358 196 365 172" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M382 185 Q392 162 395 138" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.65"/>

        {/* Branch 7: Apex (center up) */}
        <path d="M260 230 Q258 205 260 180 Q261 162 260 142 Q259 125 260 108" stroke="#7C3AED" strokeWidth="6" strokeLinecap="round" fill="none" filter="url(#branchGlow)"/>

        {/* Branch 1 tips */}
        <circle cx="110" cy="338" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="110" cy="338" r="11" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="85" cy="298" r="5" fill="#7C3AED" opacity="0.85" filter="url(#nodeGlow)"/>
        <circle cx="85" cy="298" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.35"/>
        <circle cx="125" cy="322" r="4" fill="#9333EA" opacity="0.8"/>

        {/* Branch 2 tips */}
        <circle cx="125" cy="280" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="125" cy="280" r="11" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="138" cy="262" r="5" fill="#7C3AED" opacity="0.8" filter="url(#nodeGlow)"/>
        <circle cx="138" cy="262" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.3"/>

        {/* Branch 3 tips */}
        <circle cx="155" cy="200" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="155" cy="200" r="12" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="168" cy="186" r="5" fill="#9333EA" opacity="0.8" filter="url(#nodeGlow)"/>
        <circle cx="140" cy="155" r="5" fill="#7C3AED" opacity="0.85" filter="url(#nodeGlow)"/>
        <circle cx="140" cy="155" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.35"/>

        {/* Branch 4 tips */}
        <circle cx="410" cy="320" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="410" cy="320" r="11" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="395" cy="305" r="5" fill="#7C3AED" opacity="0.8" filter="url(#nodeGlow)"/>
        <circle cx="428" cy="274" r="5" fill="#9333EA" opacity="0.85" filter="url(#nodeGlow)"/>
        <circle cx="428" cy="274" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.3"/>

        {/* Branch 5 tips */}
        <circle cx="395" cy="260" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="395" cy="260" r="12" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="375" cy="244" r="5" fill="#7C3AED" opacity="0.8" filter="url(#nodeGlow)"/>
        <circle cx="375" cy="244" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.3"/>

        {/* Branch 6 tips */}
        <circle cx="382" cy="185" r="6" fill="#7C3AED" opacity="0.9" filter="url(#nodeGlow)"/>
        <circle cx="382" cy="185" r="12" stroke="#7C3AED" strokeWidth="1.5" fill="none" opacity="0.4"/>
        <circle cx="365" cy="172" r="5" fill="#9333EA" opacity="0.8" filter="url(#nodeGlow)"/>
        <circle cx="395" cy="138" r="5" fill="#7C3AED" opacity="0.85" filter="url(#nodeGlow)"/>
        <circle cx="395" cy="138" r="9" stroke="#7C3AED" strokeWidth="1" fill="none" opacity="0.35"/>

        {/* APEX NODE - Gold */}
        <circle cx="260" cy="98" r="28" stroke="#FBBF24" strokeWidth="1" fill="none" opacity="0.15"
          style={{ animation: 'apexPulse 3s ease-in-out infinite' }}/>
        <circle cx="260" cy="98" r="20" stroke="#FBBF24" strokeWidth="1.5" fill="none" opacity="0.25"
          style={{ animation: 'apexPulse 3s ease-in-out infinite 0.5s' }}/>
        <circle cx="260" cy="98" r="13" stroke="#FBBF24" strokeWidth="2" fill="none" opacity="0.4"/>
        <circle cx="260" cy="98" r="9" fill="#FBBF24" filter="url(#apexGlow)"
          style={{ animation: 'apexGlow 3s ease-in-out infinite' }}/>
        <circle cx="260" cy="98" r="4" fill="white" opacity="0.95"/>

        {/* Data pulse dots on trunk */}
        <circle cx="260" cy="350" r="3" fill="#A855F7" opacity="0.6"
          style={{ animation: 'dataPulse 4s ease-in-out infinite' }}/>
        <circle cx="260" cy="290" r="2.5" fill="#A855F7" opacity="0.5"
          style={{ animation: 'dataPulse 4s ease-in-out infinite 1s' }}/>
        <circle cx="260" cy="240" r="2" fill="#C084FC" opacity="0.5"
          style={{ animation: 'dataPulse 4s ease-in-out infinite 2s' }}/>
      </svg>

      <style>{`
        @keyframes baobabFloat {
          0%, 100% { transform: translateY(0px) }
          50% { transform: translateY(-12px) }
        }
        @keyframes apexPulse {
          0%, 100% { opacity: 0.15; transform: scale(1) }
          50% { opacity: 0.4; transform: scale(1.1) }
        }
        @keyframes apexGlow {
          0%, 100% { filter: drop-shadow(0 0 6px #FBBF24) }
          50% { filter: drop-shadow(0 0 16px #FBBF24) }
        }
        @keyframes dataPulse {
          0% { opacity: 0; transform: translateY(0) }
          50% { opacity: 0.8 }
          100% { opacity: 0; transform: translateY(-20px) }
        }
      `}</style>
    </div>
  )
}
