'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus } from 'lucide-react'
import { createChallengeTeam, inviteToTeam } from '@/lib/actions/challenges'
import { toast } from 'sonner'

interface TeamFormModalProps {
  isOpen: boolean
  onClose: () => void
  challengeId: string
  onSuccess?: () => void
}

export function TeamFormModal({
  isOpen,
  onClose,
  challengeId,
  onSuccess,
}: TeamFormModalProps) {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('create')

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      toast.error('Please enter a team name')
      return
    }

    setLoading(true)
    const result = await createChallengeTeam({
      challengeId,
      teamName: teamName.trim(),
    })

    if (result.success) {
      toast.success('Team created successfully!')
      setTeamName('')
      onClose()
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to create team')
    }
    setLoading(false)
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
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Climate Warriors"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be set as the team leader and can invite other researchers to join.
            </p>
            <Button
              onClick={handleCreateTeam}
              disabled={loading || !teamName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            <div className="text-center p-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Join requests will appear here when teams open recruitment
              </p>
              <Button variant="outline" size="sm" disabled>
                No Teams Available
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
