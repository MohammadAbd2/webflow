import { Activity, ArrowRight, BarChart3, Bell, Check, CheckCheck, ChevronRight, CircleCheck, ClipboardCheck, FileText, FolderKanban, LayoutDashboard, MessageSquareText, Moon, ShieldCheck, Sparkles, Sun, Users, UserRoundCheck, Zap } from 'lucide-react';

function Brand({ href = '#home' }) {
  return <a className="landing-brand" href={href} aria-label="Webflow Project Hub home">
    <span className="brand-symbol"><i/><i/><i/></span>Webflow<span className="landing-brand-suffix">Project Hub</span>
  </a>;
}

function DeliveryPreview() {
  return <div className="landing-preview" aria-label="Illustration of the project delivery workspace">
    <div className="landing-preview-glow"/>
    <span className="landing-orbit landing-orbit-one"/>
    <span className="landing-orbit landing-orbit-two"/>
    <span className="landing-orbit-dot landing-orbit-dot-one"/>
    <span className="landing-orbit-dot landing-orbit-dot-two"/>
    <div className="landing-preview-window">
      <div className="landing-window-top">
        <div className="landing-window-brand"><span className="landing-window-mark"><FolderKanban size={14}/></span><b>Project workspace</b></div>
        <span className="landing-window-live"><i/> LIVE DELIVERY</span>
      </div>
      <div className="landing-project-heading">
        <div><small>CLIENT PROJECT</small><h3>Website redesign</h3></div>
        <span className="landing-project-status"><i/> On track</span>
      </div>
      <div className="landing-progress-meta"><span>Delivery progress</span><b>68%</b></div>
      <div className="landing-progress"><i/></div>
      <div className="landing-milestones" aria-hidden="true">
        <div className="complete"><span><Check size={12}/></span><small>Plan</small></div>
        <i/><div className="current"><span>2</span><small>Build</small></div>
        <i/><div><span>3</span><small>Launch</small></div>
      </div>
      <div className="landing-preview-divider"/>
      <div className="landing-work-row">
        <span className="landing-work-icon"><Zap size={15}/></span>
        <span><b>Build responsive home page</b><small>Development · Sprint 02</small></span>
        <span className="landing-work-state"><i/> In progress</span>
      </div>
      <div className="landing-team-row">
        <span className="landing-team-avatars"><i>JD</i><i>MK</i><i>AL</i></span>
        <span><b>Project team</b><small>Owner, scrum master & teammates</small></span>
        <Users size={16}/>
      </div>
    </div>
    <div className="landing-float-card landing-float-update"><span><CircleCheck size={17}/></span><div><b>Milestone completed</b><small>Design approved by the client</small></div></div>
    <div className="landing-float-card landing-float-notification"><span><Bell size={16}/></span><div><b>Everyone stays in sync</b><small>Project updates, in one place</small></div></div>
  </div>;
}

const features = [
  { icon: LayoutDashboard, title: 'Project overview', text: 'See active work, ownership, delivery stage, progress, and items that need attention without chasing status updates.' },
  { icon: ClipboardCheck, title: 'Backlog and sprint planning', text: 'Organize tasks by stage, estimate effort, assign teammates, and plan dated sprints with review notes.' },
  { icon: BarChart3, title: 'Delivery charts and reports', text: 'Understand task completion over time, sprint progress, team contributions, project intake, and delivery status.' },
  { icon: FileText, title: 'Approvals and contracts', text: 'Keep project team proposals, contract review, signatures, and key project decisions visible to the right people.' },
  { icon: Bell, title: 'Messages and notifications', text: 'Bring invitations, project decisions, team responses, and direct conversations into the same workspace.' },
  { icon: Users, title: 'People, teams, and growth', text: 'Find teammates, manage project teams, review profiles, and recognize completed work and contribution.' },
];

const problems = [
  { problem: '“I have to ask everyone for the latest status.”', solution: 'Shared project overviews show stage, progress, owners, target dates, and next actions together.' },
  { problem: '“Requests and approvals disappear in messages.”', solution: 'Requests, team proposals, contracts, and decisions each have a visible place and a clear status.' },
  { problem: '“The team is unsure what to work on next.”', solution: 'Backlogs, stage-based task lists, assignees, and sprints help make upcoming work concrete.' },
];

