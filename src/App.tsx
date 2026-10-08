import { useEffect, useMemo, useState } from 'react'
import type {
  AppState,
  Decision,
  Experiment,
  Hypothesis,
  Project,
  ProjectStage,
  Task,
  TaskStatus,
} from './types'

type Page = 'overview' | 'projects' | 'portfolio' | 'review'
type ProjectTab = 'overview' | 'tasks' | 'hypotheses' | 'experiments' | 'decisions'

const STORAGE_KEY = 'project-genome-state-v1'

const stageMeta: Record<ProjectStage, { label: string; tone: string }> = {
  idea: { label: '想法', tone: 'gray' },
  exploring: { label: '探索中', tone: 'violet' },
  validating: { label: '验证中', tone: 'amber' },
  building: { label: '开发中', tone: 'blue' },
  operating: { label: '运营中', tone: 'green' },
  paused: { label: '暂停', tone: 'slate' },
  completed: { label: '已完成', tone: 'green' },
  abandoned: { label: '已终止', tone: 'red' },
}

const seedState: AppState = {
  projects: [
    {
      id: 'genome',
      name: 'Project Genome',
      description: 'AI 驱动的项目管理与决策工作台。',
      objective: '让个人开发者知道现在最值得做什么，以及什么时候应该停止。',
      stage: 'building',
      impact: 9,
      confidence: 7,
      strategic: 10,
      effort: 5,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-08',
      tasks: [
        { id: 't1', title: '完成 MVP 信息架构', status: 'done', priority: 'high', estimate: 2 },
        { id: 't2', title: '实现项目健康度', status: 'in-progress', priority: 'high', estimate: 3 },
        { id: 't3', title: '接入 GitHub 活动流', status: 'backlog', priority: 'medium', estimate: 5 },
        { id: 't4', title: '设计 Project Mutation', status: 'backlog', priority: 'high', estimate: 4 },
      ],
      hypotheses: [
        { id: 'h1', statement: '用户更需要“下一步应该做什么”，而不是更多任务列表。', importance: 10, confidence: 6, status: 'testing' },
        { id: 'h2', statement: '证据驱动的 AI Review 能减少项目中的无效投入。', importance: 9, confidence: 4, status: 'untested' },
        { id: 'h3', statement: 'Project Mutation 能帮助用户发现被忽略的新方向。', importance: 7, confidence: 5, status: 'untested' },
      ],
      experiments: [
        { id: 'e1', title: '用户路径实验', objective: '观察 5 个用户是否能在 30 秒内找到“下一步行动”。', status: 'running', cost: '30 分钟' },
        { id: 'e2', title: 'AI Critic 原型', objective: '用 3 个历史项目测试 AI 是否能指出真正的瓶颈。', status: 'completed', cost: '1 小时', result: '能够指出需求风险，但需要更强的证据引用。' },
      ],
      decisions: [
        { id: 'd1', date: '2026-10-08', decision: 'MVP 优先做决策流，而不是完整的团队协作。', reason: '差异化来自“为什么做 / 是否继续”，而非 Todo 功能数量。', nextStep: '补齐假设、实验、Decision 三个闭环。' },
      ],
    },
    {
      id: 'atlas',
      name: 'AI Knowledge Atlas',
      description: '把个人知识库变成可探索的关系网络。',
      objective: '让知识库主动发现知识缺口、冲突和潜在研究方向。',
      stage: 'validating',
      impact: 10,
      confidence: 4,
      strategic: 9,
      effort: 4,
      createdAt: '2026-09-22',
      updatedAt: '2026-10-07',
      tasks: [
        { id: 'a1', title: '抽样 1000 条笔记', status: 'done', priority: 'high', estimate: 2 },
        { id: 'a2', title: '定义关系发现规则', status: 'in-progress', priority: 'high', estimate: 4 },
        { id: 'a3', title: '验证知识缺口推荐', status: 'backlog', priority: 'high', estimate: 5 },
      ],
      hypotheses: [
        { id: 'ah1', statement: '用户会认为“知识缺口”比“自动打标签”更有价值。', importance: 9, confidence: 3, status: 'testing' },
        { id: 'ah2', statement: '关系图的价值来自解释，而不是节点数量。', importance: 8, confidence: 7, status: 'validated' },
      ],
      experiments: [
        { id: 'ae1', title: '真实笔记回放', objective: '从真实知识库里挑选 50 组笔记，评估推荐是否有新信息。', status: 'planned', cost: '2 小时' },
      ],
      decisions: [],
    },
    {
      id: 'vault',
      name: 'Personal Asset Vault',
      description: '统一管理图片、附件与可复用数字资产。',
      objective: '降低个人数字资产寻找、复用和迁移的成本。',
      stage: 'operating',
      impact: 7,
      confidence: 9,
      strategic: 7,
      effort: 6,
      createdAt: '2026-08-18',
      updatedAt: '2026-10-06',
      tasks: [
        { id: 'v1', title: '清理历史重复资产', status: 'done', priority: 'medium', estimate: 3 },
        { id: 'v2', title: '优化搜索索引', status: 'done', priority: 'high', estimate: 4 },
        { id: 'v3', title: '增加批量导出', status: 'backlog', priority: 'medium', estimate: 3 },
      ],
      hypotheses: [
        { id: 'vh1', statement: '搜索速度是资产库留存的关键因素。', importance: 8, confidence: 9, status: 'validated' },
      ],
      experiments: [],
      decisions: [
        { id: 'vd1', date: '2026-10-02', decision: '优先提升检索而非增加更多存储格式。', reason: '现有存储能力已经足够，发现效率是主要瓶颈。', nextStep: '持续跟踪搜索成功率。' },
      ],
    },
  ],
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function opportunity(project: Project) {
  const raw = (project.impact * project.confidence * project.strategic * 10) / Math.max(project.effort * 10, 1)
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function projectHealth(project: Project) {
  const total = project.tasks.length
  const done = project.tasks.filter((task) => task.status === 'done').length
  const openHighPriority = project.tasks.filter((task) => task.status !== 'done' && task.priority === 'high').length
  const uncertain = project.hypotheses.filter((h) => h.status === 'untested' || h.status === 'testing').length
  const completion = total ? done / total : 0.5
  const score = Math.round(55 + completion * 25 + Math.max(0, 18 - uncertain * 4) - openHighPriority * 5)
  return Math.max(0, Math.min(100, score))
}

function bestNextAction(project: Project) {
  const hypothesis = [...project.hypotheses]
    .filter((item) => item.status === 'untested' || item.status === 'testing')
    .sort((a, b) => b.importance * (10 - b.confidence) - a.importance * (10 - a.confidence))[0]

  if (hypothesis) {
    return {
      title: '验证最高价值的不确定性',
      detail: hypothesis.statement,
      why: '当前最重要的风险仍然是认知不确定性，继续增加开发投入前应先获得证据。',
      action: '设计一个最小实验',
    }
  }

  const task = [...project.tasks]
    .filter((item) => item.status !== 'done')
    .sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1))[0]

  if (task) {
    return {
      title: '推进最高优先级任务',
      detail: task.title,
      why: '当前项目已经通过主要验证，下一步瓶颈转向执行。',
      action: '开始任务',
    }
  }

  return {
    title: '进行一次项目复盘',
    detail: '整理最近的证据、决策与下一步。',
    why: '项目没有明显执行阻塞，应该把学习沉淀成下一轮决策。',
    action: '开始复盘',
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    // fallback to seed data
  }
  return seedState
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [page, setPage] = useState<Page>('overview')
  const [selectedId, setSelectedId] = useState('genome')
  const [projectTab, setProjectTab] = useState<ProjectTab>('overview')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'task' | 'hypothesis' | 'experiment' | 'decision'>('task')
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [mutation, setMutation] = useState<{ title: string; body: string } | null>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    objective: '',
    stage: 'idea' as ProjectStage,
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const selected = state.projects.find((project) => project.id === selectedId) ?? state.projects[0]

  const filteredProjects = useMemo(
    () => state.projects.filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(search.toLowerCase())),
    [state.projects, search],
  )

  const totalOpenTasks = state.projects.reduce(
    (sum, project) => sum + project.tasks.filter((task) => task.status !== 'done').length,
    0,
  )

  const topProject = [...state.projects].sort((a, b) => opportunity(b) - opportunity(a))[0]
  const avgHealth = Math.round(state.projects.reduce((sum, project) => sum + projectHealth(project), 0) / state.projects.length)

  function updateProject(projectId: string, updater: (project: Project) => Project) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === projectId ? updater(project) : project)),
    }))
  }

  function openProject(projectId: string, tab: ProjectTab = 'overview') {
    setSelectedId(projectId)
    setPage('projects')
    setProjectTab(tab)
  }

  function addTask(title: string, priority: Task['priority'] = 'medium') {
    if (!selected || !title.trim()) return
    const task: Task = { id: makeId('task'), title: title.trim(), status: 'backlog', priority, estimate: 2 }
    updateProject(selected.id, (project) => ({ ...project, updatedAt: new Date().toISOString().slice(0, 10), tasks: [...project.tasks, task] }))
  }

  function addHypothesis(statement: string) {
    if (!selected || !statement.trim()) return
    const hypothesis: Hypothesis = {
      id: makeId('hypothesis'),
      statement: statement.trim(),
      importance: 7,
      confidence: 3,
      status: 'untested',
    }
    updateProject(selected.id, (project) => ({ ...project, updatedAt: new Date().toISOString().slice(0, 10), hypotheses: [...project.hypotheses, hypothesis] }))
  }

  function addExperiment(title: string) {
    if (!selected || !title.trim()) return
    const experiment: Experiment = {
      id: makeId('experiment'),
      title: title.trim(),
      objective: '定义成功标准并在最小成本下获取证据。',
      status: 'planned',
      cost: '1 小时',
    }
    updateProject(selected.id, (project) => ({ ...project, updatedAt: new Date().toISOString().slice(0, 10), experiments: [...project.experiments, experiment] }))
  }

  function addDecision(decision: string) {
    if (!selected || !decision.trim()) return
    const item: Decision = {
      id: makeId('decision'),
      date: new Date().toISOString().slice(0, 10),
      decision: decision.trim(),
      reason: '记录当前判断，避免未来只记得结论而忘记依据。',
      nextStep: '将决定转化为一个可执行动作。',
    }
    updateProject(selected.id, (project) => ({ ...project, updatedAt: item.date, decisions: [item, ...project.decisions] }))
  }

  function moveTask(taskId: string, status: TaskStatus) {
    if (!selected) return
    updateProject(selected.id, (project) => ({
      ...project,
      updatedAt: new Date().toISOString().slice(0, 10),
      tasks: project.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    }))
    setDraggedTask(null)
  }

  function createProject() {
    if (!newProject.name.trim()) return
    const project: Project = {
      id: makeId('project'),
      name: newProject.name.trim(),
      description: newProject.description.trim() || '一个待持续验证与执行的项目。',
      objective: newProject.objective.trim() || '明确问题、验证假设并获得可复用的结果。',
      stage: newProject.stage,
      impact: 7,
      confidence: 3,
      strategic: 7,
      effort: 5,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      tasks: [],
      hypotheses: [],
      experiments: [],
      decisions: [],
    }
    setState((current) => ({ ...current, projects: [project, ...current.projects] }))
    setNewProject({ name: '', description: '', objective: '', stage: 'idea' })
    setShowCreate(false)
    openProject(project.id)
  }

  function generateMutation() {
    if (!selected) return
    const variants = [
      {
        title: `${selected.name} → “问题雷达”`,
        body: '把项目从执行面扩展为持续发现：自动寻找当前项目的最大未知、证据缺口与反例。',
      },
      {
        title: `${selected.name} → “个人研究引擎”`,
        body: '将项目的 Hypothesis、Experiment 与知识库连接起来，让每次项目复盘都沉淀为下一轮研究问题。',
      },
      {
        title: `${selected.name} → “项目投资组合”`,
        body: '把多个项目当作注意力资产组合，用机会价值、确定性、成本与学习价值决定下一笔时间投入。',
      },
    ]
    const candidate = variants[selected.name.length % variants.length]
    setMutation(candidate)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PG</div>
          <div>
            <div className="brand-title">Project Genome</div>
            <div className="brand-subtitle">Personal R&D OS</div>
          </div>
        </div>

        <button className="new-project" onClick={() => setShowCreate(true)}>
          <span>＋</span>
          新建项目
        </button>

        <nav className="nav">
          <NavItem icon="⌂" label="总览" active={page === 'overview'} onClick={() => setPage('overview')} />
          <NavItem icon="◈" label="项目" active={page === 'projects'} onClick={() => setPage('projects')} />
          <NavItem icon="◉" label="组合" active={page === 'portfolio'} onClick={() => setPage('portfolio')} />
          <NavItem icon="✦" label="AI 复盘" active={page === 'review'} onClick={() => setPage('review')} />
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-label">项目</div>
          {state.projects.slice(0, 5).map((project) => (
            <button
              key={project.id}
              className={`project-nav ${selected?.id === project.id && page === 'projects' ? 'active' : ''}`}
              onClick={() => openProject(project.id)}
            >
              <span className="project-dot" />
              <span className="truncate">{project.name}</span>
              <span className="project-score">{opportunity(project)}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sync-pill"><span className="pulse-dot" /> Local First</div>
          <div className="version">MVP · v0.1</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Thursday · 08 Oct 2026</div>
            <h1>{page === 'overview' ? '你的项目应该把注意力放在哪里？' : page === 'portfolio' ? '项目组合' : page === 'review' ? 'AI 项目复盘' : selected?.name}</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <span>⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索项目…" />
              <kbd>⌘ K</kbd>
            </label>
          </div>
        </header>

        {page === 'overview' && (
          <Dashboard
            projects={filteredProjects}
            topProject={topProject}
            avgHealth={avgHealth}
            totalOpenTasks={totalOpenTasks}
            onOpenProject={openProject}
            onCreate={() => setShowCreate(true)}
            onQuickAdd={() => {
              setQuickAddType('task')
              setShowQuickAdd(true)
            }}
          />
        )}

        {page === 'projects' && selected && (
          <ProjectWorkspace
            project={selected}
            tab={projectTab}
            onTab={setProjectTab}
            onUpdateStage={(stage) => updateProject(selected.id, (project) => ({ ...project, stage, updatedAt: new Date().toISOString().slice(0, 10) }))}
            onQuickAdd={(type) => {
              setQuickAddType(type)
              setShowQuickAdd(true)
            }}
            onMoveTask={moveTask}
            draggedTask={draggedTask}
            setDraggedTask={setDraggedTask}
            onGenerateMutation={generateMutation}
            mutation={mutation}
          />
        )}

        {page === 'portfolio' && (
          <Portfolio projects={state.projects} onOpenProject={(id) => openProject(id)} />
        )}

        {page === 'review' && (
          <GlobalReview projects={state.projects} onOpenProject={(id) => openProject(id)} />
        )}
      </main>

      {showCreate && (
        <Modal title="新建项目" onClose={() => setShowCreate(false)}>
          <div className="form-stack">
            <Field label="项目名称">
              <input autoFocus value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="例如：个人研究助手" />
            </Field>
            <Field label="一句话描述">
              <input value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} placeholder="它解决什么问题？" />
            </Field>
            <Field label="项目目标">
              <textarea value={newProject.objective} onChange={(e) => setNewProject({ ...newProject, objective: e.target.value })} placeholder="成功后会发生什么变化？" rows={4} />
            </Field>
            <Field label="当前阶段">
              <select value={newProject.stage} onChange={(e) => setNewProject({ ...newProject, stage: e.target.value as ProjectStage })}>
                {Object.entries(stageMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
              </select>
            </Field>
            <div className="modal-actions">
              <button className="button ghost" onClick={() => setShowCreate(false)}>取消</button>
              <button className="button primary" onClick={createProject}>创建项目</button>
            </div>
          </div>
        </Modal>
      )}

      {showQuickAdd && selected && (
        <QuickAddModal
          type={quickAddType}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={(value) => {
            if (quickAddType === 'task') addTask(value)
            if (quickAddType === 'hypothesis') addHypothesis(value)
            if (quickAddType === 'experiment') addExperiment(value)
            if (quickAddType === 'decision') addDecision(value)
            setShowQuickAdd(false)
          }}
        />
      )}
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon">{icon}</span>{label}</button>
}

function Dashboard({
  projects,
  topProject,
  avgHealth,
  totalOpenTasks,
  onOpenProject,
  onCreate,
  onQuickAdd,
}: {
  projects: Project[]
  topProject: Project
  avgHealth: number
  totalOpenTasks: number
  onOpenProject: (id: string, tab?: ProjectTab) => void
  onCreate: () => void
  onQuickAdd: () => void
}) {
  const action = bestNextAction(topProject)
  return (
    <div className="page">
      <section className="hero-grid">
        <div className="hero-card dark">
          <div className="card-kicker">TODAY'S MOVE</div>
          <div className="hero-title">{action.title}</div>
          <p className="hero-detail">{action.detail}</p>
          <div className="hero-why">{action.why}</div>
          <button className="button light" onClick={() => onOpenProject(topProject.id, 'overview')}>{action.action} <span>→</span></button>
        </div>

        <div className="hero-card">
          <div className="card-kicker">TOP OPPORTUNITY</div>
          <div className="metric-big">{opportunity(topProject)}</div>
          <div className="metric-label">{topProject.name}</div>
          <ScoreBar value={topProject.confidence * 10} label="Confidence" />
          <ScoreBar value={projectHealth(topProject)} label="Health" />
        </div>

        <div className="hero-card">
          <div className="card-kicker">SYSTEM HEALTH</div>
          <div className="metric-big">{avgHealth}<span className="metric-unit">/100</span></div>
          <div className="mini-stat-row"><span>待完成任务</span><strong>{totalOpenTasks}</strong></div>
          <div className="mini-stat-row"><span>活跃项目</span><strong>{projects.filter((p) => !['completed', 'abandoned'].includes(p.stage)).length}</strong></div>
          <button className="text-link" onClick={() => document.getElementById('project-list')?.scrollIntoView({ behavior: 'smooth' })}>查看所有项目 →</button>
        </div>
      </section>

      <section className="section-head">
        <div>
          <div className="eyebrow">PROJECT RADAR</div>
          <h2>项目雷达</h2>
        </div>
        <div className="section-actions">
          <button className="button ghost" onClick={onQuickAdd}>＋ 快速记录</button>
          <button className="button primary" onClick={onCreate}>创建项目</button>
        </div>
      </section>

      <section id="project-list" className="project-grid">
        {projects.map((project) => <ProjectCard key={project.id} project={project} onClick={() => onOpenProject(project.id)} />)}
      </section>

      <section className="split-grid">
        <div className="panel">
          <PanelHeader eyebrow="UNCERTAINTY" title="当前最大的未知" action="查看全部" />
          <div className="uncertainty-list">
            {[...projects.flatMap((project) => project.hypotheses.map((hypothesis) => ({ project, hypothesis })))]
              .filter(({ hypothesis }) => ['untested', 'testing'].includes(hypothesis.status))
              .sort((a, b) => b.hypothesis.importance * (10 - b.hypothesis.confidence) - a.hypothesis.importance * (10 - a.hypothesis.confidence))
              .slice(0, 4)
              .map(({ project, hypothesis }) => (
                <button className="uncertainty-item" key={hypothesis.id} onClick={() => onOpenProject(project.id, 'hypotheses')}>
                  <div className="uncertainty-score">{hypothesis.importance * (10 - hypothesis.confidence)}</div>
                  <div className="uncertainty-copy">
                    <strong>{hypothesis.statement}</strong>
                    <span>{project.name}</span>
                  </div>
                  <span className="chevron">→</span>
                </button>
              ))}
          </div>
        </div>

        <div className="panel">
          <PanelHeader eyebrow="RECENT LEARNINGS" title="最近的决策" action="打开复盘" />
          <div className="decision-feed">
            {projects.flatMap((project) => project.decisions.map((decision) => ({ project, decision }))).slice(0, 4).map(({ project, decision }) => (
              <button className="decision-row" key={decision.id} onClick={() => onOpenProject(project.id, 'decisions')}>
                <div className="decision-date">{decision.date.slice(5)}</div>
                <div>
                  <strong>{decision.decision}</strong>
                  <span>{project.name} · {decision.nextStep}</span>
                </div>
              </button>
            ))}
            {!projects.some((project) => project.decisions.length) && <EmptyState text="还没有决策记录。" />}
          </div>
        </div>
      </section>
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const health = projectHealth(project)
  return (
    <button className="project-card" onClick={onClick}>
      <div className="project-card-top">
        <span className={`stage-chip ${stageMeta[project.stage].tone}`}>{stageMeta[project.stage].label}</span>
        <span className="score-badge">{opportunity(project)}</span>
      </div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="card-progress"><div style={{ width: `${health}%` }} /></div>
      <div className="project-card-bottom">
        <span>健康度 {health}</span>
        <span>{project.tasks.filter((t) => t.status === 'done').length}/{project.tasks.length} tasks</span>
      </div>
    </button>
  )
}

function ProjectWorkspace({
  project,
  tab,
  onTab,
  onUpdateStage,
  onQuickAdd,
  onMoveTask,
  draggedTask,
  setDraggedTask,
  onGenerateMutation,
  mutation,
}: {
  project: Project
  tab: ProjectTab
  onTab: (tab: ProjectTab) => void
  onUpdateStage: (stage: ProjectStage) => void
  onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void
  onMoveTask: (taskId: string, status: TaskStatus) => void
  draggedTask: string | null
  setDraggedTask: (id: string | null) => void
  onGenerateMutation: () => void
  mutation: { title: string; body: string } | null
}) {
  const action = bestNextAction(project)
  return (
    <div className="page">
      <section className="project-heading">
        <div>
          <div className="heading-meta">
            <span className={`stage-chip ${stageMeta[project.stage].tone}`}>{stageMeta[project.stage].label}</span>
            <span>更新于 {project.updatedAt}</span>
          </div>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
        <div className="project-heading-actions">
          <select className="stage-select" value={project.stage} onChange={(e) => onUpdateStage(e.target.value as ProjectStage)}>
            {Object.entries(stageMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
          <button className="button primary" onClick={() => onQuickAdd('task')}>＋ 添加任务</button>
        </div>
      </section>

      <div className="project-summary-grid">
        <div className="summary-card">
          <div className="summary-title">PROJECT HEALTH</div>
          <div className="summary-value">{projectHealth(project)}<span>/100</span></div>
          <div className="summary-note">基于执行、风险与不确定性估算</div>
        </div>
        <div className="summary-card">
          <div className="summary-title">OPPORTUNITY</div>
          <div className="summary-value">{opportunity(project)}<span>/100</span></div>
          <div className="summary-note">Impact × Confidence × Strategic ÷ Effort</div>
        </div>
        <div className="summary-card wide">
          <div className="summary-title">当前最大动作</div>
          <div className="summary-action">
            <div>
              <strong>{action.title}</strong>
              <span>{action.detail}</span>
            </div>
            <button className="text-link" onClick={() => onQuickAdd(project.hypotheses.some((h) => h.status === 'untested') ? 'experiment' : 'task')}>去执行 →</button>
          </div>
        </div>
      </div>

      <div className="workspace-tabs">
        {([
          ['overview', '概览'],
          ['tasks', '任务'],
          ['hypotheses', '假设'],
          ['experiments', '实验'],
          ['decisions', '决策'],
        ] as [ProjectTab, string][]).map(([value, label]) => (
          <button key={value} className={tab === value ? 'active' : ''} onClick={() => onTab(value)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && <ProjectOverview project={project} onQuickAdd={onQuickAdd} onGenerateMutation={onGenerateMutation} mutation={mutation} />}
      {tab === 'tasks' && <TaskBoard project={project} onQuickAdd={onQuickAdd} onMoveTask={onMoveTask} draggedTask={draggedTask} setDraggedTask={setDraggedTask} />}
      {tab === 'hypotheses' && <HypothesisView project={project} onQuickAdd={onQuickAdd} />}
      {tab === 'experiments' && <ExperimentView project={project} onQuickAdd={onQuickAdd} />}
      {tab === 'decisions' && <DecisionView project={project} onQuickAdd={onQuickAdd} />}
    </div>
  )
}

function ProjectOverview({
  project,
  onQuickAdd,
  onGenerateMutation,
  mutation,
}: {
  project: Project
  onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void
  onGenerateMutation: () => void
  mutation: { title: string; body: string } | null
}) {
  const review = bestNextAction(project)
  const highImpactUnknowns = project.hypotheses.filter((h) => h.importance >= 8 && h.confidence <= 5)
  return (
    <section className="overview-grid">
      <div className="main-column">
        <div className="panel">
          <PanelHeader eyebrow="WHY THIS PROJECT?" title="项目决策" />
          <div className="decision-block">
            <div className="decision-field"><span>目标</span><strong>{project.objective}</strong></div>
            <div className="decision-field"><span>成功标准</span><strong>用可观察结果证明项目值得继续投入。</strong></div>
            <div className="decision-field"><span>停止条件</span><strong>核心假设连续被反证，或边际收益长期低于机会成本。</strong></div>
          </div>
        </div>

        <div className="panel">
          <PanelHeader eyebrow="AI CRITIC" title="AI 项目审稿人" action="重新分析" />
          <div className="critic-card">
            <div className="critic-icon">✦</div>
            <div>
              <strong>{review.title}</strong>
              <p>{review.why}</p>
            </div>
          </div>
          <div className="critic-list">
            <CriticRow tone="amber" label="主要风险" value={highImpactUnknowns[0]?.statement ?? '暂无高价值未验证假设。'} />
            <CriticRow tone="blue" label="当前机会" value={project.tasks.length === 0 ? '先建立最小执行循环。' : `已完成 ${project.tasks.filter((t) => t.status === 'done').length}/${project.tasks.length} 个任务。`} />
            <CriticRow tone="green" label="下一步" value={review.detail} />
          </div>
        </div>
      </div>

      <aside className="side-column">
        <div className="panel">
          <PanelHeader eyebrow="MUTATION ENGINE" title="项目变异" />
          <p className="panel-copy">从已有项目出发，探索一个更有杠杆的新方向，而不是无目的地产生 Idea。</p>
          <button className="mutation-button" onClick={onGenerateMutation}>🧬 生成项目变异</button>
          {mutation && (
            <div className="mutation-result">
              <div className="mut-label">NEW VARIANT</div>
              <strong>{mutation.title}</strong>
              <p>{mutation.body}</p>
              <button className="text-link">转为新项目 →</button>
            </div>
          )}
        </div>

        <div className="panel">
          <PanelHeader eyebrow="SIGNALS" title="实时信号" />
          <div className="signal-list">
            <Signal icon="◒" label="未验证假设" value={String(project.hypotheses.filter((h) => h.status === 'untested').length)} />
            <Signal icon="◌" label="进行中实验" value={String(project.experiments.filter((e) => e.status === 'running').length)} />
            <Signal icon="✓" label="已完成任务" value={String(project.tasks.filter((t) => t.status === 'done').length)} />
            <Signal icon="↗" label="最近决策" value={project.decisions[0]?.date?.slice(5) ?? '—'} />
          </div>
        </div>
      </aside>

      <div className="quick-actions panel">
        <PanelHeader eyebrow="QUICK CAPTURE" title="把想法立刻落地" />
        <div className="quick-action-grid">
          <QuickAction icon="□" title="任务" desc="记录下一步执行动作" onClick={() => onQuickAdd('task')} />
          <QuickAction icon="?" title="假设" desc="记录一个尚未证明的判断" onClick={() => onQuickAdd('hypothesis')} />
          <QuickAction icon="⚗" title="实验" desc="设计最低成本的验证" onClick={() => onQuickAdd('experiment')} />
          <QuickAction icon="↯" title="决策" desc="记录为什么选择这条路" onClick={() => onQuickAdd('decision')} />
        </div>
      </div>
    </section>
  )
}

function TaskBoard({
  project,
  onQuickAdd,
  onMoveTask,
  draggedTask,
  setDraggedTask,
}: {
  project: Project
  onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void
  onMoveTask: (taskId: string, status: TaskStatus) => void
  draggedTask: string | null
  setDraggedTask: (id: string | null) => void
}) {
  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'backlog', label: '待开始' },
    { status: 'in-progress', label: '进行中' },
    { status: 'done', label: '完成' },
  ]
  return (
    <div>
      <div className="board-toolbar">
        <span>{project.tasks.length} 个任务 · 支持拖拽移动</span>
        <button className="button ghost small" onClick={() => onQuickAdd('task')}>＋ 添加任务</button>
      </div>
      <div className="kanban">
        {columns.map((column) => (
          <div
            className="kanban-column"
            key={column.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => draggedTask && onMoveTask(draggedTask, column.status)}
          >
            <div className="column-head">
              <span>{column.label}</span>
              <span className="column-count">{project.tasks.filter((task) => task.status === column.status).length}</span>
            </div>
            <div className="task-list">
              {project.tasks.filter((task) => task.status === column.status).map((task) => (
                <article
                  key={task.id}
                  className={`task-card ${draggedTask === task.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDraggedTask(task.id)}
                  onDragEnd={() => setDraggedTask(null)}
                >
                  <div className="task-card-top">
                    <span className={`priority-dot ${task.priority}`} />
                    <span>{task.estimate}h</span>
                  </div>
                  <strong>{task.title}</strong>
                  <div className="task-card-footer">
                    <span className={`priority-label ${task.priority}`}>{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</span>
                    <button className="mini-move" onClick={() => onMoveTask(task.id, task.status === 'done' ? 'backlog' : task.status === 'backlog' ? 'in-progress' : 'done')}>↻</button>
                  </div>
                </article>
              ))}
              {!project.tasks.some((task) => task.status === column.status) && <EmptyState text="拖拽任务到这里" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HypothesisView({ project, onQuickAdd }: { project: Project; onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void }) {
  return (
    <div className="panel">
      <div className="section-head compact">
        <div><div className="eyebrow">HYPOTHESES</div><h2>核心假设</h2></div>
        <button className="button primary small" onClick={() => onQuickAdd('hypothesis')}>＋ 新假设</button>
      </div>
      <div className="hypothesis-grid">
        {project.hypotheses.map((hypothesis) => {
          const leverage = hypothesis.importance * (10 - hypothesis.confidence)
          return (
            <article className="hypothesis-card" key={hypothesis.id}>
              <div className="hypothesis-top"><span className={`status-pill ${hypothesis.status}`}>{hypothesis.status === 'untested' ? '未验证' : hypothesis.status === 'testing' ? '验证中' : hypothesis.status === 'validated' ? '已验证' : '已推翻'}</span><strong>{leverage}</strong></div>
              <h3>{hypothesis.statement}</h3>
              <div className="two-metrics">
                <Metric label="重要性" value={hypothesis.importance} />
                <Metric label="可信度" value={hypothesis.confidence} />
              </div>
              <button className="text-link">设计实验 →</button>
            </article>
          )
        })}
        {!project.hypotheses.length && <EmptyState text="还没有假设。先写下一个你认为可能为真的判断。" />}
      </div>
    </div>
  )
}

function ExperimentView({ project, onQuickAdd }: { project: Project; onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void }) {
  return (
    <div className="panel">
      <div className="section-head compact">
        <div><div className="eyebrow">EXPERIMENTS</div><h2>验证实验</h2></div>
        <button className="button primary small" onClick={() => onQuickAdd('experiment')}>＋ 新实验</button>
      </div>
      <div className="experiment-list">
        {project.experiments.map((experiment) => (
          <article className="experiment-card" key={experiment.id}>
            <div className={`experiment-status ${experiment.status}`} />
            <div className="experiment-body">
              <div className="experiment-title-row"><h3>{experiment.title}</h3><span>{experiment.cost}</span></div>
              <p>{experiment.objective}</p>
              {experiment.result && <div className="result-note"><span>结果</span>{experiment.result}</div>}
            </div>
            <span className="status-pill neutral">{experiment.status === 'planned' ? '计划中' : experiment.status === 'running' ? '进行中' : '已完成'}</span>
          </article>
        ))}
        {!project.experiments.length && <EmptyState text="还没有实验。把最大的未知转化成一个低成本验证。" />}
      </div>
    </div>
  )
}

function DecisionView({ project, onQuickAdd }: { project: Project; onQuickAdd: (type: 'task' | 'hypothesis' | 'experiment' | 'decision') => void }) {
  return (
    <div className="panel">
      <div className="section-head compact">
        <div><div className="eyebrow">DECISIONS</div><h2>决策日志</h2></div>
        <button className="button primary small" onClick={() => onQuickAdd('decision')}>＋ 记录决策</button>
      </div>
      <div className="timeline">
        {project.decisions.map((item) => (
          <article className="timeline-item" key={item.id}>
            <div className="timeline-dot" />
            <div className="timeline-date">{item.date}</div>
            <div className="timeline-content">
              <h3>{item.decision}</h3>
              <p>{item.reason}</p>
              <div className="next-step"><span>下一步</span>{item.nextStep}</div>
            </div>
          </article>
        ))}
        {!project.decisions.length && <EmptyState text="记录决定，而不是只记录结果。" />}
      </div>
    </div>
  )
}

function Portfolio({ projects, onOpenProject }: { projects: Project[]; onOpenProject: (id: string) => void }) {
  const sorted = [...projects].sort((a, b) => opportunity(b) - opportunity(a))
  return (
    <div className="page">
      <div className="portfolio-banner">
        <div><div className="eyebrow">ATTENTION ALLOCATION</div><h2>你的时间是一种投资组合</h2><p>把项目当作有限注意力的资产，而不是互相独立的 Todo 列表。</p></div>
        <div className="portfolio-score"><strong>{Math.round(sorted.reduce((s, p) => s + opportunity(p), 0) / sorted.length)}</strong><span>平均机会分</span></div>
      </div>
      <section className="portfolio-table panel">
        <div className="table-head"><span>项目</span><span>机会</span><span>确定性</span><span>健康</span><span>建议</span></div>
        {sorted.map((project) => {
          const opp = opportunity(project)
          const health = projectHealth(project)
          const suggestion = opp >= 75 && health >= 65 ? '加速' : opp >= 65 ? '先验证' : health < 50 ? '调整' : '稳定推进'
          return (
            <button className="table-row" key={project.id} onClick={() => onOpenProject(project.id)}>
              <div className="table-project"><span className="project-dot" /><strong>{project.name}</strong><small>{stageMeta[project.stage].label}</small></div>
              <strong className="number">{opp}</strong>
              <span className="number">{project.confidence * 10}</span>
              <span className="number">{health}</span>
              <span className={`recommend ${suggestion === '加速' ? 'good' : suggestion === '调整' ? 'bad' : 'warn'}`}>{suggestion}</span>
            </button>
          )
        })}
      </section>
    </div>
  )
}

function GlobalReview({ projects, onOpenProject }: { projects: Project[]; onOpenProject: (id: string) => void }) {
  const risks = projects
    .flatMap((project) => project.hypotheses.filter((h) => h.status === 'untested' || h.status === 'testing').map((hypothesis) => ({ project, hypothesis, score: hypothesis.importance * (10 - hypothesis.confidence) })))
    .sort((a, b) => b.score - a.score)

  const antiPattern = projects
    .map((project) => ({ project, ratio: project.tasks.length ? project.tasks.filter((task) => task.status === 'done').length / project.tasks.length : 0 }))
    .sort((a, b) => a.ratio - b.ratio)[0]

  return (
    <div className="page">
      <section className="review-intro">
        <div className="eyebrow">AI REVIEW</div>
        <h2>不替你做决定，只帮你看见决定背后的证据。</h2>
        <p>这份 MVP Review 基于项目当前状态、任务、假设、实验与决策生成。生产版本可以接入真实模型与外部数据源。</p>
      </section>

      <div className="review-grid">
        <div className="panel">
          <PanelHeader eyebrow="TOP UNCERTAINTIES" title="本周最应该验证的事" />
          <div className="review-list">
            {risks.slice(0, 5).map(({ project, hypothesis, score }) => (
              <button className="review-item" key={hypothesis.id} onClick={() => onOpenProject(project.id)}>
                <span className="review-number">{score}</span>
                <div><strong>{hypothesis.statement}</strong><span>{project.name} · 重要性 {hypothesis.importance} · 可信度 {hypothesis.confidence}</span></div>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelHeader eyebrow="ANTI-PATTERN" title="最值得警惕的项目" />
          {antiPattern && (
            <div className="anti-pattern">
              <div className="anti-icon">!</div>
              <strong>{antiPattern.project.name}</strong>
              <p>当前任务完成比例只有 {Math.round(antiPattern.ratio * 100)}%。在继续扩展范围之前，先确认是不是项目优先级或目标发生了变化。</p>
              <button className="button ghost small" onClick={() => onOpenProject(antiPattern.project.id)}>打开项目</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAddModal({ type, onClose, onSubmit }: { type: 'task' | 'hypothesis' | 'experiment' | 'decision'; onClose: () => void; onSubmit: (value: string) => void }) {
  const labels = { task: '快速添加任务', hypothesis: '记录一个假设', experiment: '设计一个实验', decision: '记录一个决策' }
  const placeholders = {
    task: '例如：采访 3 个目标用户',
    hypothesis: '例如：用户更需要问题雷达，而不是更多标签',
    experiment: '例如：5 人用户路径实验',
    decision: '例如：先验证需求，再扩展技术实现',
  }
  const [value, setValue] = useState('')
  return (
    <Modal title={labels[type]} onClose={onClose}>
      <div className="form-stack">
        <Field label={type === 'task' ? '下一步行动' : type === 'hypothesis' ? '你认为可能为真的判断' : type === 'experiment' ? '实验名称' : '决定了什么'}>
          <textarea autoFocus value={value} onChange={(e) => setValue(e.target.value)} rows={4} placeholder={placeholders[type]} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onSubmit(value) }} />
        </Field>
        <div className="modal-actions">
          <button className="button ghost" onClick={onClose}>取消</button>
          <button className="button primary" onClick={() => onSubmit(value)}>保存</button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="close" onClick={onClose}>×</button></div>{children}</div></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return <div className="panel-header"><div><div className="eyebrow">{eyebrow}</div><h3>{title}</h3></div>{action && <button className="text-link">{action} →</button>}</div>
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return <div className="score-bar-row"><span>{label}</span><div className="score-bar"><div style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>
}

function CriticRow({ tone, label, value }: { tone: string; label: string; value: string }) {
  return <div className="critic-row"><span className={`critic-tag ${tone}`}>{label}</span><span>{value}</span></div>
}

function Signal({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="signal"><span className="signal-icon">{icon}</span><span>{label}</span><strong>{value}</strong></div>
}

function QuickAction({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return <button className="quick-action" onClick={onClick}><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{desc}</small></span><span className="chevron">→</span></button>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric-cell"><span>{label}</span><strong>{value}/10</strong></div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><span>◌</span>{text}</div>
}
