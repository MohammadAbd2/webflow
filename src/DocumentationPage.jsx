import { ArrowLeft, ArrowRight, BookOpen, CheckCheck, CircleHelp, ClipboardList, FolderKanban, Gauge, LockKeyhole, MessageSquareText, Moon, ShieldCheck, Sun, Users, Workflow, Zap } from 'lucide-react';

const chapters = [
  ['overview', 'How the workspace fits together'],
  ['roles', 'Roles and access'],
  ['requests', 'Client requests and project setup'],
  ['teams', 'Teams and invitations'],
  ['tasks', 'Tasks, stages, and sprints'],
  ['roadmap', 'Roadmap and project progress'],
  ['communication', 'Notifications and collaboration'],
  ['reviews', 'Completion and ratings'],
  ['administration', 'Administration and reporting'],
  ['account', 'Profiles and account settings'],
];

function DocSection({ id, icon: Icon, title, children }) {
  return <section className="documentation-section" id={id}>
    <div className="documentation-section-icon"><Icon size={18}/></div>
    <div><h2>{title}</h2>{children}</div>
  </section>;
}

export default function DocumentationPage({ theme, toggleTheme, onSignIn }) {
  return <div className="landing-page documentation-page">
    <header className="landing-header">
      <a className="landing-brand" href="/" aria-label="Webflow Project Hub home"><span className="brand-symbol"><i/><i/><i/></span>Webflow<span className="landing-brand-suffix">Documentation</span></a>
      <nav className="landing-nav"><a href="/#roles">Explore roles</a><a href="/#task-flow">Task board</a></nav>
      <div className="landing-header-actions">
        <button className="landing-theme-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className="landing-signin" onClick={onSignIn}>Sign in</button>
        <a className="landing-header-cta" href="/">Back to home <ArrowRight size={15}/></a>
      </div>
    </header>

    <main className="documentation-main">
      <a className="documentation-back" href="/"><ArrowLeft size={14}/> Back to the product overview</a>
      <div className="documentation-hero">
        <span className="documentation-book-icon"><BookOpen size={22}/></span>
        <div className="landing-section-kicker">WEBFLOW PROJECT HUB · GUIDE</div>
        <h1>How the workspace works.</h1>
        <p>A practical guide to the project lifecycle, role-specific tools, task planning, and workspace administration.</p>
        <div className="documentation-meta"><span><ClipboardList size={14}/> 10 chapters</span><span><Users size={14}/> Clients & delivery teams</span><span><Workflow size={14}/> Project lifecycle</span></div>
      </div>

      <div className="documentation-layout">
        <aside className="documentation-toc">
          <b>IN THIS GUIDE</b>
          {chapters.map(([id, title], index) => <a key={id} href={`#${id}`}><span>{String(index + 1).padStart(2, '0')}</span>{title}</a>)}
          <button onClick={onSignIn}>Open your workspace <ArrowRight size={14}/></button>
        </aside>

        <article className="documentation-content">
          <DocSection id="overview" icon={FolderKanban} title="How the workspace fits together">
            <p>Webflow Project Hub brings client requests, project setup, team coordination, and day-to-day delivery into one shared workspace. Each project has a delivery plan and team; its roadmap, task board, sprint plan, and progress views keep the work connected.</p>
            <p>The usual flow is: a client shares a project brief, a product owner shapes the delivery plan, teams are proposed and reviewed, work is organized into stages and sprints, and the participants follow progress through completion.</p>
          </DocSection>

          <DocSection id="roles" icon={ShieldCheck} title="Roles and access">
            <div className="documentation-role-grid">
              <div><b>Client</b><p>Creates project requests, follows projects they own, communicates with the delivery team, confirms completion, and rates the product owner.</p></div>
              <div><b>Product owner</b><p>Reviews requests, coordinates the project plan and proposed teams, manages project scope and planning, and rates scrum masters after completion.</p></div>
              <div><b>Scrum master</b><p>Builds and coordinates teams, responds to team invitations, supports task flow, and updates delivery roadmap stages for their project.</p></div>
              <div><b>Team member</b><p>Reviews team and project invitations, sees relevant tasks, updates assigned work, and receives project notifications.</p></div>
              <div><b>Administrator</b><p>Manages accounts and role tags, reviews project and contract setup, oversees project status, and views workspace reports.</p></div>
            </div>
            <p>Some employee capabilities depend on account tags such as <code>product_owner</code> or <code>scrum_master</code>. Administrators assign and maintain these tags in People &amp; teams.</p>
          </DocSection>

          <DocSection id="requests" icon={MessageSquareText} title="Client requests and project setup">
            <ol>
              <li><b>Submit a brief.</b> A client enters a project name, description, delivery target, and proposed delivery steps. They can post the request for product owners or choose a specific product owner.</li>
              <li><b>Review and respond.</b> Product owners can review requests, discuss details, and accept a request to begin preparing the project.</li>
              <li><b>Propose a team and plan.</b> The product owner selects teams, scrum masters, and members, and prepares the project delivery steps for review.</li>
              <li><b>Admin review.</b> Administrators review team proposals and project setup. The relevant participants receive updates as the proposal moves through review.</li>
              <li><b>Prepare delivery.</b> Contract review and required signatures happen before sprint work is started. Project setup, work planning, and contract status are visible in their respective sections.</li>
            </ol>
          </DocSection>

          <DocSection id="teams" icon={Users} title="Teams and invitations">
            <p>Scrum masters can create named teams from the Teams area, search for colleagues, and send join invitations. Invitees can accept or decline in their workspace; the scrum master receives a notification of the response.</p>
            <p>For a project, the product owner proposes teams and team members. The admin can accept, edit, or reject a team proposal before approving project setup. Project team membership and invitation decisions are kept separate from roster teams.</p>
            <ul><li>Every project team has one scrum master.</li><li>Team members need to accept an invitation before being treated as accepted project participants.</li><li>Project admins and scrum masters can remove members where their role allows it.</li></ul>
          </DocSection>

          <DocSection id="tasks" icon={ClipboardList} title="Tasks, stages, and sprints">
            <p>The task area combines an unassigned backlog with project tasks arranged by stage. Each task can carry a description, priority, complexity, story points, estimated hours, due date, team, assignee, and optional links to follow-up tasks.</p>
            <ul><li><b>To do:</b> planned work that is not currently underway.</li><li><b>In progress:</b> active work assigned to a teammate.</li><li><b>In review:</b> work ready for review.</li><li><b>Done:</b> completed work; task completion contributes to project progress and reporting.</li></ul>
            <p>Tasks can be created in the backlog and assigned to a delivery stage. Teams can drag tasks between board columns, reorder work, and edit task details. Moving work back to To do clears its assignee; moving work into an active column assigns it to the teammate who moves it, subject to project membership and permissions.</p>
            <p>Product owners plan dated sprints from backlog tasks. Only one sprint can be active at a time; subsequent sprints remain locked until the current sprint is closed. Sprint work cannot be started until the project contract is approved or signed. Sprint reviews capture outcomes and delivery dates; closing and reopening a sprint are available to authorized project managers when validation rules are met.</p>
          </DocSection>

          <DocSection id="roadmap" icon={Gauge} title="Roadmap and project progress">
            <p>Project delivery steps describe the milestones from planning to launch. Administrators and the project scrum master can update roadmap status. Stage indicators reflect the tasks linked to each stage: work that is still to do, in progress, or completed is shown with corresponding status colors and progress.</p>
            <p>Completing tasks updates the project’s overall task progress. A task may also trigger one or more follow-up tasks in another stage; the trigger indicates that prerequisite work is ready and does not silently change the follow-up task’s status.</p>
            <p>Project charts use recorded task and sprint dates to show delivery progress, remaining work, and team contribution. Target dates and sprint schedule changes are reflected in the project schedule.</p>
          </DocSection>

          <DocSection id="communication" icon={MessageSquareText} title="Notifications and collaboration">
            <p>Notifications keep participants informed about important events such as team invitations, role or tag changes, project-team reviews, request responses, and project updates. Open the notification center to review alerts and navigate to the related workspace area.</p>
            <p>Messages provide a place to contact workspace members. Project request comments can be used to clarify the brief with a product owner. Notifications complement the workspace state; the project, task, and invitation screens remain the source of truth for current status.</p>
          </DocSection>

          <DocSection id="reviews" icon={CheckCheck} title="Completion and ratings">
            <p>When project delivery is finished, completion is recorded on the project. Clients can confirm completion and rate the product owner; product owners can rate scrum masters; scrum masters can rate their team members. Ratings are shown on the relevant participant profiles and are tied to the project review flow.</p>
            <p>Project completion, cancellation, and contract decisions have role-specific controls. Some changes require administrator review, and the project participants are notified when a decision changes their workflow.</p>
          </DocSection>

          <DocSection id="administration" icon={LockKeyhole} title="Administration and reporting">
            <p>Administrators use the workspace to manage accounts, roles, tags, account access, and employee XP. People &amp; teams supports searching and paginated account lists.</p>
            <ul><li><b>Review &amp; approvals:</b> review project team setup, contract decisions, and cancellation requests.</li><li><b>Projects:</b> monitor project lifecycle and update eligible project statuses.</li><li><b>Client requests:</b> review requests and their statuses.</li><li><b>Reports:</b> inspect live client intake, new projects, delivery status, request counts, and recorded task completions over a selected time range.</li></ul>
            <p>Reports reflect stored workspace records. Counts can be empty when no matching activity exists; the dashboard does not invent activity to fill a chart.</p>
          </DocSection>

          <DocSection id="account" icon={Zap} title="Profiles and account settings">
            <p>Use the account menu or Settings to manage your account details and profile image. Employee profiles can include role-related profile information, services, portfolio details, and project reviews. Administrators manage employee capability tags and account roles from People &amp; teams.</p>
            <p>Use the theme control to switch between light and dark appearance. Sign out from the account menu to return to the public product overview.</p>
          </DocSection>

          <section className="documentation-help">
            <span><CircleHelp size={18}/></span><div><b>Ready to get started?</b><p>Sign in to your workspace or return to the product overview.</p></div>
            <button onClick={onSignIn}>Sign in <ArrowRight size={14}/></button>
          </section>
        </article>
      </div>
    </main>
    <footer className="landing-footer">
      <div className="landing-footer-identity"><a className="landing-brand" href="/"><span className="brand-symbol"><i/><i/><i/></span>Webflow<span className="landing-brand-suffix">Project Hub</span></a><span>Guide to the shared project delivery workspace.</span></div>
      <div className="landing-footer-actions"><a href="/">Product overview <ArrowRight size={13}/></a></div>
    </footer>
  </div>;
}