const roleDetails = [
  {
    icon: FolderKanban,
    tag: 'PRODUCT OWNER',
    title: 'Shape the work before it starts.',
    text: 'Product owners turn client requests into an agreed delivery plan, choose the right project teams, and keep scope and milestones clear.',
    items: ['Review incoming client requests', 'Propose teams and delivery steps', 'Plan the backlog and schedule sprints'],
    tone: 'violet',
  },
  {
    icon: UserRoundCheck,
    tag: 'SCRUM MASTER',
    title: 'Help the team do its best work.',
    text: 'Scrum masters build and manage teams, coordinate invitations, support task flow, and keep roadmap stages up to date.',
    items: ['Create named teams and invite colleagues', 'Review team requests and participation', 'Track delivery stages and unblock work'],
    tone: 'mint',
  },
  {
    icon: ClipboardCheck,
    tag: 'TEAM MEMBER',
    title: 'Know what to work on next.',
    text: 'Teammates see their assigned work, move eligible tasks through the board, and stay informed about project and team updates.',
    items: ['See tasks by backlog, sprint, and stage', 'Update task status and collaborate with the team', 'Follow notifications, progress, and completed work'],
    tone: 'blue',
  },
  {
    icon: MessageSquareText,
    tag: 'CLIENT',
    title: 'Stay close to your project.',
    text: 'Clients submit a request, follow delivery progress, communicate with the team, and review the completed project.',
    items: ['Submit a project brief and target date', 'Follow milestones, tasks, and project updates', 'Confirm completion and rate the product owner'],
    tone: 'amber',
  },
];

function TaskBoardPreview() {
  const columns = [
    { title: 'To do', color: 'todo', tasks: [['Confirm page structure', 'Planning · 3 pts'], ['Prepare content outline', 'Content · 2 pts']] },
    { title: 'In progress', color: 'progress', tasks: [['Build responsive layout', 'Development · 5 pts']] },
    { title: 'Done', color: 'done', tasks: [['Approve visual direction', 'Design · 3 pts']] },
  ];
  return <div className="landing-board" aria-label="Illustrative task board with To do, In progress, and Done columns">
    <div className="landing-board-header"><div><small>SPRINT 02 · WEBSITE REDESIGN</small><b>Team task board</b></div><span><Activity size={14}/> Delivery view</span></div>
    <div className="landing-board-columns">{columns.map(column => <div className="landing-board-column" key={column.title}>
      <div className="landing-board-column-heading"><span className={`landing-board-dot ${column.color}`}/><b>{column.title}</b><small>{column.tasks.length}</small></div>
      {column.tasks.map(([title,meta], index) => <article className={`landing-task-card ${column.color}`} key={title}>
        <span className="landing-task-tag">{meta.split(' · ')[0]}</span><b>{title}</b><div><span>{meta.split(' · ')[1]}</span><i>{index===0?'JD':'MK'}</i></div>
      </article>)}
    </div>)}</div>
    <div className="landing-board-foot"><span><CheckCheck size={14}/> Board progress updates project reporting</span><span>Tasks stay linked to delivery stages</span></div>
  </div>;
}

