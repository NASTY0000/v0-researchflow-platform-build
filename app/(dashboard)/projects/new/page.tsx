import Link from 'next/link'
import { ArrowLeft, FolderKanban } from 'lucide-react'

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: '#A855F7' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <h1 className="text-2xl font-bold font-heading mt-4" style={{ letterSpacing: '-0.02em' }}>New Project</h1>
        <p className="text-sm mt-1" style={{ color: '#7C6A9C' }}>Create and manage a research project</p>
      </div>

      <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <FolderKanban className="w-8 h-8" style={{ color: '#A855F7' }} />
        </div>
        <h2 className="text-xl font-bold font-heading mb-2">Coming Soon</h2>
        <p className="text-sm max-w-sm mx-auto" style={{ color: '#7C6A9C' }}>
          Project creation is under development. You&apos;ll be able to create full project workspaces with tasks, phases, and team management.
        </p>
        <Link href="/projects" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#C084FC' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    </div>
  )
}
