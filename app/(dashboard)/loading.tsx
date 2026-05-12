import Image from 'next/image'

export default function DashboardLoading() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#05010F' }}
    >
      {/* Logo with pulse animation */}
      <div className="animate-pulse">
        <Image 
          src="/icon.svg" 
          alt="ResearchFlow" 
          width={64} 
          height={64}
          className="w-16 h-16"
        />
      </div>
      
      {/* Loading text */}
      <div className="text-center">
        <h2 
          className="text-xl font-semibold mb-2"
          style={{ color: '#F3F0FF' }}
        >
          Loading your dashboard...
        </h2>
        <p style={{ color: '#7C6A9C' }}>
          Please wait while we prepare everything for you
        </p>
      </div>

      {/* Loading spinner */}
      <div 
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ 
          borderColor: 'rgba(139,92,246,0.2)',
          borderTopColor: '#7C3AED'
        }}
      />
    </div>
  )
}
