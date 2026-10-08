import type { AppState, Project } from './types'

const STORAGE_KEY = 'project-genome-state-v2'
const SCHEMA_VERSION = 1

type BackupPayload = {
  schemaVersion: number
  exportedAt: string
  app: 'project-genome'
  state: AppState
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<Project>
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    typeof project.description === 'string' &&
    typeof project.objective === 'string' &&
    Array.isArray(project.tasks) &&
    Array.isArray(project.hypotheses) &&
    Array.isArray(project.experiments) &&
    Array.isArray(project.decisions)
  )
}

function isState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const projects = (value as Partial<AppState>).projects
  return Array.isArray(projects) && projects.every(isProject)
}

export function loadState(fallback: AppState): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const state: unknown = JSON.parse(raw)
    return isState(state) ? state : fallback
  } catch {
    return fallback
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota errors should not break the UI; JSON export remains available.
  }
}

export function downloadState(state: AppState) {
  const payload: BackupPayload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'project-genome',
    state,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `project-genome-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readStateFile(file: File): Promise<AppState> {
  const raw = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('JSON 文件格式不正确')
  }

  const candidate =
    parsed &&
    typeof parsed === 'object' &&
    'state' in parsed
      ? (parsed as { state?: unknown }).state
      : parsed

  if (!isState(candidate)) {
    throw new Error('这不是有效的 Project Genome 数据文件')
  }

  return candidate
}
