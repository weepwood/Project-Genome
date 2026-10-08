export type ProjectStage =
  | 'idea'
  | 'exploring'
  | 'validating'
  | 'building'
  | 'operating'
  | 'paused'
  | 'completed'
  | 'abandoned'

export type TaskStatus = 'backlog' | 'in-progress' | 'done'

export type Project = {
  id: string
  name: string
  description: string
  objective: string
  stage: ProjectStage
  impact: number
  confidence: number
  strategic: number
  effort: number
  createdAt: string
  updatedAt: string
  tasks: Task[]
  hypotheses: Hypothesis[]
  experiments: Experiment[]
  decisions: Decision[]
}

export type Task = {
  id: string
  title: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  estimate: number
}

export type Hypothesis = {
  id: string
  statement: string
  importance: number
  confidence: number
  status: 'untested' | 'testing' | 'validated' | 'rejected'
}

export type Experiment = {
  id: string
  title: string
  objective: string
  result?: string
  status: 'planned' | 'running' | 'completed'
  cost: string
}

export type Decision = {
  id: string
  date: string
  decision: string
  reason: string
  nextStep: string
}

export type AppState = {
  projects: Project[]
}
