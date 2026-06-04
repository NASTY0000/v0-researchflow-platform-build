'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users } from 'lucide-react'
import { createChallengeTeam, joinChallengeTeam, ChallengeTeam } from '@/lib/actions/challenges'
import { toast } from 'sonner'

interface TeamFormModalProps {
  isOpen: boolean
  onClose: () => void
  challengeId: string
  openTeams?: ChallengeTeam[]
  onSuccess?: () => void
}

export function TeamFormModal({
  isOpen,
  onClose,
  challengeId,
  openTeams = [],
  onSuccess,
}: TeamFormModalProps) {
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('create')

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      toast.error('Please enter a team name')
      return
    }

    setLoading(true)
    const result = await createChallengeTeam({
      challengeId,
      name: teamName.trim(),
      description: description.trim() || undefined,
    })

    if (result.success) {
      toast.success('Team created successfully!')
      setTeamName('')
      setDescription('')
      onClose()
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to create team')
    }
    setLoading(false)
  }

  async function handleJoinTeam(teamId: string) {
    setJoiningTeamId(teamId)
    const result = await joinChallengeTeam(teamId)
    if (result.success) {
      toast.success('Joined team!')
      onClose()
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to join team')
    }
    setJoiningTeamId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Team Formation
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Team</TabsTrigger>
            <TabsTrigger value="join">Join Team</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="e.g., Climate Warriors"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="team-desc"
                placeholder="What's your team's approach?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be set as team leader. Other researchers can browse and join open teams.
            </p>
            <Button
              onClick={handleCreateTeam}
              disabled={loading || !teamName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-3">
            {openTeams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No open teams yet. Be the first to create one!</p>
              </div>
            ) : (
              openTeams.filter(t => t.is_open).map(team => (
                <div key={team.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.member_count || 0} members</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={joiningTeamId === team.id}
                    onClick={() => handleJoinTeam(team.id)}
                  >
                    {joiningTeamId === team.id ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
