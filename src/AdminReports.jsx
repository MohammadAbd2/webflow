import { useEffect, useState } from 'react';
import { Activity, CalendarDays, CheckCheck, ChevronDown, FolderKanban, Users } from 'lucide-react';

const ranges = [7, 30, 90];

function Metric({ icon: Icon, label, value, detail, tint }) {
  return <article className="report-metric">
    <span className={`report-metric-icon ${tint}`}><Icon size={18}/></span>
    <span><small>{label}</small><b>{value}</b><em>{detail}</em></span>
  </article>;
}

function EmptyReport({ children }) {
  return <div className="report-empty">{children}</div>;
}

export default function AdminReports() {
  const [range, setRange] = useState(30);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('stride_token');
        if (!token) throw new Error('Sign in as an administrator to view live reports.');
        const response = await fetch(`/api/admin/reports?days=${range}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Could not load workspace reports.');
        if (active) setReport(body);
      } catch (loadError) {
        if (active) {
          setReport(null);
          setError(loadError.message || 'Could not load workspace reports.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => { active = false; };
  }, [range]);

  const daily = report?.daily || [];
  const maxCompleted = Math.max(0, ...daily.map(day => day.completed_tasks));
  const labelIndexes = daily.length <= 7
    ? daily.map((_, index) => index)
    : [0, Math.floor((daily.length - 1) / 3), Math.floor(2 * (daily.length - 1) / 3), daily.length - 1];
  const summary = report?.summary;

  return <>
    <div className="welcome-row">
      <div>
        <div className="eyebrow"><span className="eyebrow-dot"/> WORKSPACE INSIGHTS</div>
        <h1>Reports</h1>
        <p className="lead">Live client intake, project delivery, and task progress from your workspace.</p>
      </div>
      <div className="range-picker">
        <button className="secondary-button" aria-expanded={rangeOpen} onClick={() => setRangeOpen(!rangeOpen)}>
          <CalendarDays size={15}/> Last {range} days <ChevronDown size={14}/>
        </button>
        {rangeOpen && <div className="range-menu">{ranges.map(days =>
          <button key={days} onClick={() => { setRange(days); setRangeOpen(false); }}>{days} days</button>
        )}</div>}
      </div>
    </div>

    {error && <div className="panel report-message" role="alert">{error}</div>}
    {loading && !report && <div className="panel report-message" role="status">Loading live workspace data…</div>}
    {!loading && report && summary && <>
      <div className="report-metrics">
        <Metric icon={Users} tint="violet" label="Client accounts" value={summary.clients} detail={`${summary.new_clients} new in the last ${range} days`}/>
        <Metric icon={FolderKanban} tint="blue" label="New projects" value={summary.new_projects} detail={`Created in the last ${range} days`}/>
        <Metric icon={Activity} tint="amber" label="Active projects" value={summary.active_projects} detail={`${summary.completed_projects} completed overall`}/>
        <Metric icon={CheckCheck} tint="mint" label="Tasks completed" value={summary.completed_tasks} detail={`In the last ${range} days`}/>
      </div>

      <div className="reports-grid">
        <section className="panel chart-panel report-chart">
          <div className="panel-heading">
            <div><h2>Completed tasks</h2><p>Recorded completion dates across the selected period.</p></div>
            <span className="chart-legend"><i/> Completed</span>
          </div>
          {maxCompleted ? <div className="bar-chart" role="img" aria-label={`Daily task completions over the last ${range} days`}>
            {daily.map(day => <div className="bar-col" key={day.date} title={`${day.date}: ${day.completed_tasks} completed`}>
              <span style={{ height: `${day.completed_tasks ? Math.max(5, day.completed_tasks / maxCompleted * 100) : 0}%` }}/>
            </div>)}
          </div> : <EmptyReport>No tasks were marked complete during this period.</EmptyReport>}
          <div className="chart-labels">{labelIndexes.map(index =>
            <span key={daily[index]?.date}>{daily[index]?.date ? new Date(`${daily[index].date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
          )}</div>
        </section>

        <section className="panel phase-report report-lifecycle">
          <div className="panel-heading"><div><h2>Project lifecycle</h2><p>Current status of every project.</p></div></div>
          {report.project_statuses.length ? report.project_statuses.map((item, index) =>
            <div className="phase-report-row" key={item.label}>
              <span className={`phase-report-dot ${['violet', 'blue', 'mint', 'amber'][index % 4]}`}/>
              <span>{item.label}</span><b>{item.count}</b>
            </div>
          ) : <EmptyReport>No projects have been created yet.</EmptyReport>}
          <div className="report-request-summary">
            <b>Client requests</b><span>{summary.open_requests} open</span>
          </div>
          {report.request_statuses.length > 0 && <div className="report-request-statuses">
            {report.request_statuses.map(item => <span key={item.label}>{item.label}<b>{item.count}</b></span>)}
          </div>}
        </section>
      </div>

      <section className="panel report-projects">
        <div className="panel-heading">
          <div><h2>Recent projects</h2><p>Latest project records and their current delivery state.</p></div>
          <span className="count-bubble">{report.recent_projects.length}</span>
        </div>
        {report.recent_projects.length ? <div className="report-project-list">
          <div className="report-project-head"><span>PROJECT / CLIENT</span><span>STATUS</span><span>STAGE</span><span>PROGRESS</span><span>TARGET</span></div>
          {report.recent_projects.map(project => <article className="report-project-row" key={project.id}>
            <span><b>{project.name}</b><small>{project.client}</small></span>
            <span><i className={`report-status-dot ${project.status.toLowerCase().replaceAll(' ', '-')}`}/>{project.status}</span>
            <span>{project.stage}</span>
            <span className="report-progress"><i><b style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}/></i>{project.progress || 0}%</span>
            <span>{project.target_date ? new Date(`${project.target_date}T00:00:00`).toLocaleDateString() : 'Not set'}</span>
          </article>)}
        </div> : <EmptyReport>New client projects will appear here.</EmptyReport>}
      </section>
    </>}
  </>;
}
