import Image from 'next/image'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#05010F' }}>
      <div className="text-center space-y-5">
        <div className="w-14 h-14 rounded-xl overflow-hidden mx-auto">
          <Image src="/icon.svg" alt="ResearchFlow" width={56} height={56} className="w-14 h-14" />
        </div>
        <div className="w-10 h-10 rounded-full animate-spin mx-auto" style={{ border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED' }} />
        <p className="text-sm" style={{ color: '#7C6A9C' }}>Loading your dashboard...</p>
      </div>
    </div>
  )
}