export default function LandingPage({ onSignIn, onCreateAccount, theme, toggleTheme }) {
  return <div className="landing-page" id="home">
    <header className="landing-header">
      <Brand/>
      <nav className="landing-nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a>
        <a href="#workspace-features">Workspace</a>
        <a href="/documentation">Documentation</a>
      </nav>
      <div className="landing-header-actions">
        <button className="landing-theme-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}
        </button>
        <button className="landing-signin" onClick={onSignIn}>Sign in</button>
        <button className="landing-header-cta" onClick={onCreateAccount}>Get started <ArrowRight size={15}/></button>
      </div>
    </header>

    <main>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow"><span><Sparkles size={13}/></span> ONE SHARED SPACE. BETTER PROJECT DELIVERY.</div>
          <h1>From first request<br/>to <em>work well done.</em></h1>
          <p className="landing-hero-description">Webflow Project Hub brings clients and delivery teams together to plan work, track progress, and make every project feel clear.</p>
          <div className="landing-hero-actions">
            <button className="landing-primary-cta" onClick={onCreateAccount}>Create your account <ArrowRight size={16}/></button>
            <button className="landing-secondary-cta" onClick={onSignIn}>Sign in to your workspace</button>
          </div>
          <div className="landing-trust-line"><span><CheckCheck size={15}/></span> Clients, project owners, scrum masters, and teams — all aligned.</div>
        </div>
        <DeliveryPreview/>
      </section>

      <section className="landing-roles" id="roles">
        <div className="landing-roles-intro">
          <div className="landing-section-kicker">ONE PROJECT, CLEAR VIEWS FOR EVERY ROLE</div>
          <h2>Everyone knows<br/><em>their part in delivery.</em></h2>
          <p>Each workspace role has focused tools, while project status and communication stay connected for the whole group.</p>
        </div>
        <div className="landing-role-grid">{roleDetails.map(({ icon: Icon, tag, title, text, items, tone }, index) =>
          <article className={`landing-role-card ${tone}`} key={tag} style={{ '--feature-index': index }}>
            <div className="landing-role-heading"><span><Icon size={18}/></span><small>{tag}</small></div>
            <h3>{title}</h3><p>{text}</p>
            <ul>{items.map(item => <li key={item}><Check size={13}/>{item}</li>)}</ul>
          </article>
        )}</div>
      </section>

      <section className="landing-taskflow" id="task-flow">
        <div className="landing-taskflow-copy">
          <div className="landing-section-kicker">BACKLOG TO DONE, WITH CONTEXT</div>
          <h2>A task board that<br/><em>moves work forward.</em></h2>
          <p>Teams organize tasks by delivery stage, backlog, and sprint. As work progresses, task status feeds the project roadmap and progress views—so updates made by the team are visible across the project.</p>
          <div className="landing-taskflow-points">
            <span><CheckCheck size={16}/> Plan backlog work and assign teammates</span>
            <span><CheckCheck size={16}/> Work in dated sprints when the project is ready</span>
            <span><CheckCheck size={16}/> See completed work reflected in project progress</span>
          </div>
        </div>
        <TaskBoardPreview/>
      </section>

      <section className="landing-flow" id="how-it-works" aria-label="How the project workspace works">
        <div className="landing-section-kicker">A BETTER WAY TO WORK TOGETHER</div>
        <div className="landing-flow-steps">
          <div><span>01</span><b>Share a request</b><small>Capture the goal and scope</small></div>
          <i><ChevronRight size={17}/></i>
          <div><span>02</span><b>Shape the team</b><small>Agree on people and milestones</small></div>
          <i><ChevronRight size={17}/></i>
          <div><span>03</span><b>Deliver with clarity</b><small>Track tasks and progress together</small></div>
          <i><ChevronRight size={17}/></i>
          <div><span>04</span><b>Celebrate the finish</b><small>Review outcomes and grow</small></div>
        </div>
      </section>

      <section className="landing-features" id="workspace-features">
        <div className="landing-features-intro">
          <div className="landing-section-kicker">A CONNECTED SET OF PROJECT DASHBOARDS</div>
          <h2>Everything needed to move<br/><em>a project forward.</em></h2>
          <p>Focused screens for planning, delivery, collaboration, and oversight—connected to the same project.</p>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => <article className="landing-feature" key={title} style={{ '--feature-index': index }}>
            <span><Icon size={19}/></span><h3>{title}</h3><p>{text}</p>
          </article>)}
        </div>
      </section>

      <section className="landing-problems">
        <div className="landing-section-kicker">BUILT AROUND REAL DELIVERY FRICTION</div>
        <h2>Replace “where are we?”<br/><em>with a shared next step.</em></h2>
        <div className="landing-problem-grid">{problems.map(({ problem, solution }, index) =>
          <article className="landing-problem-card" key={problem} style={{ '--feature-index': index }}>
            <span className="landing-problem-number">0{index + 1}</span>
            <p className="landing-problem-quote">{problem}</p>
            <div><CheckCheck size={15}/><p>{solution}</p></div>
          </article>
        )}</div>
      </section>

      <section className="landing-bottom-cta">
        <div><span className="landing-cta-icon"><Sparkles size={18}/></span><div><h2>Bring your next project into focus.</h2><p>Give clients and delivery teams one shared place to plan, work, and follow progress.</p></div></div>
        <button onClick={onCreateAccount}>Get started <ArrowRight size={15}/></button>
      </section>
    </main>
    <footer className="landing-footer">
      <div className="landing-footer-identity"><Brand/><span>A shared workspace for thoughtful project delivery.</span></div>
      <div className="landing-footer-actions"><a href="/documentation">Full documentation</a><button onClick={onSignIn}>Workspace sign in <ArrowRight size={13}/></button></div>
    </footer>
  </div>;
}
