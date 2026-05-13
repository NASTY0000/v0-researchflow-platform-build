"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Search,
  FlaskConical,
  Database,
  BarChart3,
  FileEdit,
  Eye,
  Send,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Project } from "@/lib/types/database"
import { ShowcaseSubmit } from "./showcase-submit"

interface ProjectRoadmapProps {
  project: Project
  currentUserId?: string | null
  isOwner?: boolean
}

const PHASES = [
  {
    id: "problem_identification",
    title: "Problem Identification",
    icon: Search,
    description: "Define research questions and objectives",
    tasks: [
      "Define research problem",
      "Identify key questions",
      "Set research objectives",
      "Determine scope and constraints",
    ],
  },
  {
    id: "literature_review",
    title: "Literature Review",
    icon: BookOpen,
    description: "Review existing research and identify gaps",
    tasks: [
      "Search relevant databases",
      "Review key papers",
      "Identify research gaps",
      "Document findings",
    ],
  },
  {
    id: "methodology",
    title: "Methodology",
    icon: FlaskConical,
    description: "Design research approach and methods",
    tasks: [
      "Select research design",
      "Define data collection methods",
      "Create research protocols",
      "Get ethics approval (if needed)",
    ],
  },
  {
    id: "data_collection",
    title: "Data Collection",
    icon: Database,
    description: "Gather and organize research data",
    tasks: [
      "Prepare data collection tools",
      "Collect primary data",
      "Gather secondary data",
      "Organize and clean data",
    ],
  },
  {
    id: "analysis",
    title: "Analysis",
    icon: BarChart3,
    description: "Analyze data and interpret results",
    tasks: [
      "Perform statistical analysis",
      "Interpret findings",
      "Create visualizations",
      "Draw conclusions",
    ],
  },
  {
    id: "writing",
    title: "Writing",
    icon: FileEdit,
    description: "Write and format the research paper",
    tasks: [
      "Draft introduction",
      "Write methodology section",
      "Document results",
      "Write discussion and conclusion",
    ],
  },
  {
    id: "review",
    title: "Review",
    icon: Eye,
    description: "Review and refine the research",
    tasks: [
      "Internal review",
      "Peer feedback",
      "Revise and improve",
      "Final proofreading",
    ],
  },
  {
    id: "publication",
    title: "Publication",
    icon: Send,
    description: "Submit and publish the research",
    tasks: [
      "Select target journal/conference",
      "Format according to guidelines",
      "Submit for review",
      "Address reviewer feedback",
    ],
  },
]

export function ProjectRoadmap({ project, currentUserId = null, isOwner = false }: ProjectRoadmapProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(project.current_phase || "problem_identification")

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === project.current_phase)
  const progressPercent = Math.round(((currentPhaseIndex + 1) / PHASES.length) * 100)

  async function updatePhase(phaseId: string) {
    const supabase = createClient()
    await supabase.from("projects").update({ current_phase: phaseId }).eq("id", project.id)
    // In a real app, you'd also update local state or refetch
  }

  function getPhaseStatus(phaseIndex: number): "completed" | "current" | "upcoming" {
    if (phaseIndex < currentPhaseIndex) return "completed"
    if (phaseIndex === currentPhaseIndex) return "current"
    return "upcoming"
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Research Progress</CardTitle>
          <CardDescription>Track your project through the research lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              Current phase: <span className="font-medium text-foreground">{PHASES[currentPhaseIndex]?.title || "Not started"}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {PHASES.map((phase, index) => {
            const status = getPhaseStatus(index)
            const isExpanded = expandedPhase === phase.id
            const PhaseIcon = phase.icon

            return (
              <div key={phase.id} className="relative pl-16">
                {/* Phase Indicator */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                    status === "completed"
                      ? "bg-green-500/20 text-green-500 border-2 border-green-500"
                      : status === "current"
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground border-2 border-border"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <PhaseIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Phase Card */}
                <Card
                  className={`cursor-pointer transition-all ${
                    status === "current" ? "border-primary/50 shadow-lg shadow-primary/10" : ""
                  } ${status === "upcoming" ? "opacity-60" : ""}`}
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{phase.title}</CardTitle>
                        {status === "current" && <Badge>Current</Badge>}
                        {status === "completed" && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="p-4 pt-0 border-t mt-2">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Key Tasks</h4>
                        <ul className="space-y-2">
                          {phase.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-center gap-2 text-sm">
                              {status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={status === "completed" ? "line-through text-muted-foreground" : ""}>
                                {task}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {status === "current" && (
                          <div className="flex gap-2 pt-3">
                            {index > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updatePhase(PHASES[index - 1].id)
                                }}
                              >
                                Previous Phase
                              </Button>
                            )}
                            {index < PHASES.length - 1 && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updatePhase(PHASES[index + 1].id)
                                }}
                              >
                                Mark Complete
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* Showcase submission — owner only */}
      <ShowcaseSubmit
        project={project}
        currentUserId={currentUserId}
        isOwner={isOwner}
        allPhasesComplete={currentPhaseIndex >= 6}
      />
    </div>
  )
}
