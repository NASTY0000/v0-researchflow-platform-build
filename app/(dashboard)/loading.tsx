import { Logo } from '@/components/Logo'
import { BaobabLoader } from '@/components/ui/baobab-loader'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#05010F' }}>
      <div className="text-center space-y-5">
        <div className="mx-auto flex justify-center">
          <Logo variant="icon" width={56} />
        </div>
        <BaobabLoader size="md" />
        <p className="text-sm" style={{ color: '#7C6A9C' }}>Loading your dashboard...</p>
      </div>
    </div>
  )
}
