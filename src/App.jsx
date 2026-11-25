import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownUp, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, FileText, Filter, FolderKanban, Gauge, LayoutDashboard, LifeBuoy, ListTodo, LockKeyhole, LogOut, Mail, Menu, MessageSquareText, Minus, MoreHorizontal, Moon, Paperclip, Plus, Search, Settings2, Sun, ShieldCheck, Sparkles, Tag, Target, Trash2, Users, WandSparkles, X, Zap } from 'lucide-react';
import { AdminRequests, AdminTeamApproval, ClientProfileSettings, ProjectTeamProposal, RosterInvitations, ScrumTeams, requestStatuses, workspaceRequest } from './TeamWorkflows';
import AccountCounts from './AccountCounts';

const people = { JD:{name:'Jordan Davis',role:'Project owner',initials:'JD',tone:'violet',level:8,rating:4.9,services:['Product strategy','Web applications'],portfolio:['Northstar mobile app','Customer portal'],tags:['product_owner']}, MK:{name:'Maya Kim',role:'Design scrum master',initials:'MK',tone:'rose',level:7,rating:4.8,services:['UX research','Product design'],portfolio:['Northstar mobile app','Website redesign'],tags:['scrum_master','designer']}, AL:{name:'Alex Lee',role:'Frontend developer',initials:'AL',tone:'blue',level:6,rating:4.7,services:['React','Design systems'],portfolio:['Customer portal','Northstar mobile app'],tags:['developer']}, SR:{name:'Sam Rivera',role:'Backend scrum master',initials:'SR',tone:'amber',level:9,rating:5.0,services:['Backend APIs','Cloud architecture'],portfolio:['Payments platform','Customer portal'],tags:['scrum_master','developer']}, TN:{name:'Taylor Nguyen',role:'Content specialist',initials:'TN',tone:'mint',level:5,rating:4.6,services:['Content strategy','SEO'],portfolio:['Website redesign','Northstar mobile app'],tags:['content']}, RP:{name:'Riley Park',role:'UI designer',initials:'RP',tone:'peach',level:4,rating:4.9,services:['UI design','Prototyping'],portfolio:['Mobile onboarding','Website redesign'],tags:['designer']} };
const seedProjects=[{id:1,name:'Northstar mobile app',client:'Jordan Davis',description:'A mobile companion that helps teams stay focused and in sync.',owner:'Jordan Davis',progress:68,stage:'Development',steps:[{name:'Design',description:'Shape and approve the product experience.'},{name:'Development',description:'Build the approved product experience.'},{name:'Optimisation & launch',description:'Polish performance, add content, and prepare the release.'}],due:'Jun 24, 2025',health:'On track',teams:['Product design','Frontend','Backend','Content & SEO'],teamSetupStatus:'Approved',color:'violet',contract:'Signed · May 14, 2025'}, {id:2,name:'Website redesign',client:'Jordan Davis',description:'A fresh home for the Northstar brand and product.',owner:'Jordan Davis',progress:34,stage:'Design',steps:[{name:'Design',description:'Explore the brand and agree on the new website direction.'},{name:'Frontend development',description:'Build responsive pages from approved designs.'},{name:'Content & SEO',description:'Add page content, metadata, and search foundations.'},{name:'Deployment',description:'Review, publish, and hand over the finished site.'}],due:'Jul 18, 2025',health:'On track',teams:['Product design','Frontend','Content & SEO'],teamSetupStatus:'Pending admin approval',color:'orange',contract:'Needs client signature'}, {id:3,name:'Customer portal',client:'Jordan Davis',description:'Self-service portal for account and billing management.',owner:'Jordan Davis',progress:12,stage:'Discovery',steps:[{name:'Discovery',description:'Confirm goals, user needs, and technical scope.'},{name:'Backend development',description:'Build secure APIs and application data flows.'},{name:'Frontend development',description:'Build the client portal interface.'},{name:'Quality assurance',description:'Test flows, accessibility, and edge cases.'},{name:'Deployment',description:'Prepare production release and handover.'}],due:'Aug 08, 2025',health:'Needs attention',teams:['Product design','Frontend','Backend'],teamSetupStatus:'Pending admin approval',color:'mint',contract:'Awaiting admin review'}];
const seedTasks=[
 {id:'NS-142',title:'Build onboarding flow screens',label:'Frontend',status:'In progress',priority:'High',complexity:'Complex',points:8,assignee:'AL',project:1,description:'Implement the approved onboarding flow, including welcome, profile, and preferences screens.',due:'Jun 19',comments:4,files:2},
 {id:'NS-143',title:'Design saved items empty state',label:'Product design',status:'In progress',priority:'Medium',complexity:'Standard',points:3,assignee:'MK',project:1,description:'Create the empty, loading, and populated states for saved items.',due:'Jun 20',comments:2,files:1},
 {id:'NS-144',title:'Connect analytics events',label:'Backend',status:'In review',priority:'High',complexity:'Complex',points:5,assignee:'SR',project:1,description:'Send key onboarding and activation events to the analytics service.',due:'Jun 18',comments:3,files:0},
 {id:'NS-145',title:'Write onboarding microcopy',label:'Content & SEO',status:'To do',priority:'Low',complexity:'Simple',points:2,assignee:'TN',project:1,description:'Write concise, helpful copy for all onboarding steps.',due:'Jun 21',comments:0,files:0},
 {id:'NS-146',title:'Audit current onboarding funnel',label:'Product design',status:'Done',priority:'Medium',complexity:'Standard',points:3,assignee:'RP',project:1,description:'Review current conversion data and identify friction.',due:'Jun 12',comments:5,files:3},
 {id:'NS-147',title:'Create account API endpoints',label:'Backend',status:'To do',priority:'High',complexity:'Complex',points:8,assignee:'SR',project:1,description:'Add secure account creation and profile update endpoints.',due:'Jun 23',comments:1,files:0},
 {id:'NS-148',title:'Set up component library',label:'Frontend',status:'Done',priority:'Medium',complexity:'Standard',points:5,assignee:'AL',project:1,description:'Establish accessible, reusable components for the application.',due:'Jun 11',comments:2,files:4},
 {id:'NS-149',title:'Review visual direction with client',label:'Product design',status:'To do',priority:'Medium',complexity:'Standard',points:2,assignee:'MK',project:1,description:'Present the latest visual direction and collect feedback.',due:'Jun 22',comments:0,files:1},
];
const stageSteps=['Design','Development','Optimisation & launch'];
const defaultProjectSteps=[{name:'Design',description:'Plan, research, and shape the experience.'},{name:'Development',description:'Build the approved design into a working product.'},{name:'Optimisation & launch',description:'Polish, add content, test, and prepare to launch.'}];
function Avatar({id,size='',image='',name=''}) { const key=String(id??'?'); const p=people[key]||{name:name||key,initials:(name||key).split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase()||'?',tone:'blue'};return <span className={`avatar ${p.tone} ${size} ${image?'has-photo':''}`} title={name||p.name}>{image?<img src={image} alt={`${name||p.name} profile`}/>:p.initials}</span> }
function employeeRating(id,fallback){try{return Number(JSON.parse(localStorage.getItem('webflow_ratings')||'{}')[id]||fallback)}catch{return fallback}}
function Progress({value}) { return <div className="progress-track"><i style={{width:`${value}%`}} /></div> }
function App(){
 const [role,setRole]=useState('Admin'); const [authUser,setAuthUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('stride_user')||'null')}catch{return null}}); const [view,setView]=useState('Overview'); const [activeProject,setActiveProject]=useState(1); const [projects,setProjects]=useState(()=>{try{return JSON.parse(localStorage.getItem('webflow_projects'))||seedProjects}catch{return seedProjects}}); const [projectTeams,setProjectTeams]=useState(()=>{try{return JSON.parse(localStorage.getItem('webflow_project_teams'))||{}}catch{return {}}}); const [tasks,setTasks]=useState(()=>{try{return JSON.parse(localStorage.getItem('webflow_tasks'))||seedTasks}catch{return seedTasks}}); const [contractFiles,setContractFiles]=useState([]); const [cancellationRequests,setCancellationRequests]=useState([]); const [apiRequests,setApiRequests]=useState([]); const [apiProjects,setApiProjects]=useState([]); const [apiPeople,setApiPeople]=useState([]); const [modal,setModal]=useState(''); const [notice,setNotice]=useState(''); const [query,setQuery]=useState(''); const [filter,setFilter]=useState('All tasks'); const [selectedTask,setSelectedTask]=useState(null); const [selectedProfile,setSelectedProfile]=useState(null); const [theme,setTheme]=useState(()=>localStorage.getItem('webflow_theme')||'light'); const [mobileNav,setMobileNav]=useState(false); const [invites,setInvites]=useState([{id:1,project:'Website redesign',team:'Product design',owner:'Jordan Davis',due:'Jun 18',role:'UI designer'},{id:2,project:'Customer portal',team:'Frontend',owner:'Jordan Davis',due:'Jun 20',role:'Frontend developer'}]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('webflow_theme',theme)},[theme]);
 useEffect(()=>{localStorage.setItem('webflow_projects',JSON.stringify(projects))},[projects]);
 useEffect(()=>{localStorage.setItem('webflow_project_teams',JSON.stringify(projectTeams))},[projectTeams]);
 useEffect(()=>{localStorage.setItem('webflow_tasks',JSON.stringify(tasks))},[tasks]);
 useEffect(()=>{const id=new URLSearchParams(location.search).get('task');const linked=tasks.find(t=>String(t.id)===id);if(linked)setSelectedTask(linked)},[tasks]);
 useEffect(()=>{if(authUser){const token=localStorage.getItem('stride_token');if(token){const headers={Authorization:`Bearer ${token}`};fetch('/api/employees',{headers}).then(r=>r.ok?r.json():[]).then(setApiPeople).catch(()=>{});(async()=>{try{const r=await fetch('/api/projects',{headers});if(!r.ok)return;const rows=await r.json();const enriched=await Promise.all(rows.map(async project=>{let steps=[];try{const stepResponse=await fetch(`/api/projects/${project.id}/steps`,{headers});if(stepResponse.ok)steps=await stepResponse.json()}catch{}return {...project,steps:steps.length?steps.map(step=>({name:step.name,description:step.description})):defaultProjectSteps}}));setApiProjects(enriched)}catch{}})();if(authUser.role==='client'||authUser.role==='employee'&&authUser.tags?.includes('product_owner'))fetch('/api/project-requests',{headers}).then(r=>r.ok?r.json():[]).then(setApiRequests).catch(()=>{})}}},[authUser]);
 useEffect(()=>{
  if(!authUser?.id)return;
  const token=localStorage.getItem('stride_token');
  let active=true;
  async function refreshProjectStatus(){
   try {
    const response=await fetch('/api/projects',{headers:{Authorization:`Bearer ${token}`}});
    if(!response.ok)return;
    const rows=await response.json();
    if(!active)return;
    setApiProjects(current=>{
     const byId=new Map(rows.map(row=>[row.id,row]));
     let changed=false;
     const next=current.map(project=>{
      const row=byId.get(project.id);
      if(!row||['completed_at','completion_due_at','cancellation_status','progress','stage','setup_status','client_name'].every(key=>project[key]===row[key]))return project;
      changed=true;
      return {...project,...row};
     });
     return changed?next:current;
    });
   }catch{}
  }
  const timer=setInterval(refreshProjectStatus,15000);
  window.addEventListener('focus',refreshProjectStatus);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refreshProjectStatus)};
 },[authUser?.id]);
 useEffect(()=>{
  if(!authUser?.id)return;
  let current=true;
  async function syncAccount(){
   try{
    const user=await workspaceRequest('/auth/me');
    if(!current)return;
    setAuthUser(old=>{
     if(!old||old.id!==user.id||JSON.stringify(old)===JSON.stringify(user))return old;
     localStorage.setItem('stride_user',JSON.stringify(user));
     return user;
    });
   }catch{}
  }
  const timer=setInterval(syncAccount,15000);
  window.addEventListener('focus',syncAccount);
  syncAccount();
  return()=>{current=false;clearInterval(timer);window.removeEventListener('focus',syncAccount)};
 },[authUser?.id]);
 useEffect(()=>{
  if(view!=='Client requests'||!authUser||authUser.role==='admin')return;
  let current=true;
  workspaceRequest('/project-requests').then(rows=>{if(current)setApiRequests(rows)}).catch(()=>{});
  return()=>{current=false};
 },[view,authUser]);
 useEffect(()=>{if(authUser?.role!=='employee')return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;fetch('/api/invitations',{headers:{Authorization:`Bearer ${token}`}}).then(async response=>{const rows=await response.json();if(!response.ok)throw new Error(rows.detail||'Could not load invitations');if(active)setInvites(rows.map(row=>({id:row.id,serverId:row.id,project:row.project,team:row.team,owner:'Project owner',due:'See project plan',role:row.is_scrum_master?'Scrum master':'Team member'})))}).catch(error=>{if(active)notify(error.message)});return()=>{active=false}},[authUser,view==='Invitations']);
 useEffect(()=>{if(!authUser||!apiProjects.length)return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;Promise.all(apiProjects.map(async project=>{try{const response=await fetch(`/api/projects/${project.id}/contracts`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)return [];return (await response.json()).map(contract=>({...contract,project_id:project.id,project_name:project.name,project_owner_id:project.owner_id}))}catch{return []}})).then(groups=>{if(active)setContractFiles(groups.flat())});return()=>{active=false}},[apiProjects,authUser]);
 useEffect(()=>{if(authUser?.role!=='admin')return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;fetch('/api/admin/cancellation-requests',{headers:{Authorization:`Bearer ${token}`}}).then(async response=>{const rows=await response.json();if(!response.ok)throw new Error(rows.detail||'Could not load cancellation requests');if(active)setCancellationRequests(rows)}).catch(error=>{if(active)notify(error.message)});return()=>{active=false}},[authUser]);
 useEffect(()=>{if(!apiProjects.length||!authUser)return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;Promise.all(apiProjects.map(async project=>{try{const response=await fetch(`/api/projects/${project.id}/teams`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)return [project.id,[]];const rows=await response.json();return [project.id,rows.map(team=>({...team,scrumMasterId:team.scrum_master_id,members:(team.members||[]).map(member=>member.user_id),reviewStatus:team.review_status}))]}catch{return [project.id,[]]}})).then(entries=>{if(active)setProjectTeams(old=>({...old,...Object.fromEntries(entries.map(([id,teams])=>[`api-project-${id}`,teams]))}))});return()=>{active=false}},[apiProjects,authUser]);
 useEffect(()=>{if(!authUser)return;if(!apiProjects.length){setProjects([]);return}const mapped=apiProjects.map(p=>({id:`api-project-${p.id}`,serverId:p.id,name:p.name,client:p.client_name||apiPeople.find(u=>u.id===p.client_id)?.name||`Client #${p.client_id}`,description:p.description||'',owner:p.owner_name||apiPeople.find(u=>u.id===p.owner_id)?.name||authUser.name||`Owner #${p.owner_id}`,ownerUserId:p.owner_id,clientUserId:p.client_id,completedAt:p.completed_at,completionDueAt:p.completion_due_at,cancellationStatus:p.cancellation_status==="approved"?"Cancelled":p.cancellation_status==="pending_admin_review"?"Pending admin review":null,progress:p.progress||0,stage:p.stage||'Planning',steps:p.steps||defaultProjectSteps,due:p.target_date||'TBD',health:['pending_admin_review','pending_team_review'].includes(p.setup_status)?'Pending admin approval':p.setup_status==='approved'?'On track':'In setup',teamSetupStatus:['pending_admin_review','pending_team_review'].includes(p.setup_status)?'Pending admin approval':p.setup_status==='approved'?'Approved':'Not started',color:'violet',contract:'Check contracts',requestOnly:false}));setProjects(mapped);setActiveProject(current=>current===null||mapped.some(p=>p.id===current)?current:(mapped[0]?.id??null))},[apiProjects,apiPeople,authUser]);
 useEffect(()=>{if(!authUser||!apiProjects.some(project=>!project.steps?.some(step=>typeof step==='object'&&step.id)))return;let active=true;Promise.all(apiProjects.map(async project=>{if(project.steps?.some(step=>typeof step==='object'&&step.id))return [project.id,null];try{return [project.id,await workspaceRequest(`/projects/${project.id}/steps`)]}catch{return [project.id,null]}})).then(entries=>{const refreshed=entries.filter(([,steps])=>steps?.some(step=>step.id));if(active&&refreshed.length)setApiProjects(old=>old.map(project=>{const steps=refreshed.find(([id])=>id===project.id)?.[1];return steps?{...project,steps}:project}))});return()=>{active=false}},[authUser?.id,apiProjects]);
 useEffect(()=>{if(authUser){const authRole={admin:'Admin',employee:'Employee',client:'Client'}[authUser.role];if(authRole)setRole(authRole)}},[authUser]);
 const project=projects.find(p=>String(p.id)===String(activeProject))||(authUser?undefined:projects[0]);
 useEffect(()=>{if(!authUser||!apiProjects.length)return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;const headers={Authorization:`Bearer ${token}`};Promise.all(apiProjects.map(async item=>{try{const [taskResponse,teamResponse]=await Promise.all([fetch(`/api/projects/${item.id}/tasks`,{headers}),authUser.role==='client'?Promise.resolve(null):fetch(`/api/projects/${item.id}/teams`,{headers})]);if(!taskResponse.ok)return [];const [rows,teams]=await Promise.all([taskResponse.json(),teamResponse?.ok?teamResponse.json():[]]); return rows.map(task=>{const team=teams.find(x=>x.id===task.team_id);const assignee=apiPeople.find(x=>x.id===task.assignee_id);return {...task,id:`api-task-${task.id}`,serverId:task.id,project:`api-project-${item.id}`,label:team?.name||'Unassigned',status:({waiting:'To do',in_progress:'In progress',in_review:'In review',done:'Done'})[task.status]||'To do',priority:(task.priority||'medium').replace(/^./,x=>x.toUpperCase()),complexity:(task.complexity||'standard').replace(/^./,x=>x.toUpperCase()),points:task.story_points,estimatedHours:task.estimated_hours||Number(task.story_points||1)*4,assignee:task.assignee_id,assigneeName:task.assignee_name||assignee?.name||'Unassigned',due:task.due_date||'TBD',sprintId:task.sprint_id||'',projectStepId:task.project_step_id,triggerTaskIds:task.trigger_task_ids||[],position:task.position||0,completedAt:task.completed_at,comments:0,files:0}})}catch{return []}})).then(groups=>{if(active)setTasks(old=>[...old.filter(task=>!task.serverId),...groups.flat()])});return()=>{active=false}},[authUser,apiProjects,apiPeople]);
 useEffect(()=>{if(!authUser||!apiProjects.length)return;let active=true;Promise.all(apiProjects.map(async project=>{try{return await workspaceRequest(`/projects/${project.id}/tasks`)}catch{return []}})).then(groups=>{if(!active)return;const byId=new Map(groups.flat().map(task=>[String(task.id),task]));setTasks(old=>old.map(task=>{const row=byId.get(String(task.serverId));return row?{...task,projectStepId:row.project_step_id,triggerTaskIds:row.trigger_task_ids||[],position:row.position||0,completedAt:row.completed_at}:task}).map(task=>({...task,triggered:groups.flat().some(source=>(source.trigger_task_ids||[]).map(String).includes(String(task.serverId))&&source.status==='done')})))});return()=>{active=false}},[authUser?.id,apiProjects]);
 const workspaceTeams=projectTeams[activeProject]?.map(t=>({id:t.id,projectId:project?.serverId,name:t.name,lead:t.scrumMasterId,members:t.members,color:t.name==='Product design'?'rose':t.name==='Backend'?'amber':t.name==='Frontend'?'blue':'mint'}))||(authUser?[]:null);
 const canStartProject=!authUser||authUser.role!=='employee'||authUser.tags?.includes('product_owner');const navItems=role==='Admin'?[['Workspace',[['Overview',LayoutDashboard],['Projects',FolderKanban],['Approvals',ShieldCheck],['People & teams',Users],['People directory',Search],['Client requests',BriefcaseBusiness]]],['Manage',[['Task queue',ListTodo],['Contracts',FileText],['Reports',Activity],['Messages',MessageSquareText]]]]:role==='Client'?[['Workspace',[['Overview',LayoutDashboard],['My projects',FolderKanban],['Client requests',MessageSquareText],['People directory',Search],['Contracts',FileText],['Messages',MessageSquareText]]]]:[['Workspace',[['Overview',LayoutDashboard],['My projects',FolderKanban],['Invitations',BriefcaseBusiness],['My tasks',ListTodo],['Team review',Users],...(authUser?.role==='employee'&&authUser.tags?.includes('scrum_master')?[['Teams',Users]]:[]),['Client requests',MessageSquareText],['People directory',Search]]],['Manage',[['My growth',Zap],['Messages',MessageSquareText]]]];
 const allVisibleTasks=tasks.filter(t=>t.project===activeProject&&(role!=='Employee'||authUser?.tags?.some(tag=>['scrum_master','product_owner'].includes(tag))||String(t.assignee)===String(authUser?.id))); const myTasks=tasks.filter(task=>(!authUser||String(task.assignee)===String(authUser.id))&&(authUser?!!task.serverId:task.project===activeProject));  const visibleTasks=allVisibleTasks.filter(t=>(filter==='All tasks'||(filter==='Assigned to me'?t.assignee==='AL':t.status===filter))&&(!query||`${t.title} ${t.id} ${t.label}`.toLowerCase().includes(query.toLowerCase())));
 const saveTaskPosition=async(task,status,position)=>{const apiStatus=({'To do':'waiting','In progress':'in_progress','In review':'in_review','Done':'done'})[status]||status;if(task.serverId){try{await workspaceRequest(`/tasks/${task.serverId}/status?status=${encodeURIComponent(apiStatus)}&position=${position}`,{method:'PATCH'})}catch(error){notify(error.message);return false}}setTasks(old=>{const current=old.find(item=>item.id===task.id);if(!current)return old;const source=old.filter(item=>item.project===task.project&&item.status===current.status&&item.id!==task.id).sort((a,b)=>(a.position??0)-(b.position??0));const destination=current.status===status?source:old.filter(item=>item.project===task.project&&item.status===status&&item.id!==task.id).sort((a,b)=>(a.position??0)-(b.position??0));const moved={...current,status,position,completedAt:status==='Done'?(current.completedAt||new Date().toISOString()):null};destination.splice(Math.max(0,Math.min(position,destination.length)),0,moved);return old.map(item=>{if(item.id===task.id)return moved;if(item.project!==task.project)return item;const sourceIndex=source.findIndex(row=>row.id===item.id);if(sourceIndex>=0&&current.status!==status)return {...item,position:sourceIndex};const destIndex=destination.findIndex(row=>row.id===item.id);return destIndex>=0?{...item,position:destIndex}:item}).map(item=>({...item,triggered:old.some(sourceTask=>(sourceTask.triggerTaskIds||[]).map(String).includes(String(item.serverId??item.id))&&(sourceTask.id===task.id?status:sourceTask.status)==='Done')}))});setSelectedTask(current=>current?.id===task.id?{...current,status,position,completedAt:status==='Done'?(current.completedAt||new Date().toISOString()):null}:current);return true};
 const changeTaskStatus=async(task,status)=>{const apiStatus=({'To do':'waiting','In progress':'in_progress','In review':'in_review','Done':'done'})[status]||status;let result;if(task.serverId){try{result=await workspaceRequest(`/tasks/${task.serverId}/status?status=${encodeURIComponent(apiStatus)}`,{method:'PATCH'})}catch(error){notify(error.message);return false}}const completedAt=result?.completed_at|| (status==='Done'?(task.completedAt||new Date().toISOString()):null);setTasks(old=>old.map(item=>item.id===task.id?{...item,status,completedAt}:item).map(item=>({...item,triggered:old.some(source=>(source.triggerTaskIds||[]).map(String).includes(String(item.serverId??item.id))&&(source.id===task.id?status:source.status)==='Done')})));setSelectedTask(old=>old?.id===task.id?{...old,status,completedAt}:old);return true};
 const updateTask=async(task,data)=>{if(task.serverId){try{const result=await workspaceRequest(`/tasks/${task.serverId}`,{method:'PATCH',data:{title:data.title,description:data.description,priority:data.priority.toLowerCase(),complexity:data.complexity.toLowerCase(),story_points:Number(data.points),estimated_hours:Number(data.estimatedHours),due_date:data.due||null}});const updated={...task,...result,title:result.title,description:result.description,priority:result.priority.replace(/^./,letter=>letter.toUpperCase()),complexity:result.complexity.replace(/^./,letter=>letter.toUpperCase()),points:result.story_points,estimatedHours:result.estimated_hours,due:result.due_date||'TBD'};setTasks(old=>old.map(item=>item.id===task.id?updated:item));setSelectedTask(updated);notify('Task updated; sprint tracking and charts are refreshed.');return true}catch(error){notify(error.message);return false}}const updated={...task,...data,points:Number(data.points),estimatedHours:Number(data.estimatedHours)};setTasks(old=>old.map(item=>item.id===task.id?updated:item));setSelectedTask(updated);notify('Task updated.');return true};
 const saveTaskWorkflow=async(task,data)=>{let persisted=data;if(task.serverId){try{const result=await workspaceRequest(`/tasks/${task.serverId}/workflow`,{method:'PATCH',data:{project_step_id:data.projectStepId,trigger_task_ids:data.triggerTaskIds}});persisted={projectStepId:result.project_step_id,triggerTaskIds:result.trigger_task_ids||[]}}catch(error){notify(error.message);return false}}setTasks(old=>old.map(item=>item.id===task.id?{...item,projectStepId:persisted.projectStepId,triggerTaskIds:persisted.triggerTaskIds}:item).map(item=>({...item,triggered:old.some(source=>(source.triggerTaskIds||[]).map(String).includes(String(item.serverId??item.id))&&source.status==='Done')})));notify('Task workflow saved');return true};
 const notify=(message)=>{setNotice(message);setTimeout(()=>setNotice(''),2800)};
 const removeTeamMember=async(group,member)=>{if(!group.id||!group.projectId)return;if(!window.confirm(`Remove ${member.name} from ${group.name}?`))return;try{await workspaceRequest(`/teams/${group.id}/members/${member.id}`,{method:'DELETE'});setProjectTeams(old=>({...old,[activeProject]:old[activeProject]?.map(team=>team.id===group.id?{...team,members:team.members.filter(id=>String(id)!==String(member.id))}:team)}));notify(`${member.name} was removed from ${group.name}`)}catch(error){notify(error.message)}};
 const switchView=(v)=>{setView(v);setMobileNav(false);setSelectedTask(null);if(v==='My tasks'&&role==='Employee')setActiveProject(null)};
 const refreshApiRequests=async()=>{const token=localStorage.getItem('stride_token');if(!token)return;try{const r=await fetch('/api/project-requests',{headers:{Authorization:`Bearer ${token}`}});if(r.ok)setApiRequests(await r.json())}catch{}};
 const postProjectRequest=async(data)=>{const token=localStorage.getItem('stride_token');if(!token||authUser?.role!=='client'){createProject({...data,requestOnly:true});return}if(data.ownerSelection==='specific'&&!data.requestedOwnerId){notify('Search and select a product owner first.');return}const body={name:data.name,description:data.description||'',requested_owner_id:data.ownerSelection==='specific'?Number(data.requestedOwnerId):null,target_date:data.due||null,steps:data.steps||[],message:data.requestComment||''};try{const response=await fetch('/api/project-requests',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not post project request');setApiRequests(old=>[result,...old.filter(x=>x.id!==result.id)]);setModal('');switchView('Client requests');notify('Project request posted to product owners')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API. Check that Docker is running.':error.message)}};
 const addRemoteRequestComment=async(requestId,body)=>{const token=localStorage.getItem('stride_token');if(!token)return;try{const response=await fetch(`/api/project-requests/${requestId}/comments`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({body})});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not post reply');setApiRequests(old=>old.map(r=>r.id===requestId?{...r,comments:[...(r.comments||[]),data]}:r));notify('Reply sent to the project request')}catch(error){notify(error.message)}};
 const acceptRemoteRequest=async(requestId)=>{const token=localStorage.getItem('stride_token');if(!token)return;try{const response=await fetch(`/api/project-requests/${requestId}/accept`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not accept request');const r=data.request,pr=data.project;setApiRequests(old=>old.map(x=>x.id===requestId?r:x));setApiProjects(old=>[{...pr,steps:r.steps?.length?r.steps:defaultProjectSteps},...old.filter(item=>item.id!==pr.id)]);const normalized={id:`api-project-${pr.id}`,serverId:pr.id,name:pr.name,client:r.client_name,description:pr.description,owner:authUser.name,progress:pr.progress||0,stage:pr.stage||'Planning',steps:r.steps?.length?r.steps:defaultProjectSteps,due:r.target_date||'TBD',health:'Owner selected',teams:[],teamSetupStatus:'Not started',color:'violet',contract:'Draft',requestOnly:false};setProjects(old=>[normalized,...old.filter(x=>x.id!==normalized.id)]);setProjectTeams(old=>({...old,[`api-project-${pr.id}`]:[]}));setActiveProject(`api-project-${pr.id}`);notify('Request accepted · prepare its delivery plan')}catch(error){notify(error.message)}};
 const saveEmployeeRating=async(id,rating,projectId,service='Overall',comment='')=>{const token=localStorage.getItem('stride_token');if(!token)return;const response=await fetch(`/api/employees/${id}/reviews`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({rating,service,comment,project_id:Number(projectId)})});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not save rating');const dir=await fetch('/api/employees',{headers:{Authorization:`Bearer ${token}`}});if(dir.ok)setApiPeople(await dir.json());return result};
 const saveEmployeeProfile=async(id,data)=>{const token=localStorage.getItem('stride_token');if(!token)return;const response=await fetch('/api/employees/me/profile',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not save profile');const dir=await fetch('/api/employees',{headers:{Authorization:`Bearer ${token}`}});if(dir.ok)setApiPeople(await dir.json());if(authUser?.id===result.id){setAuthUser(result);localStorage.setItem('stride_user',JSON.stringify(result))}notify('Employee profile saved')};
 const saveProfilePhoto=async(file)=>{const token=localStorage.getItem('stride_token');if(!token)throw new Error('Sign in to update your profile photo');const body=new FormData();body.append('file',file);const response=await fetch('/api/users/me/profile-photo',{method:'POST',headers:{Authorization:`Bearer ${token}`},body});const user=await response.json();if(!response.ok)throw new Error(user.detail||'Could not save profile photo');setAuthUser(current=>{if(current?.id!==user.id)return current;localStorage.setItem('stride_user',JSON.stringify(user));return user});setApiPeople(current=>current.map(person=>person.id===user.id?{...person,...user}:person));return user};
 const createProject=async(data)=>{const token=localStorage.getItem('stride_token');if(authUser&&token&&!data.requestOnly){const clientId=Number(data.clientId),ownerId=Number(data.ownerId||authUser.id);if(!clientId||!ownerId){notify('Choose a client and project owner before continuing');return}try{const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};const response=await fetch('/api/projects',{method:'POST',headers,body:JSON.stringify({name:data.name,description:data.description||'',client_id:clientId,owner_id:ownerId,target_date:data.due||null,steps:data.steps||[]})});const row=await response.json();if(!response.ok)throw new Error(row.detail||'Could not create project');const teamResponse=await fetch(`/api/projects/${row.id}/teams/batch`,{method:'POST',headers,body:JSON.stringify({teams:(data.teams||[]).map(team=>({name:team.name,discipline:team.name,scrum_master_id:Number(team.scrumMasterId),member_ids:team.members.map(Number),roster_team_ids:team.rosterIds||[]}))})});const teamRows=await teamResponse.json();if(!teamResponse.ok){setApiProjects(old=>[{...row,steps:data.steps||defaultProjectSteps},...old.filter(item=>item.id!==row.id)]);setActiveProject(`api-project-${row.id}`);setModal('');switchView('Project workspace');throw new Error(teamRows.detail||'Project created. Open Select project teams to retry the proposal.')}const project={id:`api-project-${row.id}`,serverId:row.id,name:row.name,client:data.client||`Client #${clientId}`,description:row.description||'',owner:data.owner||`Owner #${ownerId}`,ownerUserId:ownerId,progress:row.progress||0,stage:row.stage||data.steps?.[0]?.name||'Planning',steps:data.steps||defaultProjectSteps,due:row.target_date||'TBD',health:'Pending approval',teamSetupStatus:'Pending admin approval',teams:(data.teams||[]).map(team=>team.name),color:'violet',contract:'Draft'};setProjects(old=>[project,...old.filter(item=>item.id!==project.id)]);setProjectTeams(old=>({...old,[project.id]:teamRows.map((team,index)=>({...data.teams[index],id:team.id,scrumMasterId:team.scrum_master_id,reviewStatus:team.review_status}))}));setApiProjects(old=>[row,...old.filter(item=>item.id!==row.id)]);setActiveProject(project.id);setModal('');switchView('Team review');notify('Project and team proposal submitted for review');return}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API. Check that Docker is running.':error.message);return}}const id=Date.now();const projectSteps=data.steps?.length?data.steps:defaultProjectSteps;const teams=data.teams||[];const p={id,clientUserId:authUser?.id||null,name:data.name,client:data.client||authUser?.organization_name||authUser?.name||'Client',description:data.description||'A new client project.',owner:data.requestOnly?'Unassigned':data.owner||'Jordan Davis',progress:0,stage:projectSteps[0]?.name||'Planning',steps:projectSteps,due:data.due||'TBD',health:data.requestOnly?'Awaiting product owner':'Pending approval',requestOnly:!!data.requestOnly,requestStatus:data.requestOnly?'Open':undefined,ownerSelection:data.ownerSelection,requestedOwner:data.requestedOwner,requestComments:data.requestComment?[{author:data.client||'Client',text:data.requestComment,at:new Date().toISOString()}]:[],teams:teams.map(t=>t.name),teamSetupStatus:data.requestOnly?'Not started':'Pending admin approval',color:'violet',contract:'Draft'};setProjects(old=>[p,...old]);setProjectTeams(old=>({...old,[id]:teams}));setActiveProject(id);setModal('');if(data.requestOnly){switchView('Client requests');notify('Your project request is visible to product owners')}else{switchView('Approvals');notify('Team setup submitted to the admin')}};
 const saveProjectTeams=async(id,teams)=>{
  const project=projects.find(item=>item.id===id);
  if(!project?.serverId){notify('Select a saved project before submitting teams');return false}
  try{
   const rows=await workspaceRequest(`/projects/${project.serverId}/teams/batch`,{method:'POST',data:{teams:teams.map(team=>({
    name:team.name,discipline:team.name,scrum_master_id:team.scrumMasterId,roster_team_ids:team.rosterIds
   }))}});
   setProjectTeams(old=>({...old,[id]:rows.map(team=>({...team,scrumMasterId:team.scrum_master_id,
    members:team.members.map(member=>member.user_id),reviewStatus:team.review_status}))}));
   setApiProjects(old=>old.map(item=>item.id===project.serverId?{...item,setup_status:'pending_admin_review'}:item));
   setProjects(old=>old.map(item=>item.id===id?{...item,teamSetupStatus:'Pending admin approval',health:'Pending approval'}:item));
   setModal('');notify('Project proposal submitted for admin review');
   return true;
  }catch(error){notify(error.message);return false}
 };
  const reviewTeam=async(projectId,index,action,members)=>{const project=projects.find(p=>p.id===projectId);const current=projectTeams[projectId]||[];const selected=current[index];if(project?.serverId&&selected?.id){const token=localStorage.getItem('stride_token');try{const endpoint=action==='owner_approve'?`/api/teams/${selected.id}/review/owner`:`/api/teams/${selected.id}/review`;const options=action==='owner_approve'?{method:'POST',headers:{Authorization:`Bearer ${token}`}}:{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({accept:action==='approve',member_ids:(members||selected.members).map(Number)})};const response=await fetch(endpoint,options);const body=await response.json();if(!response.ok)throw new Error(body.detail||'Team review failed');const teamResponse=await fetch(`/api/projects/${project.serverId}/teams`,{headers:{Authorization:`Bearer ${token}`}});const rows=await teamResponse.json();if(!teamResponse.ok)throw new Error(rows.detail||'Could not refresh team status');const fresh=rows.map(t=>({...t,scrumMasterId:t.scrum_master_id,members:t.members.map(m=>m.user_id),scrumMasterStatus:t.review_status==='approved'?'accepted':'pending',reviewStatus:t.review_status}));setProjectTeams(old=>({...old,[projectId]:fresh}));if(body.project_status==='pending_admin_review'){setProjects(old=>old.map(p=>p.id===projectId?{...p,teamSetupStatus:'Pending admin approval',health:'Pending approval'}:p));switchView('Approvals');notify('Team proposal is ready for admin approval')}else notify(action==='edit'?'Member changes sent to the project owner':'Team review recorded');return}catch(error){notify(error.message);return}}const proposed=current.map((team,i)=>i===index?{...team,members:members||team.members,scrumMasterStatus:action==='approve'?'accepted':team.scrumMasterStatus,reviewStatus:action==='edit'?'owner_review':action==='owner_approve'?'approved':action==='approve'?'approved':team.reviewStatus}:team);const allApproved=proposed.length>0&&proposed.every(team=>team.reviewStatus==='approved');setProjectTeams(old=>({...old,[projectId]:proposed}));if(allApproved){setProjects(old=>old.map(p=>p.id===projectId?{...p,teamSetupStatus:'Pending admin approval',health:'Pending approval'}:p));switchView('Approvals');notify('Team proposal is ready for admin approval')}else{notify(action==='edit'?'Member changes sent to the project owner':'Team review recorded')}};
  const updateProjectSteps=async(id,steps)=>{if(!steps.length){notify('A project needs at least one delivery step');return}const target=projects.find(p=>p.id===id);if(target?.serverId){const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/projects/${target.serverId}/steps`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(steps.map(step=>({name:step.name,description:step.description||''})))});const rows=await response.json();if(!response.ok)throw new Error(rows.detail||'Could not save delivery steps');const saved=rows.map(row=>({name:row.name,description:row.description,progress:row.progress}));setProjects(old=>old.map(p=>p.id===id?{...p,steps:saved,stage:rows.find(row=>row.progress<100)?.name||rows.at(-1)?.name||p.stage}:p));setModal('');notify('Project delivery steps saved');return}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message);return}}setProjects(old=>old.map(p=>p.id===id?{...p,steps,stage:steps.some(s=>s.name===p.stage)?p.stage:steps[0].name}:p));setModal('');notify('Project delivery steps updated')};
 const reviewContract=async(contractId,approved)=>{const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/admin/contracts/${contractId}/review`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({approved})});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not review contract');setContractFiles(old=>old.map(contract=>contract.id===contractId?{...contract,status:result.status}:contract));notify(approved?'Contract approved for signatures':'Contract changes requested')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message)}};
 const updateContractSignatures=async(contractId,signed_by)=>{try{const response=await fetch(`/api/admin/contracts/${contractId}/signatures`,{method:'PATCH',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},body:JSON.stringify({signed_by})});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not update contract signatures');setContractFiles(old=>old.map(contract=>contract.id===contractId?{...contract,status:result.status,signatures:result.signatures}:contract));notify('Contract signatures updated by admin')}catch(error){notify(error.message)}};
 const deleteContract=async(contract)=>{if(!window.confirm(`Delete contract version ${contract.version} for ${contract.project_name}? This cannot be undone.`))return;try{const response=await fetch(`/api/admin/contracts/${contract.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`}});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not delete contract');setContractFiles(old=>old.filter(item=>item.id!==result.id));notify('Contract deleted')}catch(error){notify(error.message)}};
 const signContract=async(contractId)=>{const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/contracts/${contractId}/sign`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not sign contract');setContractFiles(old=>old.map(contract=>contract.id===contractId?{...contract,status:result.status,signatures:[...(contract.signatures||[]),{user_id:authUser.id}]}:contract));notify(result.status==='signed'?'Contract signed by all parties':'Your signature was recorded')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message)}};
 const requestAmendment=async(contractId)=>{const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/contracts/${contractId}/request-amendment`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not request an amendment');setContractFiles(old=>old.map(contract=>contract.id===contractId?{...contract,status:result.status}:contract));notify('Amendment request sent for admin review')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message)}};
 const reviewCancellation=async(requestId,approved)=>{const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/admin/cancellation-requests/${requestId}?approved=${approved}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`}});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Could not review cancellation request');setCancellationRequests(old=>old.filter(request=>request.id!==requestId));setProjects(old=>old.map(project=>project.serverId===cancellationRequests.find(item=>item.id===requestId)?.project_id?{...project,cancellationStatus:result.status}:project));notify(approved?'Project cancellation approved':'Project cancellation declined')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message)}};
 const uploadContract=async(file,projectId)=>{const token=localStorage.getItem('stride_token');if(!token){notify('Sign in to upload a contract to a project');return false}const body=new FormData();body.append('file',file);try{const response=await fetch(`/api/projects/${projectId}/contracts`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Contract upload failed');const target=projects.find(p=>p.serverId===projectId);setContractFiles(old=>[{...data,project_id:projectId,project_name:target?.name,project_owner_id:target?.ownerUserId},...old]);setProjects(old=>old.map(p=>p.serverId===projectId?{...p,contract:`Version ${data.version} · Admin review`}:p));setModal('');notify('PDF uploaded · sent to admin for review');return true}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message);return false}};
 const cancelProject=async(id,reason)=>{const target=projects.find(p=>p.id===id);if(target?.serverId){const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/projects/${target.serverId}/cancellation-requests`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({reason})});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not send cancellation request')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message);return}}setProjects(old=>old.map(p=>p.id===id?{...p,cancellationStatus:'Pending admin review',cancellationReason:reason}:p));setModal('');notify('Cancellation request sent to the admin; the project stays active')};
 const addTask=async(data)=>{const current=projects.find(p=>p.id===activeProject);if(current?.serverId&&authUser){const token=localStorage.getItem('stride_token');try{const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};const teamResponse=await fetch(`/api/projects/${current.serverId}/teams`,{headers});const teams=teamResponse.ok?await teamResponse.json():[];const team=teams.find(t=>String(t.id)===String(data.teamId))||teams.find(t=>t.name===data.label||t.discipline===data.label);const response=await fetch(`/api/projects/${current.serverId}/tasks`,{method:'POST',headers,body:JSON.stringify({title:data.title,description:data.description||'',team_id:team?.id||null,assignee_id:data.assignee?Number(data.assignee):null,priority:(data.priority||'medium').toLowerCase(),complexity:(data.complexity||'standard').toLowerCase(),story_points:data.points||1,due_date:data.due&&data.due!=='TBD'?data.due:null,sprint_id:Number.isFinite(Number(data.sprintId))&&data.sprintId?Number(data.sprintId):null,ai_generated:!!data.aiGenerated})});const result=await response.json();if(!response.ok)throw new Error(result.detail||'Task could not be created');const t={...data,...result,id:`api-task-${result.id}`,serverId:result.id,project:activeProject,label:team?.name||data.label||'Unassigned',status:({waiting:'To do',in_progress:'In progress',in_review:'In review',done:'Done'})[result.status]||'To do',priority:(result.priority||'medium').replace(/^./,x=>x.toUpperCase()),complexity:(result.complexity||'standard').replace(/^./,x=>x.toUpperCase()),points:result.story_points,assignee:result.assignee_id,assigneeName:apiPeople.find(p=>p.id===result.assignee_id)?.name||'Unassigned',due:result.due_date||'TBD',sprintId:result.sprint_id||'',comments:0,files:0};setTasks(old=>[t,...old.filter(item=>item.serverId!==result.id)]);if(!data.batch){setModal('');notify('Task added to the team queue')}return true}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API. Check that Docker is running.':error.message);return false}}const t={...data,id:`NS-${150+tasks.length}`,project:activeProject,comments:0,files:0};setTasks(old=>[t,...old]);if(!data.batch){setModal('');notify('Task added to the team queue')}return true};
 const navigateNotification=(target)=>{
  const projectId=target.match(/^\/projects\/(\d+)$/)?.[1];
  if(projectId){
   setActiveProject(`api-project-${projectId}`);
   switchView('Project workspace');
   return;
  }
  switchView(target);
 };
 const changeProjectCompletion=async(project,action)=>{
  const isAdmin=authUser?.role==='admin';
  if(isAdmin&&action==='cancel'&&!window.confirm(`Cancel “${project.name}”? This will stop active work and notify the project participants.`))return;
  try {
   const response=await fetch(isAdmin?`/api/admin/projects/${project.serverId}/status`:`/api/projects/${project.serverId}/completion`,{
    method:'PATCH',
    headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},
    body:JSON.stringify({action})
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.detail||'Could not update project status');
   setApiProjects(old=>old.map(item=>item.id===result.id?{...item,...result}:item));
   notify(action==='cancel'?'Project cancelled':result.completed_at?'Project completed':result.completion_due_at?'Sent to the client for confirmation':'Project reopened');
  } catch(error){
   notify(error.message);
  }
 };
 const inviteAction=async(id,accept)=>{const invite=invites.find(item=>item.id===id);if(invite?.serverId){const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/invitations/${invite.serverId}/respond`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({accept})});const data=await response.json();if(!response.ok)throw new Error(data.detail||'Could not update invitation')}catch(error){notify(error.message==='Failed to fetch'?'Cannot reach the API.':error.message);return}}setInvites(old=>old.filter(i=>i.id!==id));notify(accept?'Invitation accepted · welcome to the project':'Invitation declined')};
 const markApproved=async(id)=>{const p=projects.find(x=>x.id===id);if(p?.serverId){const token=localStorage.getItem('stride_token');try{const response=await fetch(`/api/admin/projects/${p.serverId}/approve`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const body=await response.json();if(!response.ok)throw new Error(body.detail||'Project approval failed')}catch(error){notify(error.message);return}}setProjects(old=>old.map(x=>x.id===id?{...x,health:'On track',teamSetupStatus:'Approved',contract:'Approved · pending signatures'}:x));const proposed=projectTeams[id]||[];setInvites(old=>[...old,...proposed.flatMap(t=>t.members.map(member=>({id:Date.now()+Math.random(),project:p?.name||'Project',team:t.name,owner:p?.owner||'Project owner',due:p?.due||'TBD',role:apiPeople.find(u=>String(u.id)===String(member))?.role||people[member]?.role||'Team member'})))]);notify('Project setup approved · team invitations sent')};
 const teamGroups=[{name:'Product design',lead:'MK',members:['MK','RP'],color:'rose',count:'2 people',stage:'Design'},{name:'Frontend',lead:'AL',members:['AL'],color:'blue',count:'1 person',stage:'Development'},{name:'Backend',lead:'SR',members:['SR'],color:'amber',count:'1 person',stage:'Development'},{name:'Content & SEO',lead:'TN',members:['TN'],color:'mint',count:'1 person',stage:'Optimisation'}];
 return <div className={`app-shell ${theme==='dark'?'dark-theme':''}`}>
  <aside className={`sidebar ${mobileNav?'open':''}`}><div className="brand-row"><a className="brand" href="#" onClick={e=>e.preventDefault()}><span className="brand-symbol"><i/><i/><i/></span>Webflow</a><button className="icon-plain mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
   <div className="role-switch"><span>{authUser?'YOUR ROLE':'PREVIEW ROLE'}</span>{authUser?<b className="role-badge">{role}</b>:<div className="role-preview-options" aria-label="Preview role">{['Admin','Employee','Client'].map(item=><button type="button" className={role===item?'selected':''} key={item} onClick={()=>{setRole(item);setView('Overview')}}>{item}</button>)}</div>}</div>
   {navItems.map(([section,links])=><div className="side-section" key={section}><div className="section-label">{section}</div>{links.map(([name,Icon])=><button key={name} className={`side-link ${view===name?'active':''}`} onClick={()=>switchView(name)}><Icon size={17}/>{name}{name==='Approvals'&&<span className="side-count">3</span>}{name==='Invitations'&&invites.length>0&&<span className="side-count">{invites.length}</span>}</button>)}</div>)}
   <div className="sidebar-bottom"><button className="side-link" onClick={()=>switchView('Settings')}><Settings2 size={17}/>Settings</button></div>
  </aside>
  {mobileNav&&<button className="mobile-scrim" onClick={()=>setMobileNav(false)} />}
  <main className="main-area"><header className="topbar"><div className="breadcrumbs"><button className="icon-plain mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={19}/></button><span>Workspace</span><ChevronRight size={14}/><b>{view}</b></div><div className="top-actions"><button className="icon-square" aria-label="Help and support" title="Help and support" onClick={()=>switchView('Messages')}><CircleHelp size={18}/></button><button className="icon-square theme-toggle" title={theme==='dark'?'Switch to light theme':'Switch to dark theme'} aria-label={theme==='dark'?'Switch to light theme':'Switch to dark theme'} onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><NotificationCenter onNavigate={navigateNotification} authUser={authUser}/><button className="account-avatar" title={authUser?'Account and sign out':'Sign in'} onClick={()=>setModal('login')}><Avatar id={authUser?.id} name={authUser?.name||"Guest"} image={authUser?.profile_photo_url} size="top-avatar"/></button></div></header>
   <div className="page-content">{view==='Overview'&&<>
    <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> {role==='Client'?'CLIENT PORTAL':role==='Admin'?new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date()).toUpperCase():'YOUR WORKSPACE'}</div><h1>{`Good morning, ${authUser?.name?.split(' ')[0]||(role==='Client'?'Jordan':role==='Admin'?'Maya':'Alex')}`} <span className="wave">✳</span></h1><p className="lead">{role==='Client'?'Here’s the latest on your projects.':role==='Admin'?'Here’s what’s happening across your workspace.':'Ready to make progress? Here’s your day at a glance.'}</p></div>{canStartProject&&<button className="primary-button" onClick={()=>setModal('project')}><Plus size={17}/> Start a project</button>}</div>
    {role==='Client'?<ClientOverview projects={projects} tasks={allVisibleTasks} setActiveProject={setActiveProject} setView={switchView} setModal={setModal}/>:role==='Employee'?<EmployeeOverview invites={invites} inviteAction={inviteAction} tasks={myTasks} setView={switchView} setSelectedTask={setSelectedTask} authUser={authUser}/>:<>
     <div className="stats-grid"><Stat icon={FolderKanban} tint="violet" label="Active projects" onClick={()=>switchView('Projects')} value={String(projects.filter(p=>p.teamSetupStatus==='Approved'&&!p.completedAt&&p.cancellationStatus!=='Cancelled').length).padStart(2,'0')} trend="Approved for delivery"/><Stat icon={Users} tint="blue" label="Team members" onClick={()=>switchView('People & teams')} value={String(apiPeople.filter(person=>person.role==='employee').length).padStart(2,'0')} trend="Active employee accounts"/><Stat icon={ShieldCheck} tint="amber" label="Needs your review" onClick={()=>switchView('Approvals')} value={String(projects.filter(p=>p.teamSetupStatus==='Pending admin approval').length+cancellationRequests.length+contractFiles.filter(c=>['pending_admin_review','amendment_requested'].includes(c.status)).length).padStart(2,'0')} trend="Projects, contracts, cancellations" alert/><Stat icon={Activity} tint="mint" label="Tasks completed" onClick={()=>switchView('Task queue')} value={String((authUser?tasks.filter(task=>task.serverId):tasks).filter(task=>task.status==='Done').length).padStart(2,'0')} trend="Across loaded projects"/></div>
     <div className="overview-grid"><div className="panel projects-panel"><div className="panel-heading"><div><h2>Active projects</h2><p>Keep every client delivery moving.</p></div><button className="text-button" onClick={()=>switchView('Projects')}>All projects <ArrowRight size={15}/></button></div><div className="project-table"><div className="table-head"><span>PROJECT</span><span>OWNER</span><span>STAGE</span><span>PROGRESS</span><span>HEALTH</span><span/></div>{projects.map(p=><button className="project-row" key={p.id} onClick={()=>{setActiveProject(p.id);switchView('Project workspace')}}><span className="project-cell"><i className={`project-glyph ${p.color}`}><FolderKanban size={16}/></i><span><b>{p.name}</b><small>{p.client}</small></span></span><span className="owner-cell"><Avatar id={p.ownerUserId||p.owner} name={p.owner} size="mini-avatar"/> {p.owner}</span><span><span className={`stage-badge ${p.stage.toLowerCase().replaceAll(' ','-')}`}>{p.stage}</span></span><span className="progress-cell"><div className="progress-value">{p.progress}%</div><Progress value={p.progress}/></span><span><i className="health-dot"/> {p.health}</span><MoreHorizontal size={18} className="row-more"/></button>)}</div>{canStartProject&&<button className="new-project-row" onClick={()=>setModal('project')}><Plus size={16}/> Create a new project</button>}</div>
      <div className="right-column"><div className="panel attention-panel"><div className="panel-heading"><div><h2>Needs attention <span className="count-bubble">3</span></h2><p>Keep approvals and reviews moving.</p></div><button className="icon-plain" title="Open reports" onClick={()=>switchView('Reports')}><MoreHorizontal size={18}/></button></div><AttentionItems projects={projects} contracts={contractFiles} cancellationRequests={cancellationRequests} onNavigate={switchView} live={!!authUser}/> <button className="attention-footer" onClick={()=>switchView('Approvals')}>Review all requests <ArrowRight size={14}/></button></div>
      <div className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>The latest across your workspace.</p></div><button className="icon-plain" title="View activity report" onClick={()=>switchView('Reports')}><MoreHorizontal size={18}/></button></div><ActivityFeed authUser={authUser}/></div></div></div>
    </>}</>}
    {view==='Project workspace'&&project&&<ProjectWorkspace key={project.id} project={project} role={role} authUser={authUser} apiPeople={apiPeople} saveRating={saveEmployeeRating} openProfile={setSelectedProfile} changeProjectCompletion={changeProjectCompletion} changeTaskStatus={changeTaskStatus} saveTaskPosition={saveTaskPosition} saveTaskWorkflow={saveTaskWorkflow} removeTeamMember={removeTeamMember} projectContracts={contractFiles.filter(contract=>String(contract.project_id)===String(project.serverId))} tasks={allVisibleTasks} workflowTasks={tasks.filter(task=>task.project===activeProject)} teamGroups={workspaceTeams??teamGroups} setView={switchView} setModal={setModal} setSelectedTask={setSelectedTask} notify={notify}/>}
    {view==='Projects'||view==='My projects'?<ProjectsPage role={role} canStartProject={canStartProject} projects={projects} setActiveProject={setActiveProject} setView={switchView} setModal={setModal}/>:null}
    {view==='Approvals'&&<Approvals projects={projects} projectTeams={projectTeams} markApproved={markApproved} onApproved={row=>setApiProjects(old=>old.map(project=>project.id===row.id?{...project,...row}:project))} notify={notify} cancellationRequests={cancellationRequests} reviewCancellation={reviewCancellation} contracts={contractFiles} reviewContract={reviewContract} live={!!authUser}/>}
    {view==='Team review'&&<TeamReview projects={projects} projectTeams={projectTeams} reviewTeam={reviewTeam} authUser={authUser} apiPeople={apiPeople} role={role} notify={notify} refreshTeams={(id,rows)=>setProjectTeams(old=>({...old,[id]:rows}))}/>}
    {view==='Team review'&&role==='Employee'&&authUser&&!authUser.tags?.some(tag=>['scrum_master','product_owner'].includes(tag))&&<EmptyState icon={LockKeyhole} title="Team review access required" text="A scrum master or project owner tag is needed to review team proposals."/>}
    {view==='Invitations'&&authUser?.role==='employee'&&<RosterInvitations notify={notify}/>}
    {view==='Teams'&&authUser?.role==='employee'&&authUser.tags?.includes('scrum_master')&&<ScrumTeams picker={UserSearchPicker} notify={notify}/>}
    {view==='Invitations'&&<EmployeeOverview invites={invites} inviteAction={inviteAction} tasks={myTasks} setView={switchView} authUser={authUser}/>}
    {view==='Task queue'||view==='My tasks'?<TaskQueue key={activeProject??"none"} project={activeProject===null?undefined:project} projects={projects} setActiveProject={setActiveProject} apiPeople={apiPeople} authUser={authUser} projectTeams={projectTeams} tasks={allVisibleTasks} setSelectedTask={setSelectedTask} setModal={setModal} role={role} setTasks={setTasks} notify={notify}/>:null}
    {view==='Contracts'&&<Contracts projects={projects} contracts={contractFiles} setModal={setModal} notify={notify} role={role} authUser={authUser} live={!!authUser} reviewContract={reviewContract} signContract={signContract} requestAmendment={requestAmendment} openContract={async id=>{const token=localStorage.getItem('stride_token');if(!token){notify('Sign in to open this contract');return}try{const response=await fetch(`/api/contracts/${id}/file`,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw new Error('Contract preview is unavailable');const blob=await response.blob();window.open(URL.createObjectURL(blob),'_blank','noopener');}catch(error){notify(error.message)}}}/>}
    {view==='People & teams'&&!authUser&&<EmptyState icon={LockKeyhole} title="Administrator sign-in required" text="Sign in to manage accounts, role tags, access, and project reviews."/>}{view==='People & teams'&&authUser?.role==='admin'&&<><AccountCounts/><PeoplePage setView={switchView} notify={notify}/><AdminExperienceControls notify={notify}/></>}
    {view==='People directory'&&<PeopleDirectory role={role} query={query} apiPeople={apiPeople} openProfile={setSelectedProfile}/>}
    {view==='Client requests'&&authUser?.role==='admin'&&<AdminRequests notify={notify} openProject={id=>navigateNotification(`/projects/${id}`)}/>}
    {view==='Client requests'&&(role==='Client'||role==='Employee'&&(!authUser||authUser.tags?.includes('product_owner')))&&<ClientRequests projects={projects} setProjects={setProjects} setActiveProject={setActiveProject} setModal={setModal} role={role} authUser={authUser} apiRequests={apiRequests} onRemoteComment={addRemoteRequestComment} onRemoteAccept={acceptRemoteRequest} notify={notify}/>}
    {view==='Client requests'&&role==='Employee'&&authUser&&!authUser.tags?.includes('product_owner')&&<EmptyState icon={LockKeyhole} title="Product owner access required" text="Only employees tagged as product owners can respond to client requests. Contact an admin to request this tag."/>}
    {view==='Reports'&&<Reports projects={projects} tasks={tasks}/>}
    {view==='Messages'&&(authUser?<Messages key={authUser.id} authUser={authUser} notify={notify}/>:<div className="panel settings-content guest-messages"><EmptyState icon={LockKeyhole} title="Sign in to use the message center" text="Sign in to find workspace members and contact support."/><button className="primary-button" onClick={()=>setModal('login')}>Sign in</button></div>)}
    {view==='My growth'&&<Growth authUser={authUser} tasks={myTasks}/>}
    {view==='Settings'&&<SettingsPage key={authUser?.id??"guest"} role={role} authUser={authUser} onSignIn={()=>setModal("login")} onSave={user=>{setAuthUser(user);localStorage.setItem("stride_user",JSON.stringify(user))}}/>}
   </div>
  </main>
  {modal==='login'&&<LoginModal close={()=>setModal('')} authUser={authUser} onSettings={()=>{setModal("");switchView("Settings")}} onLogin={u=>{setAuthUser(u);localStorage.setItem('stride_user',JSON.stringify(u));setRole({admin:'Admin',employee:'Employee',client:'Client'}[u.role]||'Employee');setModal('');switchView('Overview');notify(`Signed in as ${u.name}`)}} onLogout={()=>{localStorage.removeItem('stride_token');localStorage.removeItem('stride_user');setAuthUser(null);setRole('Admin');setModal('');notify('Signed out · preview mode')}}/>}
  {modal&&modal!=='login'&&<Modal role={role} authUser={authUser} type={modal} apiPeople={apiPeople} projectTeams={projectTeams[activeProject]||[]} projectList={projects} setActiveProject={setActiveProject} postProjectRequest={postProjectRequest} uploadContract={uploadContract} saveProjectTeams={saveProjectTeams} close={()=>setModal('')} addTask={addTask} createProject={createProject} updateProjectSteps={updateProjectSteps} cancelProject={cancelProject} activeProject={project} notify={notify}/>}
  {selectedProfile&&<EmployeeProfile role={role} authUser={authUser} apiPeople={apiPeople} apiProjects={apiProjects} id={selectedProfile} close={()=>setSelectedProfile(null)} onContact={()=>switchView('Messages')} saveProfile={saveEmployeeProfile} notify={notify}/>}
   {selectedTask&&<TaskDetail task={selectedTask} close={()=>setSelectedTask(null)} setTasks={setTasks} tasks={tasks} notify={notify} changeStatus={changeTaskStatus} updateTask={updateTask} canEdit={authUser?.role==='admin'||authUser?.role==='employee'&&(authUser.tags?.some(tag=>['product_owner','scrum_master'].includes(tag))||String(selectedTask.assignee)===String(authUser.id))}/>}
  {notice&&<div className="toast"><span><Check size={15}/></span><b>{notice}</b></div>}
 </div>
}

function NotificationCenter({onNavigate,authUser}){const seed=[{id:'n1',kind:'security',title:'New sign-in to your account',body:'A sign-in was detected from Chrome · Copenhagen',created_at:new Date(Date.now()-6*60000).toISOString(),read:false,target:'Settings'},{id:'n2',kind:'message',title:'Maya Kim sent you a message',body:'The latest design pass is ready for your review.',created_at:new Date(Date.now()-35*60000).toISOString(),read:false,target:'Messages'},{id:'n3',kind:'project',title:'Team invitation received',body:'You were invited to the Website redesign project.',created_at:new Date(Date.now()-3*3600000).toISOString(),read:false,target:'Invitations'},{id:'n4',kind:'security',title:'Account status notice',body:'Your account security and access settings are up to date.',created_at:new Date(Date.now()-86400000).toISOString(),read:true,target:'Settings'}];const [open,setOpen]=useState(false);const [items,setItems]=useState(seed);useEffect(()=>{
 const token=localStorage.getItem('stride_token');
 if(!authUser||!token){setItems(seed);return}
 let cancelled=false;
 async function refresh(){
  try{
   const response=await fetch('/api/notifications',{headers:{Authorization:`Bearer ${token}`}});
   if(response.ok){
    const rows=await response.json();
    if(!cancelled)setItems(rows);
   }
  }catch{}
 }
 refresh();
 const timer=setInterval(refresh,15000);
 return()=>{cancelled=true;clearInterval(timer)};
},[authUser,open]);const unread=items.filter(n=>!n.read).length;const openItem=n=>{setItems(old=>old.map(x=>x.id===n.id?{...x,read:true}:x));if(localStorage.getItem('stride_token'))fetch('/api/notifications/read',{method:'PATCH',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},body:JSON.stringify({ids:[n.id]})}).catch(()=>{});setOpen(false);onNavigate(n.target==='Messages'||n.target?.startsWith('/messages')?'Messages':n.target==='Invitations'||n.target==='/invitations'?'Invitations':n.target==='/project-requests'?'Client requests':n.target==='/roster-teams'?'Teams':n.target?.match(/^\/projects\/\d+$/)?n.target:n.target==='Projects'||n.target?.startsWith('/projects')?'Projects':n.target?.includes('admin')?'Approvals':'Settings')};const markAll=()=>{setItems(old=>old.map(n=>({...n,read:true})));const token=localStorage.getItem('stride_token');if(token)fetch('/api/notifications/read',{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({all:true})}).catch(()=>{})};return <div className="notification-wrap"><button className="icon-square notification" aria-label="Notifications" aria-expanded={open} onClick={()=>setOpen(!open)}><Bell size={18}/>{unread>0&&<i/>}</button>{open&&<div className="notification-popover"><div className="notification-head"><div><b>Notifications</b><small>{unread?`${unread} unread updates`:'You’re all caught up'}</small></div><button onClick={markAll} disabled={!unread}>Mark all read</button></div><div className="notification-items">{items.length?items.map(n=><button key={n.id} className={`notification-item ${n.read?'read':''}`} onClick={()=>openItem(n)}><span className={`notification-icon ${n.kind}`}><NotificationGlyph kind={n.kind}/></span><span className="notification-text"><b>{n.title}</b><small>{n.body}</small><time>{timeAgo(n.created_at)}</time></span>{!n.read&&<i className="unread-dot"/>}</button>):<div className="notification-empty">No notifications yet.</div>}</div><button className="notification-footer" onClick={()=>{setOpen(false);onNavigate('Messages')}}>Open message center <ArrowRight size={14}/></button></div>}</div>}
function NotificationGlyph({kind}){return kind==='message'?<MessageSquareText size={16}/>:kind==='security'?<ShieldCheck size={16}/>:kind==='task'?<ListTodo size={16}/>:<BriefcaseBusiness size={16}/>}
function timeAgo(value){const minutes=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));return minutes<1?'Just now':minutes<60?`${minutes}m ago`:minutes<1440?`${Math.floor(minutes/60)}h ago`:`${Math.floor(minutes/1440)}d ago`}
function Stat({icon:Icon,tint,label,value,trend,alert,onClick}){const Card=onClick?'button':'div';return <Card className="stat-card" type={onClick?'button':undefined} onClick={onClick}><div className={`stat-icon ${tint}`}><Icon size={18}/></div><div className="stat-label">{label}{alert&&<span className="stat-alert">Needs action</span>}</div><div className="stat-value">{value}</div><div className="stat-trend">{trend}</div></Card>}
function ActivityItem({person,action,subject,time}){return <div className="activity-item"><Avatar id={person}/><div><p><b>{people[person].name.split(' ')[0]}</b> {action} <b>{subject}</b></p><small>{time}</small></div></div>}
function ActivityFeed({authUser,projectId}) {
 const [items,setItems]=useState([]);
 const [loading,setLoading]=useState(Boolean(authUser));
 const [error,setError]=useState('');
 const [page,setPage]=useState(1);
 const pageSize=8;
 const pageCount=Math.max(1,Math.ceil(items.length/pageSize));
 useEffect(()=>{
  if(!authUser){setItems([]);setLoading(false);setError('');return}
  const controller=new AbortController();
  async function refresh(){
   try{
    const rows=await workspaceRequest('/notifications?limit=100',{signal:controller.signal});
    const target=projectId?`/projects/${projectId}`:null;
    setItems(rows.filter(row=>['project','task','contract'].includes(row.kind)&&(!target||row.target===target||row.target.startsWith(`${target}/`))));
    setError('');
   }catch(requestError){if(!controller.signal.aborted)setError(requestError.message)}
   finally{if(!controller.signal.aborted)setLoading(false)}
  }
  refresh();
  const timer=setInterval(refresh,20000);
  window.addEventListener('focus',refresh);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',refresh)};
 },[authUser?.id,projectId]);
 if(loading&&!items.length)return <p className="activity-empty">Loading project activity…</p>;
 if(error&&!items.length)return <p className="auth-error" role="alert">{error}</p>;
 if(!items.length)return <p className="activity-empty">{authUser?'No recorded activity yet.':'Sign in to see saved workspace activity.'}</p>;
 const iconFor=item=>item.kind==='contract'?FileText:item.kind==='task'?CheckCheck:item.kind==='project'?BriefcaseBusiness:Activity;
 return <><div className="activity-feed">{items.slice((page-1)*pageSize,page*pageSize).map(item=>{const Icon=iconFor(item);return <article className="activity-feed-item" key={item.id}>
  <span className={`activity-icon activity-icon-${item.kind}`}><Icon size={16}/></span><div><b>{item.title}</b><p>{item.body}</p><small><Clock3 size={12}/>{timeAgo(item.created_at)}</small></div>
 </article>})}</div><nav className="activity-pagination" aria-label="Activity pages"><button className="secondary-button" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Newer</button><span>Page {page} of {pageCount} · {items.length} events</span><button className="secondary-button" disabled={page>=pageCount} onClick={()=>setPage(value=>value+1)}>Older</button></nav></>;
}
function ClientOverview({projects,tasks=[],setActiveProject,setView,setModal}){const progress=projects.length?Math.round(projects.reduce((sum,project)=>sum+(project.progress||0),0)/projects.length):0;const nextProject=projects.filter(project=>project.due&&project.due!=='TBD').sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];const completed=tasks.filter(task=>task.status==='Done').length;return <><div className="stats-grid client-stats"><Stat icon={FolderKanban} tint="violet" label="Your projects" onClick={()=>setView('My projects')} value={String(projects.length).padStart(2,'0')} trend="All your work, in one place"/><Stat icon={Activity} tint="mint" label="Overall progress" onClick={()=>setView('My projects')} value={`${progress}%`} trend="Across your projects"/><Stat icon={CalendarDays} tint="blue" label="Next milestone" onClick={()=>{if(nextProject){setActiveProject(nextProject.id);setView('Project workspace')}else setView('My projects')}} value={nextProject?.due||'—'} trend={nextProject?.name||'No scheduled milestone'}/><Stat icon={MessageSquareText} tint="amber" label="Tasks completed" onClick={()=>setView('My projects')} value={String(completed).padStart(2,'0')} trend="Across your active project"/></div><div className="client-welcome"><div className="client-welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-star">✳</div></div><div><span className="eyebrow">YOUR PROJECTS, AT A GLANCE</span><h2>Good work is taking shape.</h2><p>Follow each milestone, share feedback with your team, and know exactly what’s happening next.</p></div><button className="text-button" onClick={()=>setView('My projects')}>Explore projects <ArrowRight size={15}/></button></div><ProjectsPage role="Client" projects={projects} setActiveProject={setActiveProject} setView={setView} setModal={setModal}/></>}
function EmployeeOverview({invites,inviteAction,tasks,setView,setSelectedTask,authUser}){const done=tasks.filter(task=>task.status==='Done').length;const active=tasks.filter(task=>task.status==='In progress').length;const level=authUser?.level||4;return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> TEAM MEMBER PORTAL</div><h1>Your work, in one place.</h1><p className="lead">Pick up where you left off and keep good work moving.</p></div><button className="secondary-button" onClick={()=>setView('My growth')}><Zap size={16}/> Level {level} · Contributor</button></div><div className="stats-grid"><Stat icon={ListTodo} tint="violet" label="Tasks in progress" onClick={()=>setView('My tasks')} value={String(active).padStart(2,'0')} trend="One active task at a time"/><Stat icon={CheckCheck} tint="mint" label="Tasks completed" onClick={()=>setView('My tasks')} value={String(done).padStart(2,'0')} trend="Across your assigned work"/><Stat icon={Zap} tint="amber" label="Contributor level" onClick={()=>setView('My growth')} value={String(level).padStart(2,'0')} trend="Based on completed work"/><Stat icon={BriefcaseBusiness} tint="blue" label="Project invitations" onClick={()=>setView('Invitations')} value={String(invites.length).padStart(2,'0')} trend="Review your open invitations"/></div><div className="employee-grid"><div className="panel invite-panel"><div className="panel-heading"><div><h2>Project invitations <span className="count-bubble">{invites.length}</span></h2><p>Review the teams that would like you on board.</p></div></div>{invites.length?invites.map(i=><div className="invite-card" key={i.id}><div className="invite-project-mark"><FolderKanban size={18}/></div><div className="invite-copy"><b>{i.project}</b><small>{i.team} team · invited by {i.owner}</small><span><span className="role-chip">{i.role}</span><span><CalendarDays size={13}/> Respond by {i.due}</span></span></div><div className="invite-actions"><button className="decline-button" onClick={()=>inviteAction(i.id,false)}>Decline</button><button className="accept-button" onClick={()=>inviteAction(i.id,true)}><Check size={14}/> Accept</button></div></div>):<EmptyState icon={CheckCheck} title="All caught up" text="There are no pending project invitations."/>}</div><div className="panel task-focus"><div className="panel-heading"><div><h2>Pick up where you left off</h2><p>Your current focus task.</p></div></div><TaskCard task={tasks.find(t=>t.status==='In progress')||tasks[0]} onClick={setSelectedTask}/><button className="attention-footer" onClick={()=>setView('My tasks')}>See all my tasks <ArrowRight size={14}/></button></div></div></>}
function ProjectsPage({role,canStartProject,projects,setActiveProject,setView,setModal}){return <div className="projects-page"><div className="panel-heading page-section-heading"><div><h2>{role==='Client'?'Project overview':'All projects'}</h2><p>{role==='Client'?'Your delivery plan, shared with your team.':"Your team's client work and delivery status."}</p></div>{canStartProject&&<button className="primary-button small-button" onClick={()=>setModal('project')}><Plus size={15}/> New project</button>}</div><div className="project-cards">{projects.map(p=><button className="project-card" key={p.id} onClick={()=>{setActiveProject(p.id);setView('Project workspace')}}><div className="project-card-top"><span className={`project-glyph ${p.color}`}><FolderKanban size={17}/></span><span className="stage-badge">{projectStatus(p)||p.stage}</span></div><h3>{p.name}</h3><p>{p.description}</p><div className="project-card-client"><span>CLIENT</span><b>{p.client}</b></div><div className="project-card-progress"><div><span>Project progress</span><b>{p.progress}%</b></div><Progress value={p.progress}/></div><div className="project-card-foot"><div className="avatar-cluster"><Avatar id="MK" size="mini-avatar"/><Avatar id="AL" size="mini-avatar"/><Avatar id="SR" size="mini-avatar"/><span className="avatar extra-avatar">+2</span></div><span><CalendarDays size={13}/> {p.due}</span></div></button>)}</div>{role==='Client'&&<button className="client-contact" onClick={()=>setView('Messages')}><MessageSquareText size={17}/><span><b>Have a question about a project?</b><small>Your project owner is here to help.</small></span><ArrowRight size={16}/></button>}</div>}
function projectStatus(project) {
 if(project.cancellationStatus==='Cancelled')return 'Cancelled';
 if(project.completedAt)return 'Completed';
 if(project.completionDueAt)return 'Awaiting client confirmation';
 return null;
}
function ProjectCompletionControls({project,authUser,onChange}) {
 const [busy,setBusy]=useState(false);
 if(!project.serverId)return null;
 const client=authUser?.role==='client'&&authUser.id===project.clientUserId;
 const owner=authUser?.role==='employee'&&authUser.id===project.ownerUserId;
 const canManage=client||owner||authUser?.role==='admin';
 const admin=authUser?.role==='admin';
 const status=projectStatus(project);
 const pending=Boolean(project.completionDueAt&&!project.completedAt);
 const canComplete=canManage&&!project.completedAt&&(admin|| (client?pending:!pending));
 async function update(action){
  setBusy(true);
  try { await onChange(project,action); }
  finally { setBusy(false); }
 }
 return <section className="panel project-completion" aria-label="Project status">
  <div><b>{status||'Open'}</b>
   {pending&&status!=='Cancelled'&&<small>Automatic completion on {new Date(project.completionDueAt).toLocaleDateString(undefined,{dateStyle:'medium'})} if the client has not confirmed.</small>}
  </div>
  {canManage&&<div className="completion-actions">
   {canComplete&&status!=='Cancelled'&&<button className="primary-button" disabled={busy} onClick={()=>update('complete')}><Check size={16}/>{client?'Confirm completion':'Mark as completed'}</button>}
   {admin&&status!=='Cancelled'&&<button className="decline-button" disabled={busy} onClick={()=>update('cancel')}>Cancel project</button>}
   {(pending||project.completedAt||status==='Cancelled')&&<button className="secondary-button" disabled={busy} onClick={()=>update('reopen')}>Reopen project</button>}
  </div>}
 </section>;
}
function ProjectReviews({project,role,authUser,apiPeople,saveRating,notify}) {
 const [teams,setTeams]=useState([]);
 const [reviews,setReviews]=useState([]);
 const [drafts,setDrafts]=useState({});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!project.serverId||!authUser||!project.completedAt){setLoading(false);return}
  const controller=new AbortController();
  Promise.all([
   workspaceRequest(`/projects/${project.serverId}/teams`,{signal:controller.signal}),
   workspaceRequest(`/projects/${project.serverId}/reviews`,{signal:controller.signal})
  ]).then(([teamRows,reviewRows])=>{
   setTeams(teamRows);setReviews(reviewRows);setError('');
  }).catch(requestError=>{if(!controller.signal.aborted)setError(requestError.message)})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[project.serverId,project.completedAt,authUser?.id]);
 if(!project.serverId||!project.completedAt||!authUser||authUser.role==='admin')return null;
 const targets=[];
 if(authUser.role==='client'&&String(authUser.id)===String(project.clientUserId)){
  targets.push({id:project.ownerUserId,name:apiPeople.find(person=>String(person.id)===String(project.ownerUserId))?.name||project.owner||'Project owner',role:'Product owner'});
 }
 if(authUser.role==='employee'&&String(authUser.id)===String(project.ownerUserId)&&authUser.tags?.includes('product_owner')){
  for(const team of teams){
   const person=apiPeople.find(item=>String(item.id)===String(team.scrum_master_id));
   targets.push({id:team.scrum_master_id,name:person?.name||team.members.find(member=>member.user_id===team.scrum_master_id)?.name||`Employee #${team.scrum_master_id}`,role:`Scrum master · ${team.name}`});
  }
 }
 if(authUser.role==='employee'&&authUser.tags?.includes('scrum_master')){
  for(const team of teams.filter(item=>String(item.scrum_master_id)===String(authUser.id))){
   for(const member of team.members.filter(item=>item.status==='accepted'&&!item.is_scrum_master)){
    const person=apiPeople.find(item=>String(item.id)===String(member.user_id));
    targets.push({id:member.user_id,name:person?.name||member.name,role:`Team member · ${team.name}`});
   }
  }
 }
 const uniqueTargets=[...new Map(targets.filter(target=>String(target.id)!==String(authUser.id)).map(target=>[String(target.id),target])).values()];
 async function submit(target){
  const draft=drafts[target.id]||{};
  if(!draft.rating){notify('Choose a star rating before submitting');return}
  setBusy(target.id);setError('');
  try{
   const result=await saveRating(target.id,draft.rating,project.serverId,'Overall',draft.comment||'');
   setReviews(old=>[result,...old.filter(item=>!(String(item.employee_id)===String(target.id)&&String(item.reviewer_id)===String(authUser.id)))]);
   notify(`Review saved for ${target.name}`);
  }catch(requestError){setError(requestError.message)}
  finally{setBusy(null)}
 }
 return <section className="panel project-reviews-panel">
  <div className="panel-heading"><div><h2>Project reviews</h2><p>{authUser.role==='client'?'Rate the product owner after confirming project completion.':authUser.tags?.includes('product_owner')?'Rate the scrum masters on your completed project.':'Rate the team members in your completed project teams.'}</p></div><span className="stage-badge">Completed</span></div>
  {loading&&<p>Loading review options…</p>}
  {error&&<p className="auth-error" role="alert">{error}</p>}
  {!loading&&!uniqueTargets.length&&!error&&<p className="team-summary-empty">There are no eligible teammates to review for this completed project.</p>}
  {uniqueTargets.map(target=>{
   const existing=reviews.find(item=>String(item.employee_id)===String(target.id)&&String(item.reviewer_id)===String(authUser.id));
   const draft=drafts[target.id]||{rating:existing?.rating||0,comment:existing?.comment||''};
   return <article className="project-review-target" key={target.id}>
    <div className="project-review-person"><Avatar id={target.id} name={target.name} image={apiPeople.find(person=>String(person.id)===String(target.id))?.profile_photo_url} size="mini-avatar"/><span><b>{target.name}</b><small>{target.role}</small></span></div>
    <div className="project-review-rating" aria-label={`Rate ${target.name} out of five stars`}>{[1,2,3,4,5].map(value=><button type="button" key={value} aria-label={`${value} stars`} className={draft.rating>=value?'rated':''} onClick={()=>setDrafts(old=>({...old,[target.id]:{...draft,rating:value}}))}>★</button>)}</div>
    <label className="project-review-comment"><span>Optional feedback</span><textarea rows="2" value={draft.comment} onChange={event=>setDrafts(old=>({...old,[target.id]:{...draft,comment:event.target.value}}))} maxLength={2000}/></label>
    <button className="primary-button" disabled={busy!==null||!draft.rating} onClick={()=>submit(target)}>{busy===target.id?'Saving…':existing?'Update review':'Submit review'}</button>
   </article>;
  })}
 </section>;
}
function roadmapStageMetrics(step,tasks) {
 const stageTasks=tasks.filter(task=>step.id!=null
  ?String(task.projectStepId)===String(step.id)
  :String(task.projectStepName||task.stage||'').toLowerCase()===step.name.toLowerCase());
 const completed=stageTasks.filter(task=>task.status==='Done').length;
 const active=stageTasks.filter(task=>task.status==='In progress'||task.status==='In review').length;
 const progress=stageTasks.length
  ?Math.round(stageTasks.reduce((sum,task)=>sum+(task.status==='Done'?1:(task.status==='In progress'||task.status==='In review'?0.5:0)),0)/stageTasks.length*100)
  :Math.round(step.progress||0);
 const status=stageTasks.length
  ?completed===stageTasks.length?'done':active||completed?'in_progress':'todo'
  :step.status||((step.progress||0)>=100?'done':(step.progress||0)>0?'in_progress':'todo');
 return {stageTasks,completed,progress,status};
}
function ProjectWorkspace({project,role,authUser,apiPeople,saveRating,openProfile,notify,tasks,workflowTasks=tasks,teamGroups,setView,setModal,setSelectedTask,changeProjectCompletion,changeTaskStatus,saveTaskPosition,saveTaskWorkflow,removeTeamMember,projectContracts=[]}){
 const [tab,setTab]=useState('Overview');
 const [sprintRevision,setSprintRevision]=useState(0);
 const steps=(project.steps?.length?project.steps:defaultProjectSteps).map(step=>typeof step==='string'?step:step.name);
 const currentIndex=Math.max(0,steps.findIndex(step=>step===project.stage));
 const canEditSteps=authUser?.role==='admin'||authUser?.role==='employee'&&authUser.id===project.ownerUserId&&authUser.tags?.includes('product_owner');
 useEffect(()=>{if(role==='Client')setTab('Overview')},[role]);
 const scrumMasterName=id=>apiPeople.find(person=>String(person.id)===String(id))?.name||people[id]?.name||'Unassigned';
 return <>
  <div className="workspace-title-row"><div><div className="eyebrow"><span className={`project-dot ${project.color}`}/> PROJECT WORKSPACE <span className="eyebrow-sep">/</span> {project.name.toUpperCase()}</div><h1>{project.name}</h1><p className="lead">{project.description}</p></div>
   <div className="heading-actions">
    {project.serverId&&project.teamSetupStatus==='Not started'&&(authUser?.role==='admin'||authUser?.id===project.ownerUserId&&authUser.tags?.includes('product_owner'))&&<button className="secondary-button" onClick={()=>setModal('teams')}><Users size={15}/> Select project teams</button>}
    {canEditSteps&&<button className="secondary-button" onClick={()=>setModal('steps')}><Settings2 size={15}/> Edit steps</button>}
    <button className="secondary-button" onClick={()=>setView('Contracts')}><FileText size={16}/> Contract</button>
    {role==='Client'&&project.cancellationStatus!=='Pending admin review'&&<button className="secondary-button" onClick={()=>setModal('cancel')}><X size={15}/> Request cancellation</button>}
    {role==='Client'&&project.cancellationStatus==='Pending admin review'&&<span className="cancel-request-badge">Cancellation under review</span>}
    {role!=='Client'&&<button className="primary-button" onClick={()=>setModal('task')}><Plus size={16}/> Add task</button>}
   </div>
  </div>
  <ProjectCompletionControls project={project} authUser={authUser} onChange={changeProjectCompletion}/>
  <ProjectReviews project={project} role={role} authUser={authUser} apiPeople={apiPeople} saveRating={saveRating} notify={notify}/>
  <div className="project-snapshot">
   <div className="snapshot-overview"><div className="snapshot-label">PROJECT PROGRESS <b>{project.progress}%</b></div><Progress value={project.progress}/><div className="snapshot-stage"><span>Current phase</span><b>{project.stage}</b></div></div>
   <div className="snapshot-divider"/>
   <div className="snapshot-milestones"><span className="snapshot-label">DELIVERY ROADMAP</span><div className="milestone-steps">{(project.steps?.length?project.steps:defaultProjectSteps).map((step,index)=>{const stage=typeof step==='string'?{name:step}:step;const metrics=roadmapStageMetrics(stage,workflowTasks);const circumference=2*Math.PI*15;return <div className={`milestone ${stage.name===project.stage?'current':''}`} key={stage.id||stage.name}><span className={`roadmap-progress ${metrics.status}`} role="img" aria-label={`${stage.name}: ${metrics.progress}% complete, ${metrics.status==='done'?'done':metrics.status==='in_progress'?'in progress':'to do'}`}><svg viewBox="0 0 40 40" aria-hidden="true"><circle className="roadmap-progress-track" cx="20" cy="20" r="15"/><circle className="roadmap-progress-value" cx="20" cy="20" r="15" strokeDasharray={circumference} strokeDashoffset={circumference*(1-metrics.progress/100)}/><text x="20" y="20">{index+1}</text></svg></span><b>{stage.name}</b></div>})}</div></div>
   <div className="snapshot-divider"/>
   <div className="snapshot-owner"><span className="snapshot-label">PROJECT OWNER</span><div><Avatar id={project.ownerUserId||'JD'} name={apiPeople.find(person=>String(person.id)===String(project.ownerUserId))?.name||project.owner}/><span><b>{apiPeople.find(person=>String(person.id)===String(project.ownerUserId))?.name||project.owner||'Project owner'}</b><small>Project owner</small></span></div></div>
  </div>
  <RoadmapControls project={project} authUser={authUser} tasks={workflowTasks} notify={notify}/>
  <div className="workspace-tabs">{(role==='Client'?['Overview','Charts','Activity']:['Overview','Task board','Teams','Charts','Activity']).map(item=><button className={tab===item?'selected':''} key={item} onClick={()=>setTab(item)}>{item}{item==='Task board'&&<span>{tasks.length}</span>}</button>)}</div>
  {tab==='Overview'&&<div className="workspace-overview">
   <div className="panel phase-panel"><div className="panel-heading"><div><h2>Delivery phases</h2><p>Shared progress, from first sketch to launch.</p></div><span className="client-visible"><span/> Client visible</span></div>
    {steps.map((step,index)=><div className={`phase-row ${step===project.stage?'phase-current':''}`} key={step}><span className={`phase-number ${index<currentIndex?'finished':''}`}>{index<currentIndex?<Check size={14}/>:`0${index+1}`}</span><div className="phase-copy"><b>{step}</b><small>{(project.steps?.[index]?.description||defaultProjectSteps.find(item=>item.name===step)?.description||'Project delivery milestone.')}</small></div><span className={`phase-status ${step===project.stage?'in-progress-phase':index<currentIndex?'done-phase':''}`}>{step===project.stage?'In progress':index<currentIndex?'Completed':'Up next'}</span><span className="phase-percent">{index<currentIndex?'100%':step===project.stage?`${project.progress}%`:'—'}</span></div>)}
   </div>
   <div className="workspace-side"><div className="panel team-summary"><div className="panel-heading"><div><h2>Project teams</h2><p>One scrum master for every team.</p></div><button className="text-button" onClick={()=>setTab('Teams')}>View all</button></div>
    {teamGroups.length?teamGroups.slice(0,3).map(group=><button type="button" className="team-summary-row team-summary-button" key={group.name} onClick={()=>setTab('Teams')}><span className={`team-mark ${group.color}`}><Users size={15}/></span><span><b>{group.name}</b><small>{group.members.length} members · Scrum master {scrumMasterName(group.lead)}</small></span><span className="team-live"><i/>Active</span></button>):<p className="team-summary-empty">No project teams have been added yet.</p>}
   </div><div className="panel contract-summary"><div className="contract-icon"><FileText size={17}/></div><div><b>Project contract</b><small>{project.contract}</small></div><button className="icon-plain" onClick={()=>setView('Contracts')}><ArrowRight size={16}/></button></div></div>
  </div>}
  {tab==='Task board'&&<><SprintLifecyclePanel key={`${project.id}-${sprintRevision}`} project={project} authUser={authUser} contractSigned={projectContracts.some(contract=>['signed','approved_pending_signatures'].includes(contract.status))} notify={notify} onChanged={()=>setSprintRevision(value=>value+1)}/><Board key={`${project.id}-${sprintRevision}`} project={project} contractSigned={projectContracts.some(contract=>['signed','approved_pending_signatures'].includes(contract.status))} tasks={workflowTasks} changeTaskStatus={changeTaskStatus} saveTaskPosition={saveTaskPosition} saveTaskWorkflow={saveTaskWorkflow} projectSteps={project.steps||[]} setSelectedTask={setSelectedTask} setModal={setModal} notify={notify} onSprintChanged={()=>setSprintRevision(value=>value+1)}/></>}
  {tab==='Teams'&&<TeamsView groups={teamGroups} apiPeople={apiPeople} authUser={authUser} openProfile={openProfile} onRemove={removeTeamMember}/>}
  {tab==='Charts'&&<><ProjectCharts project={project} tasks={workflowTasks} apiPeople={apiPeople} readOnly={role==='Client'}/><ProjectContributionChart tasks={workflowTasks} apiPeople={apiPeople}/></>}
  {tab==='Activity'&&<div className="panel activity-panel"><ActivityFeed authUser={authUser} projectId={project.serverId}/></div>}
 </>;
}
function RoadmapControls({project,authUser,tasks,notify}) {
 const [steps,setSteps]=useState(project.steps||[]);
 const [busy,setBusy]=useState(null);
 useEffect(()=>setSteps(project.steps||[]),[project.id,project.steps]);
 const canManage=authUser?.role==='admin'||authUser?.role==='employee'&&authUser.tags?.includes('scrum_master');
 const setProgress=async(step,index,progress)=>{
  if(!canManage||busy!==null)return;
  const next=steps.map((item,itemIndex)=>itemIndex===index?{...item,progress,status:progress===100?'done':progress===0?'todo':'in_progress'}:item);
  setBusy(index);
  try {
   if(project.serverId&&step.id) await workspaceRequest(`/projects/${project.serverId}/steps/${step.id}?progress=${progress}`,{method:'PATCH'});
   setSteps(next);
  } catch(error) { notify(error.message); }
  finally { setBusy(null); }
 };
 return <section className="panel roadmap-controls"><div className="panel-heading"><div><h2>Delivery roadmap</h2><p>Stage progress is calculated from its tagged task-board tasks.</p></div><span className="roadmap-access">{canManage?'Scrum master controls':'Project progress'}</span></div><div className="roadmap-stage-list">{steps.map((step,index)=>{
  const {stageTasks,completed,progress,status}=roadmapStageMetrics(step,tasks);
  const circumference=2*Math.PI*15;
  return <article className={`roadmap-stage ${status}`} key={step.id||step.name}><div className="roadmap-stage-heading"><span className={`roadmap-progress ${status}`} role="img" aria-label={`${step.name}: ${progress}% complete, ${status==='done'?'done':status==='in_progress'?'in progress':'to do'}`}><svg viewBox="0 0 40 40" aria-hidden="true"><circle className="roadmap-progress-track" cx="20" cy="20" r="15"/><circle className="roadmap-progress-value" cx="20" cy="20" r="15" strokeDasharray={circumference} strokeDashoffset={circumference*(1-progress/100)}/><text x="20" y="20">{progress}%</text></svg></span><div><b>{step.name}</b><small>{stageTasks.length?`${completed} of ${stageTasks.length} tasks done`:(step.description||'No tasks tagged to this stage yet')}</small></div><span className={`roadmap-status ${status}`}>{status==='done'?'Done':status==='in_progress'?'In progress':'To do'}</span></div>{canManage&&<div className="roadmap-status-actions"><button type="button" disabled={busy!==null} className={status==='todo'?'selected':''} onClick={()=>setProgress(step,index,0)}>To do</button><button type="button" disabled={busy!==null} className={status==='in_progress'?'selected':''} onClick={()=>setProgress(step,index,50)}>In progress</button><button type="button" disabled={busy!==null} className={status==='done'?'selected':''} onClick={()=>setProgress(step,index,100)}>Done</button></div>}</article>;
 })}</div></section>;
}
function TaskCard({task,onClick}){if(!task)return <div className="empty-task">No active task assigned.</div>;return <button className="focus-task" onClick={()=>onClick?.(task)}><div><span className="task-id">{task.id}</span><span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority}</span></div><b>{task.title}</b><span className="task-card-foot"><span className="label-tag">{task.label}</span><span><Clock3 size={13}/> Due {task.due}</span></span></button>}
function SprintLifecyclePanel({project,authUser,contractSigned,notify,onChanged}) {
 const [sprints,setSprints]=useState([]);
 const [loading,setLoading]=useState(true);
 const [starting,setStarting]=useState(null);
 const canManage=authUser?.role==='admin'||authUser?.role==='employee'&&(
  String(authUser.id)===String(project.ownerUserId)&&authUser.tags?.includes('product_owner')||
  authUser.tags?.includes('scrum_master')
 );
 useEffect(()=>{
  let active=true;
  workspaceRequest(`/projects/${project.serverId}/sprints`).then(rows=>{
   if(active)setSprints(rows.map(row=>({...row,start:row.start_date,end:row.end_date})).sort((a,b)=>a.start.localeCompare(b.start)||a.id-b.id));
  }).catch(error=>{if(active)notify(error.message)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[project.serverId,notify]);
 const running=sprints.find(sprint=>sprint.status==='active');
 const startable=sprints.find(sprint=>sprint.status!=='completed'&&sprint.status!=='active'&&
  !sprints.some(other=>other.status!=='completed'&&other.id!==sprint.id&&(other.start<sprint.start||other.start===sprint.start&&other.id<sprint.id))
 );
 const start=async sprint=>{
  setStarting(sprint.id);
  try{
   const updated=await workspaceRequest(`/projects/${project.serverId}/sprints/${sprint.id}/start`,{method:'POST'});
   setSprints(rows=>rows.map(row=>row.id===sprint.id?{...row,...updated}:row));
   notify(`${sprint.name} started.`);
   onChanged();
  }catch(error){notify(error.message)}
  finally{setStarting(null)}
 };
 if(loading||!sprints.length)return null;
 return <section className="panel sprint-lifecycle-panel"><div className="panel-heading"><div><span className="sprint-planning-eyebrow">SPRINT CONTROL</span><h2>Sprint schedule</h2><p>Only one sprint can be active; later sprints unlock in sequence.</p></div></div><div className="sprint-lifecycle-list">{sprints.map((sprint,index)=>{
  const isRunning=sprint.status==='active';
  const completed=sprint.status==='completed';
  const locked=!completed&&!isRunning&&sprint!==startable;
  return <div className={`sprint-lifecycle-row ${isRunning?'running':completed?'completed':locked?'locked':''}`} key={sprint.id}><span className="sprint-lifecycle-number">{String(index+1).padStart(2,'0')}</span><span className="sprint-lifecycle-copy"><b>{sprint.name}</b><small>{sprint.start} – {sprint.end}</small></span><span className={`sprint-lifecycle-status ${isRunning?'running':completed?'completed':locked?'locked':''}`}>{isRunning?'In progress':completed?'Completed':locked?'Locked':'Ready to start'}</span>{canManage&&!completed&&!isRunning&&<button type="button" className={sprint===startable?'primary-button':'secondary-button'} disabled={!contractSigned||locked||Boolean(running)||starting!==null} onClick={()=>start(sprint)}>{starting===sprint.id?'Starting…':sprint===startable?'Start sprint':<><LockKeyhole size={13}/> Locked</>}</button>}</div>;
 })}</div>{!contractSigned&&<p className="sprint-lock-note"><LockKeyhole size={15}/> Approve or sign the project contract before starting a sprint.</p>}</section>;
}
function Board({project,contractSigned,tasks,setSelectedTask,setModal,changeTaskStatus,saveTaskPosition,saveTaskWorkflow,projectSteps=[],notify,onSprintChanged}) {
 const columns=['To do','In progress','In review','Done'];
 const [selectedStage,setSelectedStage]=useState('all');
 const [selectedSprint,setSelectedSprint]=useState(null);
 const [sprints,setSprints]=useState([]);
 const [sprintsLoading,setSprintsLoading]=useState(Boolean(project?.serverId));
 const [showSprintForm,setShowSprintForm]=useState(false);
 const [sprintName,setSprintName]=useState('');
 const [sprintStart,setSprintStart]=useState(new Date().toISOString().slice(0,10));
 const [sprintEnd,setSprintEnd]=useState(()=>{const date=new Date();date.setDate(date.getDate()+13);return date.toISOString().slice(0,10)});
 const [datesTouched,setDatesTouched]=useState(false);
 const [workflowTask,setWorkflowTask]=useState(null);
 const stages=projectSteps.map((step,index)=>typeof step==='string'?{id:null,name:step,index}:{...step,index});
 const selectedStep=stages.find(step=>String(step.id??step.index)===selectedStage);
 const sprintTasks=selectedSprint===null?tasks:tasks.filter(task=>selectedSprint==='backlog'?!task.sprintId:String(task.sprintId)===String(selectedSprint));
 const allTasks=sprintTasks.map(task=>({...task,triggered:tasks.some(source=>(source.triggerTaskIds||[]).map(String).includes(String(task.serverId??task.id))&&source.status==='Done')}));
 const visibleTasks=selectedStage==='all'?allTasks:selectedStage==='unassigned'?allTasks.filter(task=>!task.projectStepId):allTasks.filter(task=>selectedStep&&(selectedStep.id?String(task.projectStepId)===String(selectedStep.id):selectedStep.index===0&&!task.projectStepId));
 const dragging=useRef(null);
 const [draggedId,setDraggedId]=useState(null);
 const [destination,setDestination]=useState(null);
 const [saving,setSaving]=useState(null);
 useEffect(()=>{
  if(!project?.serverId){try{setSprints(JSON.parse(localStorage.getItem(`webflow_sprints_${project?.id}`)||'[]'))}catch{setSprints([])}setSprintsLoading(false);return}
  let active=true;setSprintsLoading(true);
  workspaceRequest(`/projects/${project.serverId}/sprints`).then(rows=>{if(active)setSprints(rows.map(row=>({...row,id:row.id,serverId:row.id,start:row.start_date,end:row.end_date})))})
   .catch(error=>{if(active)notify(error.message)})
   .finally(()=>{if(active)setSprintsLoading(false)});
  return()=>{active=false};
 },[project?.id,project?.serverId]);
 useEffect(()=>{
  if(!sprints.length||datesTouched)return;
  const last=[...sprints].sort((a,b)=>String(a.end||a.end_date).localeCompare(String(b.end||b.end_date))).at(-1);
  if(!last)return;
  const start=new Date(`${last.end||last.end_date}T12:00:00`);start.setDate(start.getDate()+1);
  const previousStart=new Date(`${last.start||last.start_date}T12:00:00`),previousEnd=new Date(`${last.end||last.end_date}T12:00:00`);
  const duration=Math.max(1,Math.round((previousEnd-previousStart)/86400000)+1);
  const end=new Date(start);end.setDate(end.getDate()+duration-1);
  setSprintStart(start.toISOString().slice(0,10));setSprintEnd(end.toISOString().slice(0,10));
  if(!sprintName)setSprintName(`Sprint ${String(sprints.length+1).padStart(2,'0')}`);
 },[sprints,datesTouched]);
 async function createSprint(event){
  event.preventDefault();
  if(!sprintName.trim()||!sprintStart||!sprintEnd||sprintEnd<sprintStart){notify('Enter a sprint name and a valid start and delivery date.');return}
  try{
   const result=await workspaceRequest(`/projects/${project.serverId}/sprints`,{method:'POST',data:{name:sprintName.trim(),start_date:sprintStart,end_date:sprintEnd}});
   const sprint={...result,serverId:result.id,start:result.start_date,end:result.end_date};
   setSprints(old=>[...old,sprint]);setShowSprintForm(false);setSprintName('');setDatesTouched(false);notify('Sprint created with the selected dates.');onSprintChanged?.();
  }catch(error){notify(error.message)}
 }
 function clearDrag(){
  dragging.current=null;
  setDraggedId(null);
  setDestination(null);
 }
 async function drop(event,column,beforeId=null){
  if(!dragging.current)return;
  event.preventDefault();
  event.stopPropagation();
  if(selectedSprint!=='backlog'&&sprints.find(sprint=>String(sprint.id)===String(selectedSprint))?.status!=='active'){clearDrag();notify('Start this sprint before moving its tasks.');return}
  const task=tasks.find(item=>item.id===dragging.current);
  if(beforeId===task?.id){clearDrag();return}
  if(!contractSigned&&column!=='To do'){clearDrag();notify('Approve or sign the project contract before starting task work.');return}
  const rows=visibleTasks.filter(item=>item.status===column&&item.id!==task?.id);
  const position=beforeId?Math.max(0,rows.findIndex(item=>item.id===beforeId)):rows.length;
  clearDrag();
  if(!task||saving)return;
  setSaving(task.id);
  try { if(saveTaskPosition)await saveTaskPosition(task,column,position);else if(task.status!==column)await changeTaskStatus(task,column); }
  finally { setSaving(null); }
 }
 return <><section className="panel sprint-planning-panel"><div className="panel-heading sprint-planning-heading"><div><span className="sprint-planning-eyebrow">PROJECT DELIVERY</span><h2>Sprints & backlog</h2><p>Plan sprint dates, then open a board to organize the work.</p></div><button type="button" className="primary-button sprint-add-button" onClick={()=>setShowSprintForm(value=>!value)} disabled={!project?.serverId}><Plus size={15}/> Add sprint</button></div>{!contractSigned&&<p className="sprint-lock-note"><LockKeyhole size={15}/> Sprint tasks stay locked from active delivery until the project contract is approved or signed.</p>}{showSprintForm&&<form className="sprint-create-form" onSubmit={createSprint}><label>Sprint name<input required value={sprintName} onChange={event=>setSprintName(event.target.value)} placeholder={`Sprint ${String(sprints.length+1).padStart(2,'0')}`}/></label><label>Start date<input required type="date" value={sprintStart} onChange={event=>{setDatesTouched(true);setSprintStart(event.target.value)}}/></label><label>Delivery date<input required type="date" min={sprintStart} value={sprintEnd} onChange={event=>{setDatesTouched(true);setSprintEnd(event.target.value)}}/></label><button className="primary-button" type="submit">Create sprint</button></form>}<div className="sprint-overview-grid"><button type="button" className={`sprint-overview-card ${selectedSprint==='backlog'?'selected':''}`} onClick={()=>setSelectedSprint('backlog')}><b>Backlog</b><span>{tasks.filter(task=>!task.sprintId).length} tasks · not scheduled</span><small>Plan work before assigning it to a sprint</small><span className="sprint-open-action">Open backlog board <ArrowRight size={14}/></span></button>{sprintsLoading?<p className="activity-empty">Loading project sprints…</p>:sprints.map(sprint=>{const sprintTasksAll=tasks.filter(task=>String(task.sprintId)===String(sprint.id));const done=sprintTasksAll.filter(task=>task.status==='Done').length;return <article className={`sprint-overview-card ${String(selectedSprint)===String(sprint.id)?'selected':''}`} key={sprint.id}><button type="button" className="sprint-overview-select" onClick={()=>setSelectedSprint(sprint.id)}><b>{sprint.name}</b><span>{sprint.start||sprint.start_date} – {sprint.end||sprint.end_date}</span><small>{done} / {sprintTasksAll.length} tasks completed · {sprint.status||'planned'}</small><span className="sprint-open-action">Open sprint board <ArrowRight size={14}/></span></button><SprintReviewForm sprint={sprint} project={project} onSaved={updated=>setSprints(old=>old.map(item=>item.id===updated.id?{...item,...updated,start:updated.start_date,end:updated.end_date}:item))} notify={notify}/></article>})}</div></section>{selectedSprint!==null&&<><div className="task-board-context"><b>{selectedSprint==='backlog'?'Backlog':sprints.find(sprint=>String(sprint.id)===String(selectedSprint))?.name||'Sprint tasks'}</b><button type="button" className="text-button" onClick={()=>setSelectedSprint(null)}>Back to sprints</button></div>{selectedSprint!=='backlog'&&!contractSigned&&<p className="sprint-lock-note"><LockKeyhole size={15}/> Sprint tasks cannot be moved into active roadmap stages before contract approval or signatures.</p>}<div className="task-stage-tabs" role="tablist" aria-label="Task roadmap stages"><button type="button" className={selectedStage==='all'?'active':''} onClick={()=>setSelectedStage('all')}>All stages <span>{sprintTasks.length}</span></button><button type="button" className={selectedStage==='unassigned'?'active':''} onClick={()=>setSelectedStage('unassigned')}>Unassigned stage <span>{sprintTasks.filter(task=>!task.projectStepId).length}</span></button>{stages.map(step=><button type="button" key={step.id??step.name} className={selectedStage===String(step.id??step.index)?'active':''} onClick={()=>setSelectedStage(String(step.id??step.index))}>{step.name}<span>{sprintTasks.filter(task=>step.id?String(task.projectStepId)===String(step.id):step.index===0&&!task.projectStepId).length}</span></button>)}</div><div className="task-board">{columns.map(column=>{
  const rows=visibleTasks.filter(task=>task.status===column).sort((a,b)=>(a.position??0)-(b.position??0));
  return <section className={`board-column ${destination===column?'board-drop-target':''}`} key={column} aria-label={column}
   onDragOver={event=>{
    if(!dragging.current)return;
    event.preventDefault();
    event.dataTransfer.dropEffect='move';
    setDestination(column);
   }}
   onDragLeave={event=>{if(!event.currentTarget.contains(event.relatedTarget))setDestination(current=>current===column?null:current)}}
   onDrop={event=>drop(event,column)}>
    <div className="column-head"><span><i className={`column-dot ${column.toLowerCase().replace(' ','-')}`}/><b>{column}</b><em>{rows.length}</em></span></div>
    <div className="column-content">{rows.map(task=><div key={task.id} onDragOver={event=>{if(dragging.current&&dragging.current!==task.id)event.preventDefault()}} onDrop={event=>drop(event,column,task.id)}><TaskCardBoard task={task}
     open={()=>setSelectedTask(task)} moving={draggedId===task.id||saving===task.id} draggable={!saving} onWorkflow={()=>setWorkflowTask(workflowTask===task.id?null:task.id)}
     onDragStart={event=>{
      if(selectedSprint!=='backlog'&&sprints.find(sprint=>String(sprint.id)===String(selectedSprint))?.status!=='active'){event.preventDefault();notify('Start this sprint before moving its tasks.');return}
      event.dataTransfer.setData('text/plain',String(task.id));
      event.dataTransfer.effectAllowed='move';
      dragging.current=task.id;
      setDraggedId(task.id);
     }} onDragEnd={clearDrag}/>{workflowTask===task.id&&<TaskWorkflowEditor task={task} tasks={tasks} stages={stages} contractSigned={contractSigned} saveTaskWorkflow={saveTaskWorkflow} close={()=>setWorkflowTask(null)}/>}</div>)}
     <button className="add-card" onClick={()=>setModal('task')}><Plus size={15}/> Add task</button>
    </div>
   </section>;
 })}</div></>}</>;
}
function TaskCardBoard({task,open,moving,draggable,onDragStart,onDragEnd,onWorkflow}){return <article className={`task-card ${moving?'task-card-moving':''} ${task.triggered?'task-card-triggered':''}`} draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}><button type="button" className="task-card-open" onClick={open}><div className="task-top"><span className="task-id">{task.id}</span><MoreHorizontal size={15}/></div><h4>{task.title}</h4>{task.triggered&&<span className="task-trigger-ready"><Zap size={12}/> Ready to start</span>}<div className="task-tags"><span className="label-tag">{task.label}</span><span className={`complexity ${task.complexity.toLowerCase()}`}>{task.complexity}</span></div><div className="task-card-footer"><span className="points"><Target size={13}/>{task.points} pts</span><span className={`priority-indicator ${task.priority.toLowerCase()}`}>{task.priority==='High'?'↑↑':task.priority==='Medium'?'↑':'↓'}</span><Avatar id={task.assignee} size="mini-avatar"/></div></button><button type="button" className="task-workflow-open" onClick={onWorkflow}>Roadmap & triggers</button></article>}
function TaskWorkflowEditor({task,tasks,stages,contractSigned,saveTaskWorkflow,close}) {
 const [stepId,setStepId]=useState(task.projectStepId==null?'':String(task.projectStepId));
 const [triggerIds,setTriggerIds]=useState((task.triggerTaskIds||[]).map(String));
 const [search,setSearch]=useState('');
 const [busy,setBusy]=useState(false);
 const candidates=tasks.filter(other=>other.id!==task.id&&other.project===task.project);
 const visible=candidates.filter(other=>`${other.title} ${other.id} ${other.serverId||''}`.toLowerCase().includes(search.trim().toLowerCase()));
 const toggle=id=>setTriggerIds(old=>old.includes(String(id))?old.filter(item=>item!==String(id)):[...old,String(id)]);
 const save=async()=>{
  setBusy(true);
  try{if(await saveTaskWorkflow(task,{projectStepId:stepId?Number(stepId):null,triggerTaskIds:triggerIds.map(id=>task.serverId?Number(id):id)}))close()}
  finally{setBusy(false)}
 };
 return <div className="task-workflow-editor">
  <label>Roadmap stage<select disabled={!!task.sprintId&&!contractSigned} value={stepId} onChange={event=>setStepId(event.target.value)}><option value="">Unassigned</option>{stages.filter(stage=>stage.id).map(stage=><option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
  {task.sprintId&&!contractSigned&&<small className="sprint-lock-note">Stage assignment is locked until the contract is approved or signed.</small>}
  <div className="task-trigger-picker"><b>Trigger these cards when this task is done</b><label className="task-trigger-search"><Search size={15}/><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search cards by name or ID"/></label><small>{triggerIds.length} trigger{triggerIds.length===1?'':'s'} selected</small><div className="task-trigger-results">{visible.map(other=>{const id=other.serverId??other.id;return <label className="task-trigger-option" key={other.id}><input type="checkbox" checked={triggerIds.includes(String(id))} onChange={()=>toggle(id)}/><span><b>{other.title}</b><small>{other.id} · {other.status}</small></span>{other.triggered&&<em>Ready</em>}</label>})}{!visible.length&&<p className="activity-empty">{search?'No cards match that name or ID.':'No other project cards are available to trigger.'}</p>}</div></div>
  <div className="task-workflow-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button type="button" className="primary-button" disabled={busy} onClick={save}>{busy?'Saving…':'Save workflow'}</button></div>
 </div>;
}
function SprintReviewForm({sprint,project,onSaved,notify}) {
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [draft,setDraft]=useState(()=>({what_went_well:sprint.what_went_well||'',what_went_wrong:sprint.what_went_wrong||'',next_actions:sprint.next_actions||'',delivery_date:sprint.end||sprint.end_date||''}));
 useEffect(()=>setDraft({what_went_well:sprint.what_went_well||'',what_went_wrong:sprint.what_went_wrong||'',next_actions:sprint.next_actions||'',delivery_date:sprint.end||sprint.end_date||''}),[sprint.id,sprint.what_went_well,sprint.what_went_wrong,sprint.next_actions,sprint.end,sprint.end_date]);
 const save=async event=>{
  event.preventDefault();setBusy(true);
  try{
   const updated=await workspaceRequest(`/projects/${project.serverId}/sprints/${sprint.id}/review`,{method:'PATCH',data:draft});
   const {sprints:updatedSprints,...reviewedSprint}=updated;
   onSaved(reviewedSprint);
   updatedSprints?.forEach(row=>onSaved(row));
   setOpen(false);notify('Sprint retrospective and upcoming sprint dates saved.');
  }catch(error){notify(error.message)}
  finally{setBusy(false)}
 };
 if(!project?.serverId)return <div className="sprint-review"><small>Retrospectives are available for saved project sprints.</small></div>;
 if(sprint.status!=='active'&&sprint.status!=='completed')return <div className="sprint-review"><small>Start this sprint before recording its retrospective.</small></div>;
 return <div className="sprint-review"><button className="text-button" type="button" onClick={()=>setOpen(value=>!value)}>{sprint.status==='completed'?'View / edit retrospective':'Add sprint retrospective'}</button>{sprint.status==='completed'&&!open&&<div className="sprint-review-summary"><b>Retrospective · {sprint.name}</b><span>Delivery date: {sprint.end||sprint.end_date}</span><p><strong>What went well:</strong> {sprint.what_went_well||'Not recorded.'}</p><p><strong>What went wrong:</strong> {sprint.what_went_wrong||'Not recorded.'}</p><p><strong>What are we going to do:</strong> {sprint.next_actions||'Not recorded.'}</p></div>}{open&&<form className="sprint-review-form" onSubmit={save}><label>What went well?<textarea rows="2" value={draft.what_went_well} onChange={event=>setDraft(old=>({...old,what_went_well:event.target.value}))}/></label><label>What went wrong?<textarea rows="2" value={draft.what_went_wrong} onChange={event=>setDraft(old=>({...old,what_went_wrong:event.target.value}))}/></label><label>What are we going to do?<textarea rows="2" value={draft.next_actions} onChange={event=>setDraft(old=>({...old,next_actions:event.target.value}))}/></label><label>Delivery date<input type="date" required min={sprint.start||sprint.start_date} value={draft.delivery_date} onChange={event=>setDraft(old=>({...old,delivery_date:event.target.value}))}/></label><button className="primary-button" disabled={busy}>{busy?'Saving…':'Save sprint review'}</button></form>}</div>;
}
function ProjectCharts({project,tasks,apiPeople,readOnly=false}) {
 const [sprints,setSprints]=useState([]);
 const [sprintId,setSprintId]=useState('');
 const [error,setError]=useState('');
 const [hoveredPoint,setHoveredPoint]=useState(null);
 useEffect(()=>{
  if(!project.serverId)return;
  let active=true;
  workspaceRequest(`/projects/${project.serverId}/sprints`).then(rows=>{
   if(!active)return;
   const normalized=rows.map(row=>({...row,start:row.start_date,end:row.end_date}));
   setSprints(normalized);setSprintId(current=>normalized.some(row=>String(row.id)===String(current))?current:String(normalized[0]?.id||''));
  }).catch(requestError=>{if(active)setError(requestError.message)});
  return()=>{active=false};
 },[project.serverId]);
 const sprint=sprints.find(row=>String(row.id)===String(sprintId));
 const sprintTasks=tasks.filter(task=>String(task.sprintId)===String(sprintId));
 const points=task=>Number(task.points||0);
 const totalPoints=sprintTasks.reduce((sum,task)=>sum+points(task),0);
 const completed=sprintTasks.filter(task=>task.status==='Done');
 const completedPoints=completed.reduce((sum,task)=>sum+points(task),0);
 const dates=[];
 if(sprint?.start&&sprint?.end){
  const start=new Date(`${sprint.start}T12:00:00Z`),end=new Date(`${sprint.end}T12:00:00Z`);
  for(const cursor=new Date(start);cursor<=end;cursor.setUTCDate(cursor.getUTCDate()+1))dates.push(cursor.toISOString().slice(0,10));
 }
 const hours=task=>Number(task.estimatedHours||points(task)*4);
 const totalHours=sprintTasks.reduce((sum,task)=>sum+hours(task),0);
 const completedHours=completed.reduce((sum,task)=>sum+hours(task),0);
 const hourValues=dates.map(date=>totalHours-completed.filter(task=>String(task.completedAt||sprint.end).slice(0,10)<=date).reduce((sum,task)=>sum+hours(task),0));
 const idealValues=dates.map((_,index)=>totalHours*(dates.length>1?1-index/(dates.length-1):0));
 const maxHours=Math.max(1,totalHours),width=Math.max(680,dates.length*48),height=300,pad={left:58,right:20,top:22,bottom:48};
 const chartX=index=>pad.left+(dates.length>1?index/(dates.length-1):0)*(width-pad.left-pad.right);
 const chartY=value=>height-pad.bottom-(value/maxHours)*(height-pad.top-pad.bottom);
 const polyline=hourValues.map((value,index)=>`${chartX(index)},${chartY(value)}`).join(' ');
 const idealPolyline=idealValues.map((value,index)=>`${chartX(index)},${chartY(value)}`).join(' ');
 const completedOn=date=>completed.filter(task=>String(task.completedAt||'').slice(0,10)===date);
 const projectCompleted=tasks.filter(task=>task.status==='Done');
 const projectRemainingHours=tasks.filter(task=>task.status!=='Done').reduce((sum,task)=>sum+hours(task),0);
 const projectProgress=tasks.length?Math.round(projectCompleted.length/tasks.length*100):0;
 const deliveryDate=project.due&&project.due!=='TBD'?project.due:null;
 const deliveryState=project.completedAt?'Completed':deliveryDate&&deliveryDate<new Date().toISOString().slice(0,10)?'Past target':deliveryDate?'Target date':'Not scheduled';
 const byPerson=new Map();
 for(const task of completed){const key=String(task.assignee??'unassigned');const row=byPerson.get(key)||{id:key,name:task.assigneeName||apiPeople.find(person=>String(person.id)===key)?.name||'Unassigned',points:0,tasks:0};row.points+=points(task);row.tasks++;byPerson.set(key,row)}
 const contributors=[...byPerson.values()].sort((a,b)=>b.points-a.points);
 const saveSprintReview=result=>{
  if(result.sprints)setSprints(result.sprints.map(row=>({...row,start:row.start_date,end:row.end_date})));
  else setSprints(rows=>rows.map(row=>row.id===result.id?{...row,...result,start:result.start_date,end:result.end_date}:row));
 };
 return <div className="project-charts">
  <section className="panel project-delivery-forecast">
   <div className="project-forecast-icon"><CalendarDays size={20}/></div>
   <div className="project-forecast-copy"><span>PROJECT DELIVERY FORECAST</span><h2>{deliveryDate||'Delivery date not set'}</h2><p>{project.completedAt?'Project completed':deliveryDate?`${projectRemainingHours.toFixed(1)} estimated hours remain across the project`:'Add a target date to share the expected delivery timing with the client.'}</p></div>
   <div className="project-forecast-progress"><div><span>{projectCompleted.length} of {tasks.length} tasks complete</span><b>{projectProgress}%</b></div><span className="project-forecast-track"><i style={{width:`${projectProgress}%`}}/></span><small className={`forecast-status ${deliveryState.toLowerCase().replaceAll(' ','-')}`}>{deliveryState}</small></div>
  </section>
  <section className="panel chart-panel">
   <div className="panel-heading"><div><span className="chart-kicker">SPRINT ANALYTICS</span><h2>Sprint tracking</h2><p>Remaining effort against the ideal sprint pace, with daily delivery details.</p></div><label className="chart-sprint-select">Choose sprint<select value={sprintId} onChange={event=>{setSprintId(event.target.value);setHoveredPoint(null)}}><option value="">Select a sprint</option>{sprints.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label></div>
   {error&&<p className="auth-error" role="alert">{error}</p>}
   {!sprint&&<p className="activity-empty">{error?'Sprint charts could not be loaded.':'Create a sprint to start tracking project delivery.'}</p>}
   {sprint&&<>
    <div className="chart-metrics"><article><small>Planned effort</small><b>{totalHours.toFixed(1)} hours</b></article><article><small>Remaining effort</small><b>{Math.max(0,totalHours-completedHours).toFixed(1)} hours</b></article><article><small>Story points</small><b>{completedPoints} / {totalPoints}</b></article><article><small>Tasks completed</small><b>{completed.length} / {sprintTasks.length}</b></article></div>
    <section className="chart-surface burndown-surface">
     <div className="chart-section-title"><div><b>Burndown · remaining estimated hours</b><span>Compare actual progress with the planned pace.</span></div><span>{sprint.name} · {sprint.start} to {sprint.end}</span></div>
     {!dates.length||!sprintTasks.length?<p className="activity-empty">Add sprint tasks with estimates to populate this chart.</p>:<>
      <div className="burndown-chart-scroll"><svg className="burndown-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Remaining estimated hours for ${sprint.name}`}>
       <text x="15" y={height/2} className="chart-axis-title" transform={`rotate(-90 15 ${height/2})`}>Hours remaining</text>
       {[0,.25,.5,.75,1].map(fraction=><g key={fraction}><line x1={pad.left} y1={chartY(maxHours*fraction)} x2={width-pad.right} y2={chartY(maxHours*fraction)} className="chart-gridline"/><text x={pad.left-8} y={chartY(maxHours*fraction)+4} textAnchor="end" className="chart-axis-label">{(maxHours*fraction).toFixed(0)}</text></g>)}
       <polyline points={idealPolyline} className="chart-ideal"/>
       <polyline points={polyline} className="chart-actual"/>
       {hourValues.map((value,index)=>{const daily=completedOn(dates[index]);return <g key={dates[index]} className={`chart-day-point ${hoveredPoint===index?'selected':''}`} onMouseEnter={()=>setHoveredPoint(index)} onFocus={()=>setHoveredPoint(index)}><circle cx={chartX(index)} cy={chartY(value)} r="5" tabIndex="0" role="button" aria-label={`${dates[index]}: ${value.toFixed(1)} hours remain; ${daily.length} tasks completed`}/><text x={chartX(index)} y={height-pad.bottom+18} textAnchor="middle" className="chart-date-tick">{dates[index].slice(5)}</text></g>})}
      </svg></div>
      {hoveredPoint!==null&&dates[hoveredPoint]?<div className="chart-point-details" role="status"><div><span>DAILY SNAPSHOT</span><b>{dates[hoveredPoint]}</b></div><div><small>Remaining</small><b>{hourValues[hoveredPoint].toFixed(1)} hours</b></div><div><small>Completed</small><b>{completedOn(dates[hoveredPoint]).length} tasks · {completedOn(dates[hoveredPoint]).reduce((sum,task)=>sum+points(task),0)} points</b></div><p>{completedOn(dates[hoveredPoint]).length?completedOn(dates[hoveredPoint]).map(task=>task.title).join(' · '):'No tasks were completed on this day.'}</p></div>:<p className="chart-point-hint">Focus or hover over a chart point to see its daily breakdown.</p>}
      <div className="chart-legend"><span><i/> Actual remaining hours</span><span><i className="ideal-legend"/> Ideal sprint pace</span><small>{dates.length} daily data points</small></div>
     </>}
    </section>
    <div className="chart-content-grid">
     <section className="chart-surface"><div className="chart-section-title"><b>Completed points by teammate</b><span>Story points and task totals in this sprint.</span></div>{contributors.length?contributors.map((person,index)=><div className="contributor-chart-row" key={person.id}><span className={`chart-color chart-color-${index%5}`}/><Avatar id={person.id} name={person.name} size="mini-avatar"/><span className="contributor-chart-name">{person.name}</span><span className="contributor-chart-bar"><i className={`chart-bar-${index%5}`} style={{width:`${completedPoints?person.points/completedPoints*100:0}%`}}/></span><b>{person.points} pts · {person.tasks} tasks</b></div>):<p className="activity-empty">No completed sprint tasks yet.</p>}</section>
     <section className="chart-surface sprint-retrospective-view"><div className="chart-section-title"><b>Sprint retrospective · {sprint.name}</b><span>{sprint.status==='completed'?`Reviewed · delivery ${sprint.end}`:`Planned delivery · ${sprint.end}`}</span></div><div className="sprint-review-reading"><article><b>What went well</b><p>{sprint.what_went_well||'Capture the practices and outcomes the team should repeat.'}</p></article><article><b>What went wrong</b><p>{sprint.what_went_wrong||'Note blockers or misses to improve the next sprint.'}</p></article><article><b>What are we going to do?</b><p>{sprint.next_actions||'Agree on specific follow-up actions and owners.'}</p></article></div>{!readOnly&&<div className="retrospective-review-control"><SprintReviewForm sprint={sprint} project={project} onSaved={saveSprintReview} notify={message=>{setError(message);setTimeout(()=>setError(''),3500)}}/></div>}</section>
    </div>
   </>}
  </section>
 </div>;
}
function ProjectContributionChart({tasks,apiPeople}) {
 const totals=new Map();
 for(const task of tasks.filter(item=>item.status==='Done')){
  const id=String(task.assignee??'unassigned');
  const row=totals.get(id)||{id,name:task.assigneeName||apiPeople.find(person=>String(person.id)===id)?.name||'Unassigned',points:0,tasks:0};
  row.points+=Number(task.points||0);row.tasks++;totals.set(id,row);
 }
 const peopleTotals=[...totals.values()].sort((a,b)=>b.points-a.points);
 const max=Math.max(1,...peopleTotals.map(person=>person.points));
 return <section className="panel project-contribution-panel"><div className="panel-heading"><div><span className="chart-kicker">TEAM DELIVERY</span><h2>Project contribution points</h2><p>Story points completed by each teammate across this project.</p></div></div>{peopleTotals.length?peopleTotals.map((person,index)=><div className="contributor-chart-row" key={person.id}><span className={`chart-color chart-color-${index%5}`}/><Avatar id={person.id} name={person.name} size="mini-avatar"/><span className="contributor-chart-name">{person.name}</span><span className="contributor-chart-bar"><i className={`chart-bar-${index%5}`} style={{width:`${person.points/max*100}%`}}/></span><b>{person.points} pts · {person.tasks} tasks</b></div>):<p className="activity-empty">Completed task points will appear here for the project team.</p>}</section>;
}
function TeamsView({groups=[],apiPeople=[],authUser,openProfile,onRemove}) {
 const [expanded,setExpanded]=useState(null);
 const findPerson=id=>apiPeople.find(person=>String(person.id)===String(id))||people[id]||{id,name:`Employee #${id}`};
 return <section className="teams-grid" aria-label="Project teams">
  {!groups.length&&<div className="panel workflow-panel"><EmptyState icon={Users} title="No project teams yet" text="Teams will appear here after the project owner submits a team proposal."/></div>}
  {groups.map(group=>{
   const lead=findPerson(group.lead);
   const members=[...new Map(group.members.map(id=>{const person=findPerson(id);return [String(person.id??id),person]})).values()];
   const isExpanded=expanded===group.name;
   return <article className={`panel team-card ${isExpanded?'team-card-expanded':''}`} key={group.name}>
    <button type="button" className="team-card-toggle" aria-expanded={isExpanded} onClick={()=>setExpanded(isExpanded?null:group.name)}>
     <span className={`team-mark ${group.color}`}><Users size={18}/></span><span className="team-card-title"><b>{group.name}</b><small>{group.stage||'Project'} team · {members.length} members</small></span><ChevronDown size={16}/>
    </button>
    <div className="team-lead-row"><span>SCRUM MASTER</span><button type="button" className="team-person-link" onClick={()=>openProfile?.(lead.id)}><Avatar id={lead.id} name={lead.name} image={lead.profile_photo_url} size="mini-avatar"/><b>{lead.name}</b></button></div>
    {isExpanded&&<div className="team-members-expanded"><h4>Team members</h4>{members.map(member=><div className="team-member-row" key={member.id}><button type="button" className="team-member-link" onClick={()=>openProfile?.(member.id)}><Avatar id={member.id} name={member.name} image={member.profile_photo_url} size="mini-avatar"/><span><b>{member.name}</b><small>{String(member.id)===String(group.lead)?'Scrum master':'Team member'}</small></span><ChevronRight size={15}/></button>{String(member.id)!==String(group.lead)&&(authUser?.role==='admin'||authUser?.role==='employee'&&authUser.tags?.includes('scrum_master')&&String(authUser.id)===String(group.lead))&&<button type="button" className="decline-button team-remove-button" onClick={()=>onRemove?.(group,member)}>Remove</button>}</div>)}</div>}
    <button type="button" className="team-card-view" onClick={()=>setExpanded(isExpanded?null:group.name)}>{isExpanded?'Hide team members':'View team members'} <ChevronRight size={14}/></button>
   </article>;
  })}
 </section>;
}
function ProjectPicker({projects,project,onSelect}) {
 const [open,setOpen]=useState(false);
 const trigger=useRef(null);
 function choose(id){
  onSelect(id);
  setOpen(false);
  trigger.current?.focus();
 }
 return <div className="task-project-picker"
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}
  onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false);trigger.current?.focus()}}}>
  <button type="button" ref={trigger} className="task-project-trigger" aria-label={`Project for tasks: ${project?.name||'Select a project'}`}
   aria-expanded={open} disabled={!projects.length} onClick={()=>setOpen(value=>!value)}>
   <FolderKanban size={17}/><span>{project?.name||(projects.length?'Select a project':'No projects available')}</span><ChevronDown size={15}/>
  </button>
  {open&&<div className="task-project-options" role="group" aria-label="Available projects">
   {projects.map(item=><button type="button" key={item.id} aria-pressed={item.id===project?.id} onClick={()=>choose(item.id)}>
    <span className={`project-dot ${item.color}`}/><span>{item.name}</span>{item.id===project?.id&&<Check size={16}/>}
   </button>)}
  </div>}
 </div>;
}
function SprintMove({task,sprints,current,saving,move}) {
 const [open,setOpen]=useState(false);
 const button=useRef(null);
 const choices=[{id:'',name:'Backlog'},...sprints.filter(sprint=>sprint.status!=='completed')];
 return <div className="sprint-move" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}
  onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false);button.current?.focus()}}}>
  <button className="sprint-move-trigger" type="button" ref={button} aria-expanded={open} disabled={saving}
   aria-label={`Move ${task.title} to another sprint`} onClick={()=>setOpen(value=>!value)}>
   <CalendarDays size={15}/><span>{saving?'Moving…':current?.name||'Backlog'}</span><ChevronDown size={14}/>
  </button>
  {open&&<div className="sprint-move-options" role="group" aria-label="Move to">
   {choices.map(item=>{
    const selected=String(item.id)===String(task.sprintId||'');
    return <button type="button" key={item.id} aria-pressed={selected} onClick={()=>{
     setOpen(false);button.current?.focus();if(!selected)move(task,item.id);
    }}>
     <span><b>{item.name}</b><small>{item.start?`${item.start} – ${item.end}`:'Unscheduled tasks'}</small></span>{selected&&<Check size={15}/>}
    </button>;
   })}
  </div>}
 </div>;
}
const previewSprints=[{id:'sprint-1',name:'Sprint 01 · Foundation',start:'2026-11-23',end:'2026-12-04'},{id:'sprint-2',name:'Sprint 02 · Delivery',start:'2026-12-07',end:'2026-12-18'}];

function TaskQueue({project,projects=[],setActiveProject,apiPeople=[],authUser,projectTeams={},tasks,setSelectedTask,setModal,role,setTasks,notify=()=>{}}){const [tab,setTab]=useState('Backlog');const [movingTask,setMovingTask]=useState(null);const [showSprintForm,setShowSprintForm]=useState(false);const [sprintName,setSprintName]=useState('');const [sprintStart,setSprintStart]=useState(new Date().toISOString().slice(0,10));const [sprintEnd,setSprintEnd]=useState(()=>{const date=new Date();date.setDate(date.getDate()+13);return date.toISOString().slice(0,10)});const [sprints,setSprints]=useState(()=>{
 if(!project||project.serverId)return [];
 try{return JSON.parse(localStorage.getItem(`webflow_sprints_${project.id}`)||'null')||previewSprints}
 catch{return previewSprints}
});
useEffect(()=>{
 if(project&&!project.serverId)localStorage.setItem(`webflow_sprints_${project.id}`,JSON.stringify(sprints));
},[sprints,project?.id,project?.serverId]);
useEffect(()=>{
 if(!project?.serverId)return;
 const controller=new AbortController();
 workspaceRequest(`/projects/${project.serverId}/sprints`,{signal:controller.signal})
  .then(rows=>{
   if(!controller.signal.aborted)setSprints(rows.map(item=>({...item,id:item.id,name:item.name,start:item.start_date,end:item.end_date,serverId:item.id})));
  }).catch(error=>{if(!controller.signal.aborted)notify(error.message)});
 return()=>controller.abort();
},[project?.serverId]);
useEffect(()=>{
 if(!sprints.length)return;
 const last=[...sprints].sort((a,b)=>String(a.end).localeCompare(String(b.end))).at(-1);
 if(!last?.start||!last?.end)return;
 const start=new Date(`${last.end}T12:00:00`);start.setDate(start.getDate()+1);
 const duration=Math.max(1,Math.round((new Date(`${last.end}T12:00:00`)-new Date(`${last.start}T12:00:00`))/86400000)+1);
 const end=new Date(start);end.setDate(end.getDate()+duration-1);
 setSprintStart(start.toISOString().slice(0,10));setSprintEnd(end.toISOString().slice(0,10));
 if(!sprintName)setSprintName(`Sprint ${String(sprints.length+1).padStart(2,'0')}`);
},[sprints]);
const createSprintManually=async event=>{
 event.preventDefault();
 if(!project||!sprintName.trim()||!sprintStart||!sprintEnd||sprintEnd<sprintStart){notify('Enter a sprint name and a valid start and delivery date.');return}
 try{
  const result=project.serverId?await workspaceRequest(`/projects/${project.serverId}/sprints`,{method:'POST',data:{name:sprintName.trim(),start_date:sprintStart,end_date:sprintEnd}}):null;
  const row=result?{id:result.id,name:result.name,start:result.start_date,end:result.end_date,serverId:result.id}:{id:`local-sprint-${Date.now()}`,name:sprintName.trim(),start:sprintStart,end:sprintEnd};
  setSprints(old=>[...old,row]);setShowSprintForm(false);setSprintName('');notify('Sprint created with the selected dates.');
 }catch(error){notify(error.message)}
};
const assign=async(task,sprintId)=>{setMovingTask(task.id);if(task.serverId&&project?.serverId){try{await workspaceRequest(`/tasks/${task.serverId}/sprint`,{method:'PATCH',data:{sprint_id:sprintId?Number(sprintId):null}})}catch(error){notify(error.message);setMovingTask(null);return}}setTasks(old=>old.map(t=>t.id===task.id?{...t,sprintId:sprintId||''}:t));setMovingTask(null)};const visible=tab==='Backlog'?tasks.filter(t=>!t.sprintId&&t.status!=='Done'):tab==='Sprint review'?tasks.filter(t=>t.status==='In review'||t.status==='Done'):tasks.filter(t=>String(t.sprintId)===String(tab));return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> {role==='Employee'?'PERSONAL WORKSPACE':'TEAM DELIVERY'}</div><h1>{role==='Employee'?'My tasks':'Task queue'}</h1><p className="lead">Plan the backlog, timebox delivery, and review completed work.</p></div><div className="task-create-actions">{role!=='Client'&&<ProjectPicker projects={projects} project={project} onSelect={setActiveProject}/>}<button className="primary-button" disabled={!project} onClick={()=>setModal('task')}><Plus size={16}/> Create task</button></div></div><div className="queue-callout"><span className="queue-callout-icon"><WandSparkles size={19}/></span><div><b>Smart assignment is ready to help.</b><p>Complex tasks go to experienced teammates. Each person gets one active task at a time.</p></div><button className="secondary-button" disabled={!project} onClick={()=>setModal('ai')}><Sparkles size={15}/> Generate tasks with AI</button></div><div className="panel queue-panel"><div className="panel-heading"><div><h2>Delivery planning</h2><p>Move backlog work into dated sprints and review outcomes.</p></div><button className="secondary-button" disabled={!project||role==='Employee'&&authUser&&(authUser.id!==project?.ownerUserId||!authUser.tags?.includes('product_owner'))} onClick={()=>setShowSprintForm(value=>!value)}><Plus size={15}/> Add sprint</button></div>{showSprintForm&&<form className="sprint-create-form" onSubmit={createSprintManually}><label>Sprint name<input required value={sprintName} onChange={event=>setSprintName(event.target.value)} placeholder={`Sprint ${String(sprints.length+1).padStart(2,'0')}`}/></label><label>Start date<input required type="date" value={sprintStart} onChange={event=>setSprintStart(event.target.value)}/></label><label>Delivery date<input required type="date" min={sprintStart} value={sprintEnd} onChange={event=>setSprintEnd(event.target.value)}/></label><button className="primary-button">Create sprint</button></form>}<div className="sprint-tabs">{['Backlog',...sprints.map(s=>s.id),'Sprint review'].map(key=>{const sprint=sprints.find(s=>s.id===key);return <button key={key} className={tab===key?'selected':''} onClick={()=>setTab(key)}>{sprint?sprint.name:key}{sprint&&<small>{sprint.start} – {sprint.end}</small>}</button>})}</div>{tab==='Sprint review'&&<div className="sprint-review-list">{sprints.map(sprint=><article className="sprint-review-list-item" key={sprint.id}><b>{sprint.name}</b><SprintReviewForm sprint={sprint} project={project} onSaved={updated=>setSprints(old=>old.map(item=>item.id===updated.id?{...item,start:updated.start_date,end:updated.end_date,...updated}:item))} notify={notify}/></article>)}</div>}<div className="queue-head"><span>TASK</span><span>TEAM</span><span>COMPLEXITY</span><span>ASSIGNEE</span><span>STATUS</span><span>SPRINT</span></div>{visible.map(t=><div className="queue-row sprint-row" key={t.id}><button className="queue-task-open" onClick={()=>setSelectedTask(t)}><b>{t.title}</b><small>{t.id} · {t.priority} priority</small></button><span><span className="label-tag">{t.label}</span></span><span><span className={`complexity ${t.complexity.toLowerCase()}`}>{t.complexity}</span></span><span className="queue-assignee"><Avatar id={t.assignee} size="mini-avatar"/>{t.assigneeName?.split(' ')[0]||apiPeople.find(person=>String(person.id)===String(t.assignee))?.name.split(' ')[0]||people[t.assignee]?.name.split(' ')[0]||'Unassigned'}</span><span><span className={`stage-badge ${t.status.toLowerCase().replace(' ','-')}`}>{t.status}</span></span>{(()=>{const team=(projectTeams[project?.id]||[]).find(item=>String(item.id)===String(t.team_id));const canPlan=role!=='Employee'||!authUser||authUser.id===project?.ownerUserId&&authUser.tags?.includes('product_owner')||authUser.tags?.includes('scrum_master')&&String(team?.scrumMasterId)===String(authUser.id);const chosen=sprints.find(item=>String(item.id)===String(t.sprintId));return canPlan?<SprintMove task={t} sprints={sprints} current={chosen} saving={movingTask!==null} move={assign}/>:<span className="sprint-readonly" title="Only the project owner or team scrum master can plan sprints"><CalendarDays size={13}/>{chosen?.name||'Backlog'}</span>})()}</div>)}{!visible.length&&<EmptyState icon={ListTodo} title="Nothing here yet" text={tab==='Backlog'?'Your backlog is clear. Add tasks or generate task drafts.':'No tasks are currently in this view.'}/>}</div></>}
function AttentionItems({projects,contracts,cancellationRequests,onNavigate,live}){if(!live)return <div className="attention-list"><button className="attention-item" onClick={()=>onNavigate('Approvals')}><span className="attention-icon amber-bg"><Users size={17}/></span><span><b>Project team setup</b><small>Preview sample · sign in for live approvals</small></span><ChevronRight size={16}/></button><button className="attention-item" onClick={()=>onNavigate('Contracts')}><span className="attention-icon violet-bg"><FileText size={17}/></span><span><b>Contract review</b><small>Preview sample · sign in for stored contracts</small></span><ChevronRight size={16}/></button></div>;const items=[...projects.filter(project=>project.teamSetupStatus==='Pending admin approval').map(project=>({key:`p${project.id}`,title:'Project setup needs review',body:project.name,target:'Approvals',icon:Users,tint:'amber-bg'})),...contracts.filter(contract=>['pending_admin_review','amendment_requested'].includes(contract.status)).map(contract=>({key:`c${contract.id}`,title:'Contract needs review',body:`${contract.project_name} · ${contract.filename}`,target:'Contracts',icon:FileText,tint:'violet-bg'})),...cancellationRequests.map(request=>({key:`x${request.id}`,title:'Cancellation request',body:`Project #${request.project_id}`,target:'Approvals',icon:X,tint:'blue-bg'}))];return <div className="attention-list">{items.slice(0,4).map(item=><button className="attention-item" key={item.key} onClick={()=>onNavigate(item.target)}><span className={`attention-icon ${item.tint}`}><item.icon size={17}/></span><span><b>{item.title}</b><small>{item.body}</small></span><ChevronRight size={16}/></button>)}{!items.length&&<div className="activity-item"><span className="activity-icon"><Check size={16}/></span><div><p>Nothing needs your attention.</p><small>New approvals and requests will show here.</small></div></div>}</div>}
function Approvals({projects,projectTeams,markApproved,onApproved,notify,cancellationRequests=[],reviewCancellation,contracts=[],reviewContract,live=false}){const pending=projects.filter(p=>p.teamSetupStatus==='Pending admin approval');const contractReview=contracts.filter(c=>['pending_admin_review','amendment_requested'].includes(c.status));return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot amber-dot"/> ADMIN CONTROL CENTER</div><h1>Review & approvals</h1><p className="lead">Make sure every project is set up for a healthy start.</p></div><button className="secondary-button" onClick={()=>notify('Approval requests refresh from the server when you reload this page.')}><Filter size={15}/> Review queues</button></div><div className="approval-summary"><div><span>Pending review</span><b>{String(pending.length+contractReview.length+cancellationRequests.length).padStart(2,'0')}</b></div><div><span>Awaiting client</span><b>{String(contracts.filter(c=>c.status==='approved_pending_signatures').length).padStart(2,'0')}</b></div><div><span>Approved projects</span><b>{String(projects.filter(p=>p.teamSetupStatus==='Approved').length).padStart(2,'0')}</b></div><div className="approval-summary-illustration"><ShieldCheck size={34}/></div></div><div className="approval-layout"><div className="panel approval-list"><div className="panel-heading"><div><h2>Pending approvals <span className="count-bubble">{pending.length+contractReview.length+cancellationRequests.length}</span></h2><p>Requests need admin review before the work begins.</p></div></div>{pending.map(p=>live&&p.serverId?<AdminTeamApproval key={p.id} project={p} picker={UserSearchPicker} notify={notify} onApproved={onApproved}/>:<div className="approval-card" key={p.id}><div className="approval-card-icon"><FolderKanban size={18}/></div><div className="approval-card-content"><div className="approval-type">TEAM SETUP REQUEST</div><h3>{p.name}</h3><p>{p.owner} proposed teams for {p.client}.</p><div className="approval-chips">{(projectTeams[p.id]||projectTeams[p.serverId]||[]).map(t=><span key={t.id||t.name}><Users size={13}/> {t.name} · {t.members?.length||0} members · {t.reviewStatus||t.review_status||'pending'}</span>)}<span><FileText size={13}/> Contract required before kickoff</span></div></div><div className="approval-card-actions"><button className="review-button" onClick={()=>notify('Review the project plan and team proposals above before approval.')}>Review request</button><button className="accept-button" onClick={()=>markApproved(p.id)}><Check size={14}/> Approve</button></div></div>)}{contractReview.map(contract=><div className="approval-card" key={`contract-${contract.id}`}><div className="approval-card-icon contract-approval"><FileText size={18}/></div><div className="approval-card-content"><div className="approval-type">CONTRACT REVIEW · {contract.status.replaceAll('_',' ').toUpperCase()}</div><h3>{contract.project_name} · {contract.filename}</h3><p>Version {contract.version} needs administrator review.</p></div><div className="approval-card-actions"><button className="review-button" onClick={()=>notify(`Contract version ${contract.version} · ${contract.status.replaceAll('_',' ')}`)}>Review request</button><button className="accept-button" onClick={()=>reviewContract(contract.id,true)}><Check size={14}/> Approve</button><button className="decline-button" onClick={()=>reviewContract(contract.id,false)}>Request changes</button></div></div>)}{cancellationRequests.map(request=>{const project=projects.find(item=>item.serverId===request.project_id);return <div className="approval-card" key={`cancel-${request.id}`}><div className="approval-card-icon contract-approval"><X size={18}/></div><div className="approval-card-content"><div className="approval-type">CANCELLATION REQUEST</div><h3>{project?.name||`Project #${request.project_id}`}</h3><p>{request.reason}</p></div><div className="approval-card-actions"><button className="decline-button" onClick={()=>reviewCancellation(request.id,false)}>Keep project</button><button className="accept-button" onClick={()=>reviewCancellation(request.id,true)}><Check size={14}/> Approve cancellation</button></div></div>})}{live&&!pending.length&&!contractReview.length&&!cancellationRequests.length&&<EmptyState icon={Check} title="No pending approvals" text="Project setups, contracts, and cancellation requests are all up to date."/>}{!live&&<div className="approval-card"><div className="approval-card-icon"><FolderKanban size={18}/></div><div className="approval-card-content"><div className="approval-type">PREVIEW DATA</div><h3>Sample projects are shown in preview mode</h3><p>Sign in as an administrator to review live project setups, contracts, and cancellation requests.</p></div></div>}</div><div className="panel approval-guide"><div className="guide-icon"><ShieldCheck size={20}/></div><h3>Before you approve</h3><p>Check team ownership, scrum master assignments, contract status, and delivery scope.</p><ul><li><Check size={14}/> Every team has a scrum master</li><li><Check size={14}/> Contract is ready to sign</li><li><Check size={14}/> Client and owner are assigned</li></ul></div></div></>}
function AdminProjectStatusList({projects,notify,onChanged}) {
 const rows=projects.filter(project=>project.serverId);
 async function change(project,action) {
  if(action==='cancel'&&!window.confirm(`Cancel “${project.name}”? This will stop active work and notify the project participants.`))return;
  try{
   const response=await fetch(`/api/admin/projects/${project.serverId}/status`,{
    method:'PATCH',
    headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},
    body:JSON.stringify({action})
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.detail||'Could not update project status');
   onChanged(result);
   notify(action==='cancel'?'Project cancelled':action==='complete'?'Project marked as completed':'Project reopened');
  }catch(error){notify(error.message)}
 }
 return <section className="panel admin-project-status-panel">
  <div className="panel-heading"><div><h2>All live projects <span className="count-bubble">{rows.length}</span></h2><p>Review project details and update delivery status.</p></div></div>
  {rows.length?<div className="admin-project-status-list">{rows.map(project=>{
   const status=projectStatus(project)||project.health||'In progress';
   return <article className="admin-project-status-row" key={project.serverId}>
    <div className="admin-project-status-info"><span className="project-glyph violet"><FolderKanban size={17}/></span><div><b>{project.name}</b><small>Client: {project.client} · Product owner: {project.owner}</small><small>{project.stage} · {project.progress}% complete · Due {project.due}</small></div></div>
    <span className={`stage-badge ${status.toLowerCase().replaceAll(' ','-')}`}>{status}</span>
    <div className="admin-project-status-actions">
     {status!=='Completed'&&status!=='Cancelled'&&<button className="accept-button" onClick={()=>change(project,'complete')}><Check size={14}/> Mark completed</button>}
     {status!=='Cancelled'&&<button className="decline-button" onClick={()=>change(project,'cancel')}>Cancel</button>}
     {(status==='Completed'||status==='Cancelled')&&<button className="secondary-button" onClick={()=>change(project,'reopen')}>Reopen</button>}
    </div>
   </article>
  })}</div>:<div className="admin-loading">No live projects are available.</div>}
 </section>;
}

function Contracts({projects,contracts=[],setModal,notify,openContract,role='Admin',authUser,live=false,reviewContract,signContract,requestAmendment}) {
 const [reviewOnly,setReviewOnly]=useState(false);
 const [localContracts,setLocalContracts]=useState(contracts);
 const [signatureDrafts,setSignatureDrafts]=useState({});
 const [removed,setRemoved]=useState([]);
 const filtered=localContracts.filter(contract=>!removed.includes(contract.id)&&(!reviewOnly||['pending_admin_review','amendment_requested','changes_requested'].includes(contract.status)));
 const pending=status=>status==='pending_admin_review'||status==='amendment_requested';
 useEffect(()=>{
  if(!live||role!=='Admin'){setLocalContracts(contracts);setSignatureDrafts(Object.fromEntries(contracts.map(contract=>[contract.id,(contract.signatures||[]).map(signature=>signature.user_id)])));return}
  let active=true;
  const token=localStorage.getItem('stride_token');
  Promise.all(projects.filter(project=>project.serverId).map(async project=>{
   const response=await fetch(`/api/projects/${project.serverId}/contracts`,{headers:{Authorization:`Bearer ${token}`}});
   const rows=await response.json();
   if(!response.ok)throw new Error(rows.detail||`Could not load contracts for ${project.name}`);
   return rows.map(contract=>({...contract,project_id:project.serverId,project_name:project.name,project_client_id:project.clientUserId,project_client_name:project.client,project_owner_id:project.ownerUserId,project_owner_name:project.owner}));
  })).then(groups=>{
   if(!active)return;
   const rows=groups.flat();
   setLocalContracts(rows);
   setSignatureDrafts(Object.fromEntries(rows.map(contract=>[contract.id,(contract.signatures||[]).map(signature=>signature.user_id)])));
   setRemoved([]);
  }).catch(error=>{if(active)notify(error.message)});
  return()=>{active=false};
 },[contracts,live,projects,role]);
 async function saveSignatures(contract) {
  const signedBy=[];
  if(signatureDrafts[contract.id]?.includes(contract.project_client_id))signedBy.push('client');
  if(signatureDrafts[contract.id]?.includes(contract.project_owner_id))signedBy.push('owner');
  try{
   const response=await fetch(`/api/admin/contracts/${contract.id}/signatures`,{
    method:'PATCH',
    headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},
    body:JSON.stringify({signed_by:signedBy})
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.detail||'Could not update contract signatures');
   setSignatureDrafts(old=>({...old,[contract.id]:result.signatures.map(signature=>signature.user_id)}));
   setLocalContracts(old=>old.map(item=>item.id===contract.id?{...item,status:result.status,signatures:result.signatures}:item));
   notify('Contract signatures updated by admin');
  }catch(error){notify(error.message)}
 }
 async function removeContract(contract) {
  if(!window.confirm(`Delete contract version ${contract.version} for ${contract.project_name}? This cannot be undone.`))return;
  try{
   const response=await fetch(`/api/admin/contracts/${contract.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`}});
   const result=await response.json();
   if(!response.ok)throw new Error(result.detail||'Could not delete contract');
   setRemoved(old=>[...old,result.id]);
   notify('Contract deleted');
  }catch(error){notify(error.message)}
 }
 function toggleSignature(contract,partyId,checked) {
  setSignatureDrafts(old=>{
   const current=old[contract.id]||[];
   const next=checked?[...new Set([...current,partyId])]:current.filter(id=>id!==partyId);
   return {...old,[contract.id]:next};
  });
 }
 return <>
  <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> PROJECT PAPERWORK</div><h1>Contracts</h1><p className="lead">One shared place for the scope, signatures, and change requests.</p></div><button className="primary-button" onClick={()=>setModal('contract')}><Plus size={16}/> Upload contract</button></div>
  <div className="contract-callout"><span><LockKeyhole size={17}/></span><div><b>Every project needs an approved contract before work begins.</b><p>Clients and employees can propose edits. An admin reviews all changes before the contract updates.</p></div></div>
  <div className="panel contract-list"><div className="panel-heading"><div><h2>Project contracts</h2><p>Visible to the client, project owner, and assigned team.</p></div><button className="secondary-button" aria-pressed={reviewOnly} onClick={()=>setReviewOnly(!reviewOnly)}><Filter size={15}/>{reviewOnly?'Review only':'All status'}</button></div>
   {filtered.map(contract=>{
    const signed=signatureDrafts[contract.id]||[];
    const canSign=authUser?.role==='client'&&authUser.id===contract.project_client_id||authUser?.role==='employee'&&authUser.id===contract.project_owner_id;
    return <article className="contract-row" key={`contract-${contract.id}`}>
     <span className="file-icon pdf"><FileText size={19}/></span>
     <span className="contract-title"><b>{contract.project_name||`Project #${contract.project_id}`} · {contract.filename} · v{contract.version}</b><small>Uploaded {contract.created_at?new Date(contract.created_at).toLocaleDateString():'—'} · {contract.signatures?.length||0} signatures</small></span>
     <span className={`contract-status ${contract.status==='signed'?'signed':contract.status==='approved_pending_signatures'?'signatures':'review'}`}><i/>{contract.status.replaceAll('_',' ')}</span>
     <span className="contract-parties">PDF · {contract.signatures?.length||0} signed</span>
     <button className="secondary-button compact-button" onClick={()=>openContract(contract.id)}>View PDF</button>
     {role==='Admin'&&pending(contract.status)&&<><button className="accept-button" onClick={()=>reviewContract(contract.id,true)}>Approve</button><button className="decline-button" onClick={()=>reviewContract(contract.id,false)}>Request changes</button></>}
     {role==='Admin'&&<div className="contract-admin-signatures">
      <label><input type="checkbox" checked={signed.includes(contract.project_client_id)} onChange={event=>toggleSignature(contract,contract.project_client_id,event.target.checked)}/> Client · {contract.project_client_name||`#${contract.project_client_id}`}</label>
      <label><input type="checkbox" checked={signed.includes(contract.project_owner_id)} onChange={event=>toggleSignature(contract,contract.project_owner_id,event.target.checked)}/> Product owner · {contract.project_owner_name||`#${contract.project_owner_id}`}</label>
      <button className="secondary-button small-button" onClick={()=>saveSignatures(contract)}>Save signatures</button>
      <button className="decline-button small-button" onClick={()=>removeContract(contract)}><Trash2 size={14}/> Delete</button>
     </div>}
     {role!=='Admin'&&contract.status==='approved_pending_signatures'&&canSign&&!contract.signatures?.some(signature=>signature.user_id===authUser?.id)&&<button className="accept-button" onClick={()=>signContract(contract.id)}>Sign</button>}
     {role!=='Admin'&&contract.status==='signed'&&canSign&&<button className="secondary-button compact-button" onClick={()=>requestAmendment(contract.id)}>Request amendment</button>}
    </article>
   })}
   {!filtered.length&&(live?<EmptyState icon={FileText} title="No contracts found" text="Uploaded agreements for your projects will appear here."/>:projects.map(project=><div className="contract-row" key={project.id}><span className="file-icon"><FileText size={19}/></span><span className="contract-title"><b>{project.name} · Sample project</b><small>Preview data · sign in to see stored contracts</small></span><span className="contract-status review"><i/>Preview only</span></div>))}
  </div>
  <div className="contract-footnote"><ShieldCheck size={15}/> Contract versions, review status, and signatures are synchronized with the server.</div>
 </>;
}
function TeamReview({projects,projectTeams,reviewTeam,authUser,apiPeople=[],role,notify,refreshTeams}){const [drafts,setDrafts]=useState({});useEffect(()=>{const token=localStorage.getItem('stride_token');if(!token)return;projects.filter(p=>p.serverId).forEach(async project=>{try{const response=await fetch(`/api/projects/${project.serverId}/teams`,{headers:{Authorization:`Bearer ${token}`}});if(response.ok){const rows=await response.json();refreshTeams?.(project.id,rows.map(t=>({...t,scrumMasterId:t.scrum_master_id,members:t.members.map(m=>m.user_id),scrumMasterStatus:t.review_status==='approved'?'accepted':'pending',reviewStatus:t.review_status})))}}catch{}})},[projects]);const canReview=role==='Employee'&&(!authUser||authUser.tags?.some(tag=>['scrum_master','product_owner'].includes(tag)));const personId=Object.entries(people).find(([,p])=>p.name===authUser?.name)?.[0];const label=id=>apiPeople.find(person=>String(person.id)===String(id))?.name||people[id]?.name||String(id);const visible=projects.filter(p=>(projectTeams[p.id]||[]).some(t=>t.reviewStatus==='pending'||t.reviewStatus==='owner_review'));return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> TEAM COMPOSITION</div><h1>Team review</h1><p className="lead">Scrum masters confirm or refine the proposed team. Project owners approve any changes.</p></div></div><div className="request-grid">{visible.flatMap(project=>(projectTeams[project.id]||[]).map((team,index)=>({project,team,index})).filter(x=>x.team.reviewStatus==='pending'||x.team.reviewStatus==='owner_review')).map(({project,team,index})=>{const ownTeam=!authUser||team.scrumMasterId===authUser.id||String(team.scrumMasterId)===String(personId);const ownerReview=team.reviewStatus==='owner_review';const isProjectOwner=!authUser||authUser.name===project.owner;const current=drafts[`${project.id}-${index}`]||team.members||[];const toggle=id=>setDrafts(old=>({...old,[`${project.id}-${index}`]:current.includes(id)?current.filter(x=>x!==id):[...current,id]}));return <article className="panel request-card" key={`${project.id}-${index}`}><div className="request-card-head"><span className="stage-badge">{ownerReview?'Owner approval':'Scrum master review'}</span><small>{team.name}</small></div><h2>{project.name}</h2><p>Scrum master: {label(team.scrumMasterId)||'Assigned lead'}</p><div className="team-review-members">{(apiPeople.length?apiPeople.filter(person=>person.role==='employee'&&!person.tags?.includes('product_owner')).map(person=>person.id):['MK','AL','SR','RP','TN']).map(id=><label key={id}><input type="checkbox" checked={current.some(x=>String(x)===String(id))} disabled={ownerReview||!ownTeam} onChange={()=>toggle(id)}/><Avatar id={id} name={label(id)} size="mini-avatar"/>{label(id)}</label>)}</div>{ownerReview&&canReview&&isProjectOwner?<button className="primary-button request-accept" onClick={()=>reviewTeam(project.id,index,'owner_approve')}>Accept revised team <Check size={15}/></button>:!ownerReview&&canReview&&ownTeam&&<div className="team-review-actions"><button className="secondary-button" onClick={()=>reviewTeam(project.id,index,'approve')}>Accept team <Check size={15}/></button><button className="primary-button" onClick={()=>reviewTeam(project.id,index,'edit',current)}>Propose member edits <Users size={15}/></button></div>}</article>})}{!visible.length&&<EmptyState icon={Users} title="No team reviews waiting" text="New team proposals appear here for their scrum masters."/>}</div></>};
function ClientRequests({projects,setProjects,setActiveProject,setModal,role,authUser,apiRequests=[],onRemoteComment,onRemoteAccept,notify}){const localRows=projects.filter(p=>p.requestOnly&&(role!=='Client'||!authUser||p.clientUserId===authUser.id)&&(!authUser||role!=='Employee'||!p.requestedOwner||p.requestedOwner===authUser.name));const remoteRows=apiRequests.map(r=>({id:`api-${r.id}`,requestId:r.id,projectId:r.project_id,remote:true,name:r.name,description:r.description,client:r.client_name,requestedOwner:r.requested_owner_name,ownerSelection:r.requested_owner_id?'specific':'request',requestStatus:requestStatuses[r.status]||'Open',requestComments:(r.comments||[]).map(c=>({author:c.sender_name,text:c.body})),due:r.target_date||'TBD'}));const rows=[...localRows,...remoteRows];const [reply,setReply]=useState({});const isOwner=role==='Employee'&&(!authUser||authUser.tags?.includes('product_owner'));const canReply=isOwner||role==='Client';const accept=id=>{const row=rows.find(x=>x.id===id);if(row?.remote){onRemoteAccept?.(row.requestId);return}setProjects(old=>old.map(p=>p.id===id?{...p,requestStatus:'Owner selected',owner:p.requestedOwner||authUser?.name||'Jordan Davis',health:'Owner selected'}:p));notify('You are now the product owner for this request')};const addReply=(id)=>{const text=(reply[id]||'').trim();if(!canReply||!text)return;const row=rows.find(x=>x.id===id);if(row?.remote){onRemoteComment?.(row.requestId,text);setReply(old=>({...old,[id]:''}));return}setProjects(old=>old.map(p=>p.id===id?{...p,requestComments:[...(p.requestComments||[]),{author:isOwner?(authUser?.name||'Alex Lee'):p.client,text,at:new Date().toISOString()}]}:p));setReply(old=>({...old,[id]:''}));notify('Reply added to the project request')};return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> CLIENT INTAKE</div><h1>Project requests</h1><p className="lead">Discuss the scope, follow the request status, and coordinate with your product owner.</p></div>{role==='Client'&&<button className="primary-button" onClick={()=>setModal('project')}><Plus size={16}/> New request</button>}</div><div className={`request-grid ${role==='Client'?'client-request-grid':''}`}>{rows.map(p=><article className="panel request-card" key={p.id}><div className="request-card-head"><span className="stage-badge">{p.requestStatus}</span><small>{p.ownerSelection==='specific'?`Requested ${p.requestedOwner}`:'Open to product owners'}</small></div><h2>{p.name}</h2><p>{p.description}</p><div className="request-meta">Client: {p.client} · target {p.due}</div><div className="request-comments">{(p.requestComments||[]).map((c,i)=><p key={i}><b>{c.author}:</b> {c.text}</p>)}</div>{canReply&&<div className="request-reply"><input value={reply[p.id]||''} onChange={e=>setReply(old=>({...old,[p.id]:e.target.value}))} placeholder={isOwner?'Reply to the client…':'Add a comment…'}/><button className="primary-button small-button" onClick={()=>addReply(p.id)}>Reply</button></div>}{isOwner&&p.requestStatus==='Open'&&<button className="secondary-button request-accept" onClick={()=>accept(p.id)}><Check size={15}/> Accept as product owner</button>}{isOwner&&['Owner selected','Taken'].includes(p.requestStatus)&&(!p.remote||projects.some(project=>project.id===`api-project-${p.projectId}`&&project.teamSetupStatus==='Not started'))&&<button className="secondary-button request-accept" onClick={()=>{setActiveProject(p.remote?`api-project-${p.projectId}`:p.id);setModal('teams')}}><Users size={15}/> Continue to team setup</button>}</article>)}{!rows.length&&<EmptyState icon={BriefcaseBusiness} title="No project requests yet" text={role==='Client'?'Submit a request to begin planning your project.':'New client requests will appear here.'}/>}</div></>};
function PeopleDirectory({role,apiPeople=[],openProfile}){const [query,setDirectoryQuery]=useState('');const [filter,setFilter]=useState('All people');const [remoteRows,setRemoteRows]=useState(apiPeople);const token=localStorage.getItem('stride_token');useEffect(()=>{if(!token){setRemoteRows(apiPeople);return}let active=true;const timer=setTimeout(()=>{const params=new URLSearchParams({q:query,limit:'30'});if(filter==='Product owners')params.set('tag','product_owner');if(filter==='Scrum masters')params.set('tag','scrum_master');if(filter==='Team members')params.set('tag','member');fetch(`/api/employees?${params}`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():[]).then(rows=>{if(active)setRemoteRows(rows)}).catch(()=>{if(active)setRemoteRows([])})},180);return()=>{active=false;clearTimeout(timer)}},[apiPeople,query,filter,token]);const source=token?remoteRows.map(person=>[String(person.id),{...person,initials:person.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase(),tone:'blue',services:person.services||[],portfolio:person.portfolio||[],tags:person.tags||[]} ]):Object.entries(people);const rows=source.filter(([id,p])=>{const text=`${p.name} ${p.id} ${p.role} ${(p.services||[]).join(' ')} ${(p.tags||[]).join(' ')}`.toLowerCase();const fit=filter==='All people'||filter==='Product owners'&&p.tags?.includes('product_owner')||filter==='Scrum masters'&&p.tags?.includes('scrum_master')||filter==='Team members'&&!p.tags?.includes('product_owner');return fit&&(!query||text.includes(query.toLowerCase()))});return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> PEOPLE & EXPERTISE</div><h1>Find the right teammate</h1><p className="lead">Browse verified skills, delivery levels, ratings, and project work.</p></div><label className="directory-search"><Search size={15}/><input value={query} onChange={event=>setDirectoryQuery(event.target.value)} placeholder="Search by name or ID"/></label></div><div className="directory-filters">{['All people','Product owners','Scrum masters','Team members'].map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="directory-grid">{rows.map(([id,p])=><button className="directory-card" key={id} onClick={()=>openProfile(id)}><div className="directory-person"><Avatar id={id} image={p.profile_photo_url} name={p.name}/><span><b>{p.name}</b><small>{p.primary_tag||p.role} · ID {id}</small></span><span className="level-pill">Lvl {p.level}</span></div><div className="profile-rating">★ {(employeeRating(id,p.rating||0)||'New')} <small>project rating</small></div><div className="profile-services">{p.services.map(x=><span key={x}>{x}</span>)}</div><div className="profile-portfolio"><b>Recent work</b><small>{p.portfolio.map(item=>typeof item==='string'?item:item.title).join(' · ')}</small></div><span className="profile-open">View profile <ArrowRight size={14}/></span></button>)}</div>{!rows.length&&<EmptyState icon={Search} title="No teammates found" text={query?"Try another name, employee ID, skill, or role.":"No employees have been added yet. Use the demo seeder or ask an admin to add staff."}/>}</>}
function EmployeeProfile({id,close,onContact,role:viewerRole,authUser,apiPeople=[],apiProjects=[],saveProfile,notify}){
 const role=viewerRole==='Client'?'Profile viewer':viewerRole;
 const remote=apiPeople.find(user=>String(user.id)===String(id));
 const [fetchedPerson,setFetchedPerson]=useState(null);
 const p=remote||fetchedPerson||people[id];
 const normalizeItem=item=>typeof item==='string'?{title:item,service:'',description:'',image_urls:[],external_urls:[]}:{title:item.title||'',service:item.service||'',description:item.description||'',image_urls:item.image_urls||[],external_urls:item.external_urls||[]};
 const [reviews,setReviews]=useState([]);
 const [article,setArticle]=useState(null);
 const [slideIndex,setSlideIndex]=useState(0);
 const [servicesDraft,setServicesDraft]=useState((p?.services||[]).join(', '));
 const [portfolioDraft,setPortfolioDraft]=useState((p?.portfolio||[]).map(normalizeItem));
 const [photoUrl,setPhotoUrl]=useState(p?.profile_photo_url||'');
 const [saving,setSaving]=useState(false);
 const [saved,setSaved]=useState(false);
 const [photo,setPhoto]=useState(p?.profile_photo_url||'');
 useEffect(()=>{if(remote||!/^[0-9]+$/.test(String(id)))return;const token=localStorage.getItem('stride_token');if(!token)return;let active=true;fetch(`/api/employees?q=${encodeURIComponent(id)}&limit=1`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():[]).then(rows=>{if(active)setFetchedPerson(rows.find(user=>String(user.id)===String(id))||null)}).catch(()=>{});return()=>{active=false}},[id,remote]);
 useEffect(()=>{if(!p)return;setServicesDraft((p.services||[]).join(', '));setPortfolioDraft((p.portfolio||[]).map(normalizeItem));setPhotoUrl(p.profile_photo_url||'')},[id,p?.id]);
 useEffect(()=>{const token=localStorage.getItem('stride_token');if(!token||!/^[0-9]+$/.test(String(id)))return;let active=true;fetch(`/api/employees/${id}/reviews`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():[]).then(rows=>{if(active)setReviews(rows)}).catch(()=>{});return()=>{active=false}},[id]);
 if(!p)return <div className="recipient-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="employee-profile-dialog profile-loading"><button className="icon-plain profile-close" onClick={close}><X size={18}/></button><Search size={22}/><b>Loading employee profile…</b></div></div>;
 const isOwnProfile=role==='Employee'&&(!authUser||String(authUser.id)===String(id));
 const updatePortfolio=(index,key,value)=>setPortfolioDraft(old=>old.map((item,i)=>i===index?{...item,[key]:value}:item));
 const saveDetails=async()=>{setSaving(true);setSaved(false);try{await saveProfile?.(id,{services:servicesDraft.split(',').map(x=>x.trim()).filter(Boolean),portfolio:portfolioDraft.filter(item=>item.title.trim()).map(item=>({...item,title:item.title.trim(),image_urls:(Array.isArray(item.image_urls)?item.image_urls:String(item.image_urls||'').split(/\n/)).map(x=>x.trim()).filter(Boolean),external_urls:(Array.isArray(item.external_urls)?item.external_urls:String(item.external_urls||'').split(/\n/)).map(x=>x.trim()).filter(Boolean)})),profile_photo_url:photoUrl.trim()||null});setSaved(true)}catch(error){notify(error.message)}finally{setSaving(false)}};
 const upload=async event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>5*1024*1024){notify('Profile photos must be 5 MB or smaller');return}const body=new FormData();body.append('file',file);try{const response=await fetch('/api/users/me/profile-photo',{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`},body});const user=await response.json();if(!response.ok)throw new Error(user.detail||'Could not save profile photo');setPhoto(user.profile_photo_url);setPhotoUrl(user.profile_photo_url);await saveProfile?.(id,{services:p.services||[],portfolio:p.portfolio||[],profile_photo_url:user.profile_photo_url});notify('Profile photo saved and shared with your team')}catch(error){notify(error.message)}};
 const projects=Object.entries(people).length?portfolioDraft.map(normalizeItem):(p.portfolio||[]).map(normalizeItem);
 const currentArticle=article&&projects.find(item=>item.title===article.title)||article;
 const images=currentArticle?.image_urls||[];
 return <div className="recipient-overlay profile-page-overlay" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className={`employee-profile-dialog profile-page ${article?'case-study-page':''}`}><button className="icon-plain profile-close" aria-label="Close profile" onClick={close}><X size={18}/></button>{article?<><button className="profile-back-button" onClick={()=>{setArticle(null);setSlideIndex(0)}}><ChevronLeft size={16}/> Back to {p.name}'s profile</button><div className="case-study-hero"><div className="case-study-image">{images.length?<img src={images[slideIndex%images.length]} alt={`${currentArticle.title} showcase ${slideIndex+1}`}/>:<div className="case-study-image-placeholder"><FolderKanban size={34}/><span>PROJECT SHOWCASE</span></div>}{images.length>1&&<div className="case-study-slideshow"><button aria-label="Previous image" onClick={()=>setSlideIndex(index=>(index-1+images.length)%images.length)}><ChevronLeft size={18}/></button><span>{slideIndex+1} / {images.length}</span><button aria-label="Next image" onClick={()=>setSlideIndex(index=>(index+1)%images.length)}><ChevronRight size={18}/></button></div>}</div><div className="case-study-intro"><span className="profile-eyebrow">CASE STUDY · {currentArticle.service||'SELECTED WORK'}</span><h1>{currentArticle.title}</h1><p>{currentArticle.description||'Project overview and delivery details will be added by this employee.'}</p><div className="case-study-meta"><Avatar id={id} image={p.profile_photo_url} name={p.name}/><span><b>{p.name}</b><small>Level {p.level||1} · {currentArticle.service||p.role}</small></span></div>{currentArticle.external_urls?.length>0&&<div className="case-study-links">{currentArticle.external_urls.map((url,index)=><a key={url} href={url} target="_blank" rel="noreferrer">{index===0?'View live project':'Project link'} <ArrowRight size={14}/></a>)}</div>}</div></div></>:<><div className="profile-eyebrow">EMPLOYEE PROFILE <span>· ID {p.id||id}</span></div><div className="profile-hero"><Avatar id={id} image={photo||p.profile_photo_url} name={p.name}/><span><h2>{p.name}</h2><small>{p.primary_tag||p.role}{p.tags?.length?` · ${p.tags.map(tag=>tag.replaceAll('_',' ')).join(' · ')}`:''}</small></span><span className="level-pill">Level {p.level||1}</span></div><div className="profile-summary-row"><div className="profile-rating large">★ {reviews.length?`${(reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length).toFixed(1)} · ${reviews.length} reviews`:Number(p.rating)>0?Number(p.rating).toFixed(1):'New'} <small>team feedback</small></div><span className="profile-id-chip">Employee ID {p.id||id}</span></div>{isOwnProfile&&<div className="profile-editor"><div className="profile-editor-heading"><div><span className="eyebrow">YOUR PUBLIC WORKSPACE PROFILE</span><h3>Make your experience easy to find</h3><p>Add services and project case studies clients can review.</p></div><Users size={20}/></div><div className="profile-photo-editor"><Avatar id={id} image={photo||p.profile_photo_url} name={p.name} size="profile-large-avatar"/><div><b>Profile photo</b><small>Square images work best · maximum 1 MB</small><label className="photo-upload">{photo?'Choose another photo':'Upload a photo'}<input type="file" accept="image/*" onChange={upload}/></label></div></div><div className="profile-edit-grid"><label>Profile photo URL<input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://your-image-url…"/></label><label>Services<input value={servicesDraft} onChange={e=>setServicesDraft(e.target.value)} placeholder="React, product design, SEO"/><small>Separate services with commas.</small></label></div><div className="portfolio-editor-heading"><h4>Case studies</h4><button className="secondary-button" onClick={()=>setPortfolioDraft(old=>[...old,{title:'',service:'',description:'',image_urls:[],external_urls:[]}])}><Plus size={14}/> Add project</button></div>{portfolioDraft.map((item,index)=><div className="portfolio-edit-card" key={index}><div className="portfolio-edit-top"><b>Case study {index+1}</b><button className="icon-square danger-icon" aria-label="Remove case study" onClick={()=>setPortfolioDraft(old=>old.filter((_,i)=>i!==index))}><Trash2 size={14}/></button></div><div className="profile-edit-grid"><label>Project title<input value={item.title} onChange={e=>updatePortfolio(index,'title',e.target.value)} placeholder="Project name"/></label><label>Service<input value={item.service} onChange={e=>updatePortfolio(index,'service',e.target.value)} placeholder="Frontend development"/></label><label className="profile-portfolio-field">Description<textarea rows="3" value={item.description} onChange={e=>updatePortfolio(index,'description',e.target.value)} placeholder="What was the goal, your contribution, and the outcome?"/></label><label>Showcase image URLs<textarea rows="2" value={(item.image_urls||[]).join('\n')} onChange={e=>updatePortfolio(index,'image_urls',e.target.value.split('\n'))} placeholder="One image URL per line"/></label><label>External project URLs<textarea rows="2" value={(item.external_urls||[]).join('\n')} onChange={e=>updatePortfolio(index,'external_urls',e.target.value.split('\n'))} placeholder="One live or case study URL per line"/></label></div></div>)}<div className="profile-save-row"><span>{saved?'Profile saved':'Changes appear in your employee profile.'}</span><button type="button" className="primary-button" disabled={saving} onClick={saveDetails}>{saving?'Saving…':saved?'Saved ✓':'Save profile'} <Check size={15}/></button></div></div>}<section className="profile-services-section"><h3>Services</h3><div className="profile-services">{(p.services||[]).length?p.services.map(service=>{const serviceReviews=reviews.filter(review=>review.service===service);const average=serviceReviews.length?serviceReviews.reduce((sum,review)=>sum+review.rating,0)/serviceReviews.length:null;return <div className="profile-service-row" key={service}><span>{service}</span><small>{average?`★ ${average.toFixed(1)} · ${serviceReviews.length} project review${serviceReviews.length===1?'':'s'}`:'No project reviews yet'}</small></div>}):<small className="profile-muted">No services added yet.</small>}</div></section><section className="profile-portfolio-section"><h3>Selected work</h3><div className="portfolio-list">{projects.length?projects.map((item,index)=><button className="portfolio-card" type="button" key={`${item.title}-${index}`} onClick={()=>{setArticle(item);setSlideIndex(0)}}><span className="portfolio-art">{item.image_urls?.[0]?<img src={item.image_urls[0]} alt=""/>:<FolderKanban size={22}/>}</span><span className="portfolio-card-copy"><b>{item.title}</b><small>{item.service||'Case study'} · Open project article</small></span><ArrowRight size={16}/></button>):<small className="profile-muted">Portfolio projects will appear here.</small>}</div></section>{reviews.length>0&&<section className="profile-reviews-section"><h3>Project reviews</h3><div className="profile-reviews-list">{reviews.map(review=><article key={review.id}><div><b>{review.service}</b><span>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div><p>{review.comment||'No written feedback was added.'}</p><small>{review.client_name||'Client'} · {review.project_name||'Completed project'}</small></article>)}</div></section>}<button className="primary-button profile-message" onClick={()=>{close();onContact?.()}}>Contact teammate <MessageSquareText size={15}/></button>{role==='Client'&&<div className="profile-rating-panel"><div><b>Review a completed service</b><small>Service reviews open after project completion. Low and high ratings both help teams improve.</small></div><select value={ratingProject} onChange={e=>setRatingProject(e.target.value)}><option value="">Select completed project</option>{completedProjects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select><select value={ratingService} onChange={e=>setRatingService(e.target.value)}>{(p.services?.length?p.services:['Overall service']).map(service=><option key={service}>{service}</option>)}</select><textarea rows="2" value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Share a short note about this service (optional)"/><div className="rate-employee-stars">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`Rate ${n} stars`} className={rating>=n?'rated':''} disabled={!ratingProject} onClick={()=>rate(n)}>★</button>)}</div></div>}</>}</div></div>
}
function PeoplePage({setView,notify}){const [users,setUsers]=useState([]);const [tags,setTags]=useState([]);const [reviews,setReviews]=useState([]);const [reviewDrafts,setReviewDrafts]=useState({});const [query,setQuery]=useState('');const [page,setPage]=useState(1);const [total,setTotal]=useState(0);const pageCount=Math.max(1,Math.ceil(total/25));const [roleFilter,setRoleFilter]=useState('');const [newTag,setNewTag]=useState('');const [tagDrafts,setTagDrafts]=useState({});const [messages,setMessages]=useState({});const [messageOpen,setMessageOpen]=useState(null);const [busy,setBusy]=useState(false);const token=localStorage.getItem('stride_token');const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};useEffect(()=>{let active=true;const timer=setTimeout(async()=>{setBusy(true);try{const params=new URLSearchParams({q:query,limit:'25',offset:String((page-1)*25),include_total:'true'});if(roleFilter)params.set('role',roleFilter);const [userResponse,tagResponse,reviewResponse]=await Promise.all([fetch(`/api/admin/users?${params}`,{headers}),fetch('/api/admin/tags',{headers}),fetch('/api/admin/reviews',{headers})]);const [userRows,tagRows,reviewRows]=await Promise.all([userResponse.json(),tagResponse.json(),reviewResponse.json()]);if(!userResponse.ok)throw new Error(userRows.detail||'Could not load accounts');if(!tagResponse.ok)throw new Error(tagRows.detail||'Could not load tags');if(!reviewResponse.ok)throw new Error(reviewRows.detail||'Could not load reviews');if(active){setUsers(userRows.items);setTotal(userRows.total);setTags(tagRows);setReviews(reviewRows);setReviewDrafts(Object.fromEntries(reviewRows.map(review=>[review.id,{rating:review.rating,service:review.service,comment:review.comment}])));setTagDrafts(Object.fromEntries(tagRows.map(tag=>[tag.id,tag.name])))}}catch(error){if(active)notify(error.message)}finally{if(active)setBusy(false)}},160);return()=>{active=false;clearTimeout(timer)}},[query,roleFilter,page]);const json=async(response)=>{const body=await response.json();if(!response.ok)throw new Error(body.detail||'The change could not be saved');return body};const updateTags=async(user,key,checked)=>{const next=checked?[...new Set([...(user.tags||[]),key])]:user.tags.filter(tag=>tag!==key);try{const result=await json(await fetch(`/api/users/${user.id}/tags`,{method:'PATCH',headers,body:JSON.stringify(next)}));setUsers(old=>old.map(item=>item.id===user.id?result:item));notify('User tags updated')}catch(error){notify(error.message)}};const updateRole=async(user,role)=>{try{const result=await json(await fetch(`/api/admin/users/${user.id}/role`,{method:'PATCH',headers,body:JSON.stringify({role})}));setUsers(old=>old.map(item=>item.id===user.id?result:item));notify('Account type updated')}catch(error){notify(error.message)}};const updateStatus=async(user,active)=>{try{await json(await fetch(`/api/admin/users/${user.id}/status`,{method:'PATCH',headers,body:JSON.stringify({active})}));setUsers(old=>old.map(item=>item.id===user.id?{...item,active}:item));notify(active?'Account activated':'Account suspended')}catch(error){notify(error.message)}};const createTag=async(event)=>{event.preventDefault();if(!newTag.trim())return;try{const tag=await json(await fetch('/api/admin/tags',{method:'POST',headers,body:JSON.stringify({name:newTag.trim()})}));setTags(old=>[...old,tag].sort((a,b)=>a.name.localeCompare(b.name)));setTagDrafts(old=>({...old,[tag.id]:tag.name}));setNewTag('');notify('Workspace tag created')}catch(error){notify(error.message)}};const saveTag=async(tag)=>{try{const updated=await json(await fetch(`/api/admin/tags/${tag.id}`,{method:'PATCH',headers,body:JSON.stringify({name:tagDrafts[tag.id]||tag.name})}));setTags(old=>old.map(item=>item.id===tag.id?{...item,...updated}:item));setUsers(old=>old.map(user=>({...user,tags:user.tags.map(key=>key===tag.key?updated.key:key)})));notify('Tag updated')}catch(error){notify(error.message)}};const deleteTag=async(tag)=>{if(!window.confirm(`Delete “${tag.name}” and remove it from assigned users?`))return;try{await json(await fetch(`/api/admin/tags/${tag.id}`,{method:'DELETE',headers}));setTags(old=>old.filter(item=>item.id!==tag.id));setUsers(old=>old.map(user=>({...user,tags:user.tags.filter(key=>key!==tag.key)})));notify('Tag deleted')}catch(error){notify(error.message)}};const saveReview=async(review)=>{const draft=reviewDrafts[review.id]||review;try{const updated=await json(await fetch(`/api/admin/reviews/${review.id}`,{method:'PATCH',headers,body:JSON.stringify(draft)}));setReviews(old=>old.map(item=>item.id===review.id?{...item,...updated}:item));notify('Review updated')}catch(error){notify(error.message)}};const deleteReview=async(review)=>{if(!window.confirm(`Delete the review for ${review.employee_name}?`))return;try{await json(await fetch(`/api/admin/reviews/${review.id}`,{method:'DELETE',headers}));setReviews(old=>old.filter(item=>item.id!==review.id));notify('Review removed')}catch(error){notify(error.message)}};const messageUser=async(user)=>{const body=(messages[user.id]||'').trim();if(!body)return;try{await json(await fetch('/api/messages/conversations',{method:'POST',headers,body:JSON.stringify({recipient_id:user.id,subject:'Message from Webflow administration',first_message:body})}));setMessageOpen(null);setMessages(old=>({...old,[user.id]:''}));setView('Messages');notify(`Message sent to ${user.name}`)}catch(error){notify(error.message)}};return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> WORKSPACE ADMINISTRATION</div><h1>People & access</h1><p className="lead">Manage account types, employee tags, access, and direct contact.</p></div><button className="secondary-button" onClick={()=>setView('People directory')}><Search size={15}/> Open directory</button></div><div className="admin-management-grid"><section className="panel admin-tags-panel"><div className="panel-heading"><div><h2>Employee tags</h2><p>Tags grant product owner and scrum master capabilities.</p></div><Tag size={18}/></div><form className="admin-tag-create" onSubmit={createTag}><input value={newTag} onChange={event=>setNewTag(event.target.value)} placeholder="Create a tag, e.g. QA lead" aria-label="New employee tag"/><button className="primary-button" type="submit"><Plus size={15}/> Add tag</button></form><div className="admin-tag-list">{tags.map(tag=><div className="admin-tag-row" key={tag.id}><input value={tagDrafts[tag.id]??tag.name} onChange={event=>setTagDrafts(old=>({...old,[tag.id]:event.target.value}))}/><code>{tag.key}</code><small>{tag.user_count} assigned</small><button className="secondary-button small-button" onClick={()=>saveTag(tag)}>Save</button><button className="icon-square danger-icon" aria-label={`Delete ${tag.name}`} onClick={()=>deleteTag(tag)}><Trash2 size={15}/></button></div>)}</div></section><section className="panel admin-accounts-panel"><div className="panel-heading"><div><h2>Accounts</h2><p>Set account type, capabilities, and active status.</p></div><span className="count-bubble">{users.length}</span></div><div className="admin-account-filters"><label className="directory-search"><Search size={15}/><input value={query} onChange={event=>{setPage(1);setQuery(event.target.value)}} placeholder="Search name, email, or user ID"/></label><select value={roleFilter} onChange={event=>{setPage(1);setRoleFilter(event.target.value)}}><option value="">All account types</option><option value="client">Clients</option><option value="employee">Employees</option><option value="admin">Admins</option></select></div>{busy&&!users.length?<div className="admin-loading">Loading accounts…</div>:<div className="admin-user-list">{users.map(user=><article className={`admin-user-row ${user.active?'':'suspended'}`} key={user.id}><div className="admin-user-heading"><Avatar id={user.id} name={user.name} image={user.profile_photo_url}/><span><b>{user.name}</b><small>{user.email} · ID {user.id}{user.organization_name?` · ${user.organization_name}`:null}{user.phone_number?` · ${user.phone_number}`:null}</small></span><select aria-label={`Account type for ${user.name}`} value={user.role} onChange={event=>updateRole(user,event.target.value)}><option value="client">Client</option><option value="employee">Employee</option><option value="admin">Admin</option></select><button className="secondary-button admin-message-toggle" onClick={()=>setMessageOpen(messageOpen===user.id?null:user.id)}><Mail size={14}/> Message</button><button className={`secondary-button account-status ${user.active?'':'activate'}`} onClick={()=>updateStatus(user,!user.active)}>{user.active?'Suspend':'Activate'}</button></div>{user.role==='employee'&&<div className="admin-user-tags">{tags.map(tag=><label key={tag.id}><input type="checkbox" checked={user.tags.includes(tag.key)} onChange={event=>updateTags(user,tag.key,event.target.checked)}/>{tag.name}</label>)}</div>}{messageOpen===user.id&&<div className="admin-message-compose"><textarea rows="2" value={messages[user.id]||''} onChange={event=>setMessages(old=>({...old,[user.id]:event.target.value}))} placeholder={`Write a direct message to ${user.name}…`}/><button className="primary-button" onClick={()=>messageUser(user)}><Mail size={14}/> Send message</button></div>}</article>)}{!busy&&!users.length&&<div className="admin-loading">No accounts match this search.</div>}</div>}<nav className="people-pagination" aria-label="User pages"><button className="secondary-button" disabled={busy||page<=1} onClick={()=>setPage(value=>value-1)}>Previous</button><span aria-live="polite">Page {page} of {pageCount} · {total} users</span><button className="secondary-button" disabled={busy||page>=pageCount} onClick={()=>setPage(value=>value+1)}>Next</button></nav></section></div><section className="panel admin-reviews-panel"><div className="panel-heading"><div><h2>Client service reviews</h2><p>Edit ratings or remove reviews that violate workspace standards.</p></div><span className="count-bubble">{reviews.length}</span></div>{reviews.length?<div className="admin-review-list">{reviews.map(review=>{const draft=reviewDrafts[review.id]||review;return <article className="admin-review-row" key={review.id}><div className="admin-review-context"><b>{review.employee_name} · {review.service}</b><small>{review.client_name} · {review.project_name}</small></div><label>Rating<select value={draft.rating} onChange={event=>setReviewDrafts(old=>({...old,[review.id]:{...draft,rating:Number(event.target.value)}}))}>{[1,2,3,4,5].map(value=><option key={value} value={value}>{value} / 5</option>)}</select></label><label>Service<input value={draft.service} onChange={event=>setReviewDrafts(old=>({...old,[review.id]:{...draft,service:event.target.value}}))}/></label><label className="admin-review-comment">Client comment<textarea rows="2" value={draft.comment} onChange={event=>setReviewDrafts(old=>({...old,[review.id]:{...draft,comment:event.target.value}}))}/></label><button className="secondary-button small-button" onClick={()=>saveReview(review)}>Save review</button><button className="icon-square danger-icon" aria-label="Delete review" onClick={()=>deleteReview(review)}><Trash2 size={14}/></button></article>})}</div>:<div className="admin-loading">No project reviews to moderate yet.</div>}</section></>}
function Reports({projects,tasks}){const [range,setRange]=useState(30);const [rangeOpen,setRangeOpen]=useState(false);return <><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> WORKSPACE INSIGHTS</div><h1>Reports</h1><p className="lead">A healthy view of delivery pace, project progress, and team flow.</p></div><div className="range-picker"><button className="secondary-button" aria-expanded={rangeOpen} onClick={()=>setRangeOpen(!rangeOpen)}><CalendarDays size={15}/> Last {range} days <ChevronDown size={14}/></button>{rangeOpen&&<div className="range-menu">{[7,30,90].map(days=><button key={days} onClick={()=>{setRange(days);setRangeOpen(false)}}>{days} days</button>)}</div>}</div></div><div className="stats-grid"><Stat icon={CheckCheck} tint="mint" label="Tasks completed" value="142" trend="↑ 18% vs. last month"/><Stat icon={Gauge} tint="violet" label="Average cycle time" value="3.2d" trend="↓ 0.8 days faster"/><Stat icon={Target} tint="blue" label="On-time delivery" value="92%" trend="↑ 4% this quarter"/><Stat icon={Activity} tint="amber" label="Active projects" value={String(projects.length).padStart(2,'0')} trend="Across 3 clients"/></div><div className="reports-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h2>Tasks completed</h2><p>Steady progress across the last 8 weeks.</p></div><span className="chart-legend"><i/> Completed</span></div><div className="bar-chart">{[35,56,43,72,61,82,65,92,74,86,69,98,78,88,74,100,84,96,78,92,82,100,87,95].map((v,i)=><div className="bar-col" key={i}><span style={{height:`${v}%`}}/></div>)}</div><div className="chart-labels"><span>May 1</span><span>May 15</span><span>Jun 1</span><span>Jun 16</span></div></div><div className="panel phase-report"><div className="panel-heading"><div><h2>Projects by phase</h2><p>Where work is happening.</p></div></div>{[['Design',3,'violet'],['Development',4,'blue'],['Optimisation',1,'mint']].map(([s,n,c])=><div className="phase-report-row" key={s}><span className={`phase-report-dot ${c}`}/><span>{s}</span><b>{n}</b><div className="tiny-bar"><i style={{width:`${n*18}%`}}/></div></div>)}</div></div></>}
async function messageRequest(path,options={}) {
 const response=await fetch(`/api/messages/${path}`,{
  ...options,
  headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'}
 });
 const data=await response.json();
 if(!response.ok) throw new Error(typeof data.detail==='string'?data.detail:'The message center could not complete your request.');
 return data;
}

function Messages({authUser,notify}) {
 const [directory,setDirectory]=useState([]);
 const [conversations,setConversations]=useState([]);
 const [activeId,setActiveId]=useState(null);
 const [thread,setThread]=useState(null);
 const [search,setSearch]=useState('');
 const [recipientSearch,setRecipientSearch]=useState('');
 const [draft,setDraft]=useState('');
 const [picker,setPicker]=useState(false);
 const [directoryState,setDirectoryState]=useState('loading');
 const [conversationState,setConversationState]=useState('loading');
 const [starting,setStarting]=useState(false);
 const [sending,setSending]=useState(false);
 const [refresh,setRefresh]=useState(0);
 const active=conversations.find(chat=>chat.id===activeId);
 const messages=thread?.id===activeId?thread.messages:[];
 useEffect(()=>{
  if(!picker)return;
  const controller=new AbortController();
  const timer=setTimeout(async()=>{
   try {
    const rows=await messageRequest(`people?q=${encodeURIComponent(recipientSearch.trim())}`,{signal:controller.signal});
    if(controller.signal.aborted)return;
    setDirectory(rows);
    setDirectoryState('ready');
   } catch {
    if(!controller.signal.aborted)setDirectoryState('error');
   }
  },180);
  return()=>{clearTimeout(timer);controller.abort()};
 },[picker,recipientSearch]);
 useEffect(()=>{
  const controller=new AbortController();
  let timer;
  async function load(){
   try {
    if(activeId!==null) {
     const data=await messageRequest(`conversations/${activeId}`,{signal:controller.signal});
     if(!controller.signal.aborted)setThread(data);
    }
    const chats=await messageRequest('conversations',{signal:controller.signal});
    if(controller.signal.aborted)return;
    setConversations(chats);
    setConversationState('ready');
   } catch {
    if(!controller.signal.aborted)setConversationState('error');
   } finally {
    if(!controller.signal.aborted)timer=setTimeout(load,5000);
   }
  }
  load();
  return()=>{controller.abort();clearTimeout(timer)};
 },[activeId,refresh]);
 function openPicker(){
  setRecipientSearch('');
  setDirectoryState('loading');
  setPicker(true);
 }
 function selectConversation(id){
  if(id===activeId)return;
  setDraft('');
  setActiveId(id);
 }
 async function startConversation(person,support=false){
  if(starting||sending)return;
  setStarting(true);
  try {
   const data=await messageRequest('conversations',{
    method:'POST',
    body:JSON.stringify({recipient_id:person?.id??null,support})
   });
   selectConversation(data.id);
   setRefresh(value=>value+1);
   setPicker(false);
  } catch(error){
   notify(error.message);
  } finally {
   setStarting(false);
  }
 }
 async function send(){
  const body=draft.trim();
  if(!body||!active||sending||thread?.id!==active.id)return;
  setSending(true);
  try {
   const message=await messageRequest(`conversations/${active.id}/messages`,{method:'POST',body:JSON.stringify({body})});
   setThread(previous=>previous?.id===active.id&&!previous.messages.some(item=>item.id===message.id)
    ?{...previous,messages:[...previous.messages,message]}:previous);
   setDraft(current=>current===draft?'':current);
   setRefresh(value=>value+1);
  } catch(error) {
   notify(error.message);
  } finally {
   setSending(false);
  }
 }
 const visible=conversations.filter(c=>`${c.person?.name||''} ${c.subject||''} ${c.last_message||''}`.toLowerCase().includes(search.toLowerCase()));return <><div className="welcome-row messages-title"><div><div className="eyebrow"><span className="eyebrow-dot"/> TEAM CONVERSATIONS</div><h1>Message center</h1><p className="lead">Talk directly with anyone in your workspace, or contact support.</p></div></div>{conversationState==='error'&&<p className="auth-error" role="alert">Could not refresh messages. Retrying shortly.</p>}<div className="messages-layout"><aside className="panel conversation-sidebar"><div className="conversation-tools"><label className="conversation-search"><Search size={16}/><input placeholder="Search people or messages" value={search} onChange={e=>setSearch(e.target.value)}/></label><button className="new-message-icon" title="New message" onClick={openPicker}><Plus size={17}/></button></div><button className="support-contact" disabled={starting||sending} onClick={()=>startConversation(null,true)}><span><LifeBuoy size={17}/></span><span><b>Contact support</b><small>We usually reply within a few hours</small></span><ChevronRight size={15}/></button><div className="conversation-label">RECENT MESSAGES <span>{conversations.length}</span></div><div className="conversation-list">{visible.map(c=><button key={c.id} className={`conversation-row ${String(c.id)===String(activeId)?'active':''}`} disabled={sending} onClick={()=>selectConversation(c.id)}><Avatar id={c.person?.id} name={c.person?.name||c.subject} image={c.person?.profile_photo_url} size="conversation-avatar"/><span className="conversation-copy"><span><b>{c.person?.name||c.subject||'Conversation'}</b><time>{timeAgo(c.last_message_at)}</time></span><small>{c.last_message||'Start a conversation'}</small></span>{c.unread_count>0&&<i className="conversation-unread">{c.unread_count}</i>}</button>)}</div>{visible.length===0&&<div className="conversation-empty">{conversationState==='loading'?'Loading conversations…':search?'No conversations match that search.':'No conversations yet.'}</div>}</aside><section className="panel message-thread">{active?<><header className="thread-header"><Avatar id={active.person?.id} name={active.person?.name||active.subject} image={active.person?.profile_photo_url} size="thread-avatar"/><span><b>{active.person?.name||active.subject}</b><small><i/> {active.person?.role||'Webflow workspace'}</small></span><button className="icon-plain" title="Conversation details" onClick={()=>notify(active.person?`${active.person.name} · ${active.person.role}`:active.subject)}><MoreHorizontal size={19}/></button></header><div className="thread-context">{active.kind==='support'?<><LifeBuoy size={14}/> Webflow Support · Workspace help</>:<><LockKeyhole size={13}/> Private conversation · only participants can see these messages</>}</div><div className="message-scroll">{thread?.id!==activeId?<div className="thread-empty">Loading conversation…</div>:messages.length===0?<div className="thread-empty"><span><MessageSquareText size={23}/></span><b>Start the conversation</b><small>Messages and delivery updates will show here.</small></div>:messages.map(m=>{const mine=m.sender_id===authUser.id;return <div key={m.id} className={`message-line ${mine?'outgoing':''}`}><div className="message-bubble"><p>{m.body}</p><span className="message-meta">{new Date(m.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}{mine&&<em className={m.status==='read'?'read':''}>{m.status==='read'?'✓✓':m.status==='delivered'?'✓✓':'✓'} {m.status||'sent'}</em>}</span></div></div>})}</div><div className="composer"><textarea aria-label="Message" maxLength={10000} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Write a message…" rows="1"/><div><span>Enter to send · Shift + Enter for a new line</span><button className="send-button" aria-label="Send message" disabled={sending||!draft.trim()||thread?.id!==activeId} onClick={send}><ArrowRight size={17}/></button></div></div></>:<div className="thread-empty"><span><MessageSquareText size={23}/></span><b>Select a conversation</b><small>Choose a person or contact support to get started.</small><button className="primary-button" onClick={openPicker}><Plus size={15}/> New message</button></div>}</section></div>{picker&&<div className="recipient-overlay" onMouseDown={e=>e.target===e.currentTarget&&setPicker(false)}><div className="recipient-dialog" role="dialog" aria-modal="true" aria-label="New message" onKeyDown={event=>{if(event.key==='Escape')setPicker(false)}}><div className="recipient-heading"><span><b>New message</b><small>Choose someone from your workspace.</small></span><button className="icon-plain" aria-label="Close recipient picker" onClick={()=>setPicker(false)}><X size={18}/></button></div><label className="recipient-search"><Search size={15}/><input autoFocus aria-label="Find a recipient" placeholder="Search by name or email" value={recipientSearch} onChange={e=>{setDirectoryState("loading");setRecipientSearch(e.target.value)}}/></label><div className="recipient-list">{directoryState!=='ready'||!directory.length?<p role="status" className="conversation-empty">{directoryState==='loading'?'Searching…':directoryState==='error'?'Could not load recipients. Try searching again.':'No other workspace members match.'}</p>:directory.map(person=><button key={person.id} disabled={starting||sending} onClick={()=>startConversation(person)}><Avatar id={person.id} name={person.name} image={person.profile_photo_url}/><span><b>{person.name}</b><small>{person.role}</small></span><ChevronRight size={15}/></button>)}</div><button className="support-contact recipient-support" disabled={starting||sending} onClick={()=>startConversation(null,true)}><span><LifeBuoy size={17}/></span><span><b>Contact support</b><small>Open a help request with Webflow support.</small></span><ChevronRight size={15}/></button></div></div>}</>}
function Growth({authUser,tasks=[]}) {
 const done=tasks.filter(task=>task.status==='Done');
 const xp=authUser?.experience_points||0;
 const level=authUser?.level||1;
 const nextLevel=level*100;
 const currentLevelXp=xp%100;
 const monthStart=new Date();
 monthStart.setDate(1);
 monthStart.setHours(0,0,0,0);
 const reward={Simple:10,Standard:20,Complex:35};
 const earnedThisMonth=done.filter(task=>task.completedAt&&new Date(task.completedAt)>=monthStart).reduce((sum,task)=>sum+(reward[task.complexity]||15),0);
 const dated=done.filter(task=>task.due&&task.due!=='TBD'&&task.completedAt);
 const onTime=dated.length?Math.round(dated.filter(task=>new Date(task.completedAt)<=new Date(`${task.due}T23:59:59`)).length*100/dated.length):null;
 return <>
  <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> CONTRIBUTOR PROFILE</div><h1>Your growth</h1><p className="lead">Your progress is based on completed work and earned experience.</p></div><span className="level-chip"><Zap size={15}/> Level {level} · Contributor</span></div>
  <div className="growth-hero"><div className="growth-level"><span>YOUR LEVEL</span><b>{String(level).padStart(2,'0')}</b><small>Contributor</small></div><div className="growth-progress"><h2>{xp?'You are building momentum.':'Your growth starts with your first completed task.'}</h2><p>{100-currentLevelXp} XP to reach Level {level+1}.</p><Progress value={currentLevelXp}/><div><span>{xp} XP total</span><span>{nextLevel} XP · Level {level+1}</span></div></div><div className="growth-badge"><span>✦</span><b>{done.length} tasks completed</b><small>{earnedThisMonth} XP earned this month</small></div></div>
  <div className="stats-grid"><Stat icon={CheckCheck} tint="mint" label="Tasks solved" value={String(done.length)} trend="Completed assigned tasks"/><Stat icon={Target} tint="violet" label="Complex tasks" value={String(done.filter(task=>task.complexity==='Complex').length)} trend="Completed complex tasks"/><Stat icon={Zap} tint="amber" label="Experience points" value={String(xp)} trend={`+${earnedThisMonth} this month`}/><Stat icon={Activity} tint="blue" label="On-time completion" value={onTime===null?'—':`${onTime}%`} trend={dated.length?'Based on tasks with due dates':'No completed tasks with due dates yet'}/></div>
  <div className="panel level-guide"><h2>How contributor levels work</h2><p>Every completed task earns experience based on its complexity. Complex work is matched with higher-level contributors; your project owner can always review assignments.</p></div>
 </>;
}
function SettingsPage({role,authUser,onSignIn,onSave}) {
 const [busy,setBusy]=useState(false);
 const [photoBusy,setPhotoBusy]=useState(false);
 const [feedback,setFeedback]=useState(null);
 async function savePhoto(event) {
  const file=event.target.files?.[0];
  if(!file)return;
  if(file.size>5*1024*1024){setFeedback({error:true,text:'Profile photos must be 5 MB or smaller.'});return}
  setPhotoBusy(true);
  setFeedback(null);
  try{
   const body=new FormData();
   body.append('file',file);
   const response=await fetch('/api/users/me/profile-photo',{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`},body});
   const user=await response.json();
   if(!response.ok)throw new Error(user.detail||'Could not save profile photo');
   onSave(user);
   setFeedback({text:'Profile photo updated and shared with your team.'});
  }catch(error){setFeedback({error:true,text:error.message})}
  finally{setPhotoBusy(false);event.target.value=''}
 }
 async function save(event) {
  event.preventDefault();
  const form=event.currentTarget;
  const fields=new FormData(form);
  const password=fields.get('new_password');
  if(password!==fields.get('confirm_password')){
   setFeedback({error:true,text:'The new passwords do not match.'});
   return;
  }
  setBusy(true);
  setFeedback(null);
  try {
   const response=await fetch('/api/auth/me',{
    method:'PATCH',
    headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},
    body:JSON.stringify({username:fields.get('username').trim()||null,email:fields.get('email').trim(),current_password:fields.get('current_password'),new_password:password||null})
   });
   const user=await response.json();
   if(!response.ok) throw new Error(typeof user.detail==='string'?user.detail:'Check your username, email, and password.');
   onSave(user);
   form.reset();
   setFeedback({text:'Account settings saved.'});
  } catch(error) {
   setFeedback({error:true,text:error.message});
  } finally {
   setBusy(false);
  }
 }
 return <>
  <div className="welcome-row"><div><h1>Settings</h1><p className="lead">Manage your sign-in details.</p></div></div>
  <section className="panel settings-content account-settings">
   <div className="account-settings-heading">
    <span className="account-settings-icon"><ShieldCheck size={21}/></span>
    <div><h2>Account settings</h2>{authUser&&<p>{authUser.name} · {role}</p>}</div>
   </div>
   {!authUser?<><p>Sign in to manage your username, email, and password.</p><button className="primary-button" onClick={onSignIn}>Sign in</button></>
   :authUser.active===false?<p role="status">This account is suspended. Contact workspace support for help.</p>
   :<form onSubmit={save}>
    <div className="settings-photo-row"><Avatar id={authUser.id} name={authUser.name} image={authUser.profile_photo_url} size="profile-large-avatar"/><div><b>Profile picture</b><small>Shown on your account and to your project teammates. JPEG, PNG, GIF, or WebP · up to 5 MB.</small><label className="photo-upload">{photoBusy?'Uploading…':'Upload profile picture'}<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={photoBusy} onChange={savePhoto}/></label></div></div>
    <div className="account-fields">
     <label className="settings-field">Username<input name="username" autoComplete="username" defaultValue={authUser.username||''} maxLength={160} pattern="[A-Za-z0-9_.\-]{2,160}"/><small>Use letters, numbers, periods, underscores, or hyphens.</small></label>
     <label className="settings-field">Email address<input name="email" type="email" autoComplete="email" required defaultValue={authUser.email}/></label>
    </div>
    <fieldset><legend>Password</legend><p>Leave the new password fields empty to keep your current password.</p>
     <div className="account-fields">
      <label className="settings-field">New password<input name="new_password" type="password" autoComplete="new-password" minLength={8} maxLength={256}/></label>
      <label className="settings-field">Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" minLength={8} maxLength={256}/></label>
     </div>
    </fieldset>
    <div className="settings-form-footer">
     <label className="settings-field">Current password<input name="current_password" type="password" autoComplete="current-password" required/><small>Required to save changes.</small></label>
     <button className="primary-button" disabled={busy}>{busy?'Saving…':'Save changes'}</button>
    </div>
    {feedback&&<p className={feedback.error?'auth-error':'settings-success'} role={feedback.error?'alert':'status'}>{feedback.text}</p>}
   </form>}
  </section>
  {authUser?.role==='client'&&authUser.active!==false&&<ClientProfileSettings user={authUser} onSave={onSave}/>}
 </>;
}
function EmptyState({icon:Icon,title,text}){return <div className="empty-state"><Icon size={24}/><b>{title}</b><span>{text}</span></div>}
function AdminExperienceControls({notify}) {
 const [query,setQuery]=useState('');
 const [users,setUsers]=useState([]);
 const [amounts,setAmounts]=useState({});
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(null);
 useEffect(()=>{
  let active=true;
  const timer=setTimeout(async()=>{
   setLoading(true);
   try{
    const params=new URLSearchParams({q:query,limit:'12',offset:'0',include_total:'true'});
    const result=await workspaceRequest(`/admin/users?${params}`);
    if(active)setUsers(result.items||[]);
   }catch(error){if(active)notify(error.message)}
   finally{if(active)setLoading(false)}
  },160);
  return()=>{active=false;clearTimeout(timer)};
 },[query]);
 const adjust=async(user,sign)=>{
  const amount=Math.max(1,Math.floor(Number(amounts[user.id])||10));
  setBusy(user.id);
  try{
   const updated=await workspaceRequest(`/admin/users/${user.id}/experience`,{method:'PATCH',data:{delta:sign*amount}});
   setUsers(rows=>rows.map(row=>row.id===user.id?{...row,...updated}:row));
   notify(`${sign>0?'Added':'Removed'} ${Math.abs(updated.change)} XP ${sign>0?'to':'from'} ${user.name}.`);
  }catch(error){notify(error.message)}
  finally{setBusy(null)}
 };
 return <section className="panel admin-xp-panel"><div className="panel-heading"><div><h2>Experience points</h2><p>Search for any account to award or remove XP.</p></div><Zap size={18}/></div><label className="directory-search admin-xp-search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search users by name, email, or ID"/></label>{loading&&!users.length?<div className="admin-loading">Searching accounts…</div>:users.length?<div className="admin-xp-list">{users.map(user=><article className="admin-xp-row" key={user.id}><Avatar id={user.id} name={user.name} image={user.profile_photo_url}/><span className="admin-xp-identity"><b>{user.name}</b><small>{user.role} · Level {user.level||1} · {user.experience_points||0} XP</small></span><label className="admin-xp-amount">Amount<input type="number" min="1" step="1" value={amounts[user.id]??10} onChange={event=>setAmounts(old=>({...old,[user.id]:event.target.value}))}/></label><button className="secondary-button" disabled={busy===user.id} onClick={()=>adjust(user,1)}><Plus size={14}/> Add XP</button><button className="secondary-button xp-remove-button" disabled={busy===user.id} onClick={()=>adjust(user,-1)}><Minus size={14}/> Remove XP</button></article>)}</div>:<div className="admin-loading">No accounts match this search.</div>}</section>;
}
function StepsEditor({steps,setSteps}){return <div className="steps-editor">{steps.map((step,index)=><div className="step-editor-row" key={index}><span className="step-editor-order">{String(index+1).padStart(2,'0')}</span><input aria-label={`Step ${index+1} name`} value={step.name||''} placeholder="Step name, e.g. Deployment" onChange={e=>setSteps(old=>old.map((item,i)=>i===index?{...item,name:e.target.value}:item))}/><button type="button" className="icon-plain" aria-label="Remove step" disabled={steps.length===1} onClick={()=>setSteps(old=>old.filter((_,i)=>i!==index))}><X size={15}/></button></div>)}<button type="button" className="add-step-button" onClick={()=>setSteps(old=>[...old,{name:'',description:''}])}><Plus size={14}/> Add project step</button></div>}
function LoginModal({close,authUser,onLogin,onLogout,onSettings}){const [register,setRegister]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setError('');setBusy(true);const fd=new FormData(e.currentTarget);const payload=register?{name:fd.get('name'),email:fd.get('email'),password:fd.get('password'),role:fd.get('role')}:{email:fd.get('email'),password:fd.get('password')};try{const res=await fetch(`/api/auth/${register?'register':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await res.json();if(!res.ok)throw new Error(data.detail||'Unable to sign in');localStorage.setItem('stride_token',data.access_token);onLogin(data.user)}catch(err){setError(err.message==='Failed to fetch'?'Cannot reach the API. Start the Docker stack or the FastAPI server, then try again.':err.message)}finally{setBusy(false)}}return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal-card auth-modal"><div className="modal-heading"><div><span className="modal-eyebrow">WEBFLOW PROJECT WORKSPACE</span><h2>{authUser?'Your account':register?'Create your account':'Welcome back'}</h2><p>{authUser?`${authUser.name} · ${authUser.role}`:register?'Create a client or employee account to get started.':'Sign in securely to your project workspace.'}</p></div><button className="icon-plain" onClick={close}><X size={19}/></button></div>{authUser?<div className="auth-account"><Avatar id={authUser.id} name={authUser.name} image={authUser.profile_photo_url}/><span><b>{authUser.name}</b><small>{authUser.email}</small></span><button className="secondary-button" onClick={onSettings}><Settings2 size={14}/> Settings</button><button className="secondary-button" onClick={onLogout}><LogOut size={14}/> Sign out</button></div>:<form onSubmit={submit}>{register&&<label className="form-label">Full name<input autoFocus required name="name" placeholder="Your name"/></label>}<label className="form-label">{register?"Email address":"Email or username"}<input key={String(register)} required name="email" type={register?"email":"text"} autoComplete={register?"email":"username"} placeholder={register?"you@company.com":"Email or username"} autoFocus={!register}/></label><label className="form-label">Password<input required name="password" type="password" minLength={register?8:undefined} autoComplete={register?"new-password":"current-password"}/></label>{register&&<label className="form-label">Account type<select name="role"><option value="client">Client</option><option value="employee">Employee</option></select></label>}{error&&<div className="auth-error">{error}</div>}<button type="submit" className="primary-button auth-submit" disabled={busy}>{busy?'Please wait…':register?'Create account':'Sign in'} <ArrowRight size={15}/></button><p className="auth-switch">{register?'Already have an account?':'New to Webflow?'} <button type="button" onClick={()=>{setRegister(!register);setError('')}}>{register?'Sign in':'Create an account'}</button></p></form>}</div></div>}
function UserSearchPicker({selected,onSelect,tag='',role='',teamId='',allowedIds=null,placeholder='Search by name or ID',fallback=[],preserveSelection=false}){
 const [query,setQuery]=useState('');const [results,setResults]=useState([]);const [open,setOpen]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const token=localStorage.getItem('stride_token');
 useEffect(()=>{if(!open)return;let active=true;const timer=setTimeout(async()=>{setLoading(true);setError('');try{let rows;if(token){const endpoint=role==='employee'||tag?'/api/employees':'/api/users';const params=new URLSearchParams({q:query,limit:'20'});if(tag)params.set('tag',tag);if(role)params.set('role',role);if(teamId)params.set('team_id',teamId);const response=await fetch(`${endpoint}?${params}`,{headers:{Authorization:`Bearer ${token}`}});const body=await response.json();if(!response.ok)throw new Error(body.detail||'People search is unavailable');rows=body}else{const roleMatch=person=>!role||person.role===role||role==='employee'&&Boolean(person.tags?.length);rows=fallback.filter(person=>{const text=`${person.name} ${person.id} ${person.role} ${(person.tags||[]).join(' ')}`.toLowerCase();return (!tag||person.tags?.includes(tag))&&roleMatch(person)&&(!query||text.includes(query.toLowerCase()))})}if(allowedIds)rows=rows.filter(person=>allowedIds.some(id=>String(id)===String(person.id)));if(active)setResults(rows)}catch(e){if(active){setResults([]);setError(e.message)}}finally{if(active)setLoading(false)}},180);return()=>{active=false;clearTimeout(timer)}},[open,query,tag,role,teamId,token,JSON.stringify(allowedIds),JSON.stringify(fallback)]);
 return <div className="user-search-picker"
  onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}
  onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false)}}}><div className="user-search-input-wrap"><Search size={16}/><input aria-label={placeholder} value={open?query:(selected?.name||'')} onFocus={()=>{setQuery('');setOpen(true)}} onChange={event=>{setQuery(event.target.value);if(!preserveSelection)onSelect(null);setOpen(true)}} placeholder={selected?.name||placeholder} autoComplete="off"/><small>{selected?`#${selected.id}`:'Name or ID'}</small></div>{open&&<div className="user-search-results">{loading?<div className="user-search-empty">Searching people…</div>:error?<div className="user-search-empty search-error">{error}</div>:results.length?results.map(person=><button type="button" key={person.id} onClick={()=>{onSelect(person);setQuery('');setOpen(false)}}><Avatar id={person.id} name={person.name} image={person.profile_photo_url} size="mini-avatar"/><span><b>{person.name}</b><small>{person.primary_tag||person.role||'Employee'} · ID {person.id}{person.level?` · Lvl ${person.level}`:''}</small></span><ChevronRight size={15}/></button>):<div className="user-search-empty">{query?'No matching people found.':'No people are available for this role yet. Ask an administrator to assign the required tag.'}</div>}</div>}{selected&&<button type="button" className="picker-clear" onClick={()=>{onSelect(null);setOpen(true)}}>Change selection</button>}</div>
}
function ContractProjectSearch({projects,selected,onSelect}) {
 const [query,setQuery]=useState(selected?.name||'');
 const [open,setOpen]=useState(false);
 const field=useRef(null);
 const matches=projects.filter(project=>`${project.name} ${project.client||''}`.toLowerCase().includes((selected?'':query).trim().toLowerCase()));
 return <div className="contract-project-search" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}
  onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();field.current?.focus();setOpen(false)}}}>
  <div className="form-label"><label htmlFor="contract-project">Project</label>
   <span className="contract-project-input"><Search size={16}/><input id="contract-project" ref={field} value={query}
    placeholder="Search by project or client" autoComplete="off" onFocus={()=>setOpen(true)}
    onChange={event=>{setQuery(event.target.value);onSelect(null);setOpen(true)}}/>
    <button type="button" aria-label="Show available projects" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><ChevronDown size={16}/></button>
   </span>
  </div>
  {open&&<div className="user-search-results" role="group" aria-label="Matching projects">
   {matches.length?matches.map(project=><button type="button" key={project.id} onClick={()=>{
    onSelect(project);setQuery(project.name);field.current?.focus();setOpen(false);
   }}><FolderKanban size={16}/><span><b>{project.name}</b><small>{project.client}</small></span>{selected?.id===project.id&&<Check size={16}/>}</button>)
   :<p className="user-search-empty" role="status">No matching projects.</p>}
  </div>}
 </div>;
}

function Modal({role,authUser,type,apiPeople=[],projectTeams=[],projectList=[],setActiveProject,postProjectRequest,uploadContract,saveProjectTeams,close,addTask,createProject,updateProjectSteps,cancelProject,activeProject,notify}){const [file,setFile]=useState(null);const [previewClient,setPreviewClient]=useState('');const [contractProject,setContractProject]=useState(activeProject||null);const [busy,setBusy]=useState(false);const [stage,setStage]=useState('Planning');const [projectSteps,setProjectSteps]=useState(type==='steps'?(activeProject.steps||defaultProjectSteps):defaultProjectSteps);const [step,setStep]=useState(1);const [projectData,setProjectData]=useState(null);const [proposal,setProposal]=useState([{key:'initial-team',name:'Delivery',lead:null,rosterIds:[]}]);const [rosters,setRosters]=useState([]);const [suggesting,setSuggesting]=useState(false);const [ownerMode,setOwnerMode]=useState('request');const [selectedOwner,setSelectedOwner]=useState(()=>authUser?.role==='employee'?authUser:null);const [selectedClient,setSelectedClient]=useState(null);const [selectedTeamId,setSelectedTeamId]=useState('');const [selectedAssignee,setSelectedAssignee]=useState(null);const [availableTeams,setAvailableTeams]=useState(projectTeams||[]);const [sprintOptions,setSprintOptions]=useState([]);const [teamsLoading,setTeamsLoading]=useState(false);useEffect(()=>{setAvailableTeams(projectTeams||[]);setSprintOptions([]);setSelectedTeamId('');setSelectedAssignee(null);if(!['task','ai'].includes(type))return;if(!activeProject?.serverId){try{const saved=JSON.parse(localStorage.getItem(`webflow_sprints_${activeProject?.id||'preview'}`)||'[]');setSprintOptions(saved.map(sprint=>({id:sprint.id,name:sprint.name,start_date:sprint.start,end_date:sprint.end})))}catch{}return}const token=localStorage.getItem('stride_token');if(!token)return;setTeamsLoading(true);const headers={Authorization:`Bearer ${token}`};Promise.all([fetch(`/api/projects/${activeProject.serverId}/teams`,{headers}),fetch(`/api/projects/${activeProject.serverId}/sprints`,{headers})]).then(async([teamsResponse,sprintsResponse])=>{const [teams,sprints]=await Promise.all([teamsResponse.ok?teamsResponse.json():[],sprintsResponse.ok?sprintsResponse.json():[]]);setAvailableTeams(teams);setSprintOptions(sprints)}).catch(()=>{}).finally(()=>setTeamsLoading(false))},[type,activeProject?.id,activeProject?.serverId]);const isTask=type==='task',isAi=type==='ai',isProject=type==='project',isTeams=type==='teams',isSteps=type==='steps',isCancel=type==='cancel',isContract=type==='contract';const title=isTask?'Create a task':isProject?'Start a project':isTeams?'Select project teams':isSteps?'Edit project steps':isCancel?'Request project cancellation':isContract?'Upload a contract':'Generate tasks with AI';const showProposal=isTeams||isProject&&step===2;
 useEffect(()=>{
  if(!showProposal||!authUser)return;
  const controller=new AbortController();
  workspaceRequest('/roster-teams',{signal:controller.signal}).then(setRosters).catch(error=>{if(!controller.signal.aborted)notify(error.message)});
  return()=>controller.abort();
 },[showProposal,authUser?.id]);
 async function suggestTeams(){
  setSuggesting(true);
  try{
   if(rosters.length){
    const suggestions=rosters.slice(0,4);
    setProposal(suggestions.map((team,index)=>({key:crypto.randomUUID(),name:suggestions.some((row,i)=>i<index&&row.name.toLowerCase()===team.name.toLowerCase())?`${team.name.slice(0,112)} (${index+1})`:team.name,
     lead:{id:team.owner_id,name:team.owner_name},rosterIds:[team.id]})));
   }else if(authUser){
    const masters=await workspaceRequest('/employees?tag=scrum_master&limit=4');
    if(!masters.length){notify('No active Scrum masters are available for a suggestion');return}
    const steps=projectData?.steps||activeProject?.steps||defaultProjectSteps;
    setProposal(masters.slice(0,Math.min(steps.length,4)).map((lead,index)=>({key:crypto.randomUUID(),
     name:typeof steps[index]==='string'?steps[index]:steps[index].name,lead,rosterIds:[]})));
   }else{notify('Sign in to generate team suggestions')}
  }catch(error){notify(error.message)}
  finally{setSuggesting(false)}
 }
 function selectedTeams(){
  const names=proposal.map(team=>team.name.trim());
  if(!names.length||names.some(name=>!name)||new Set(names.map(name=>name.toLowerCase())).size!==names.length){
   notify('Add at least one team and give each a unique name');return null;
  }
  if(proposal.some(team=>!team.lead)){notify('Choose a Scrum master for each team');return null}
  return proposal.map((team,index)=>({name:names[index],scrumMasterId:team.lead.id,rosterIds:team.rosterIds,members:[]}));
 }
 const cleanedSteps=()=>{const normalized=projectSteps.map(step=>({...step,name:(step.name||'').trim()}));const names=normalized.map(step=>step.name.toLocaleLowerCase());if(normalized.some(step=>!step.name)||new Set(names).size!==names.length){notify('Give every project step a unique name');return null}return normalized};const submit=async(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));if(isTask){if(!activeProject?.id){notify('Select a project before creating a task');return}const team=availableTeams.find(item=>String(item.id)===String(selectedTeamId))||availableTeams.find(item=>item.name===d.team);await addTask({title:d.title,label:team?.name||d.team,teamId:team?.id||(/^[0-9]+$/.test(String(selectedTeamId))?Number(selectedTeamId):null),sprintId:d.sprintId||'',status:'To do',priority:d.priority,complexity:d.complexity,points:Number(d.points),assignee:selectedAssignee?.id||null,description:d.description,due:d.due});return}else if(isTeams){const teams=selectedTeams();if(!teams)return;setBusy(true);try{await saveProjectTeams(activeProject?.id,teams)}finally{setBusy(false)}}else if(isSteps){const normalized=cleanedSteps();if(!normalized)return;updateProjectSteps(activeProject.id,normalized)}else if(isCancel){cancelProject(activeProject.id,d.reason)}else if(isProject&&step===1){const normalized=cleanedSteps();if(!normalized)return;if(role==='Client'&&ownerMode==='specific'&&!selectedOwner){notify('Search and choose a product owner first');return}if(role!=='Client'&&!selectedOwner){notify('Search and choose a project owner first');return}if(authUser&&role!=='Client'&&!selectedClient){notify('Search and choose the client account first');return}const data={...d,stage,steps:normalized,clientId:selectedClient?.id,client:selectedClient?.organization_name||selectedClient?.name||authUser?.organization_name||authUser?.name||d.client,ownerId:selectedOwner?.id,owner:selectedOwner?.name,requestedOwnerId:ownerMode==='specific'?selectedOwner?.id:null,requestedOwner:selectedOwner?.name};if(role==='Client'){postProjectRequest({...data,requestOnly:true,ownerSelection:d.ownerSelection,requestedOwnerId:data.requestedOwnerId,requestedOwner:data.requestedOwner,requestComment:d.requestComment});return}setProjectData(data);setStep(2)}else if(isProject){const teams=selectedTeams();if(!teams)return;setBusy(true);try{await createProject({...projectData,teams})}finally{setBusy(false)}}else if(isContract){if(!contractProject?.serverId){notify('Choose a project for this contract');return}if(!file){notify('Choose a PDF contract to upload');return}if(file.size>20*1024*1024){notify('PDF files must be 20 MB or smaller');return}setBusy(true);try{await uploadContract(file,contractProject.serverId)}finally{setBusy(false)}}else if(isAi){const scope=(d.scope||'').trim();if(!scope){notify('Paste the project scope or deliverables to draft tasks');return}let drafts;if(activeProject?.serverId&&authUser){setBusy(true);try{const token=localStorage.getItem('stride_token');const params=new URLSearchParams({scope});const response=await fetch(`/api/projects/${activeProject.serverId}/tasks/generate?${params}`,{method:'POST',headers:{Authorization:`Bearer ${token}`}});const body=await response.json();if(!response.ok)throw new Error(body.detail||'Task generation is unavailable for this project');drafts=body.drafts||[]}catch(error){setBusy(false);notify(error.message==='Failed to fetch'?'Cannot reach the API. Check that Docker is running.':error.message);return}}else{drafts=scope.split(/[\n.;]/).map(x=>x.replace(/^[-*•\d.) ]+/, '').trim()).filter(x=>x.length>2).slice(0,12).map(title=>({title,description:'Drafted from the project scope. Review and refine before delivery.',ai_generated:true}))}if(!drafts.length){setBusy(false);notify('Add clear deliverables, one per line, so tasks can be drafted');return}const team=availableTeams.find(item=>String(item.id)===String(selectedTeamId));for(let index=0;index<drafts.length;index++){const draft=drafts[index];const chosenSprint=d.sprintId==='all'?sprintOptions[index%sprintOptions.length]?.id:d.sprintId;const saved=await addTask({title:draft.title.slice(0,200),label:team?.name||'Unassigned',teamId:team?.id||null,status:'To do',priority:index<2?'High':'Medium',complexity:index<2?'Complex':'Standard',points:index<2?5:3,description:draft.description||'Drafted from the project scope. Review and refine before delivery.',due:'TBD',sprintId:chosenSprint||'',aiGenerated:true,batch:true});if(saved===false){setBusy(false);return}}setBusy(false);close();notify(`${drafts.length} task drafts added${d.sprintId?' to the selected sprint plan':' to the backlog'} for review`)}else{close();notify('Nothing to generate')}};return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className={`modal-card ${isProject&&role==='Client'?'client-request-modal':''}`}><div className="modal-heading"><div><span className="modal-eyebrow">{isTask?'TASK MANAGEMENT':isProject?(role==='Client'?'NEW CLIENT REQUEST':`NEW CLIENT ENGAGEMENT · STEP ${step} OF 2`):isTeams?'PROJECT TEAM SETUP':isSteps?'PROJECT DELIVERY PLAN':isCancel?'REQUEST REVIEW':isContract?'CONTRACTS & APPROVAL':'ASSISTED PLANNING'}</span><h2>{title}</h2><p>{isTask?'Add clear work for your project team.':isProject?step===1?(role==='Client'?'Share your request with a product owner. Team setup starts after they accept.':'Choose a client, owner, and delivery target.'):'Choose one or more teams. Each needs a scrum master.':isTeams?'Choose one or more teams and assign a tagged scrum master to each.':isSteps?'Add, rename, reorder, or remove steps to fit this project.':isCancel?'Tell the admin why you need to cancel. Your project stays active until the request is reviewed.':'Upload a PDF for the client and team to review.'}</p></div><button className="icon-plain" onClick={close}><X size={19}/></button></div><form onSubmit={submit}>
 {isSteps&&<StepsEditor steps={projectSteps} setSteps={setProjectSteps}/>}
 {isCancel&&<><label className="form-label">Reason for the request<textarea required name="reason" rows="4" minLength="5" placeholder="Share a few details to help the admin review your request…" autoFocus/></label><div className="form-note"><ShieldCheck size={16}/><span>The project will not be cancelled immediately. Your work remains active until an admin reviews this request.</span></div></>}
 {isProject&&step===1&&<><label className="form-label">Project name<input required name="name" placeholder="e.g. Customer portal" autoFocus/></label>{authUser&&role!=='Client'?<div className="form-label">Client account<UserSearchPicker selected={selectedClient} onSelect={setSelectedClient} role="client" placeholder="Search clients by name or ID…"/><input type="hidden" name="clientId" value={selectedClient?.id||''}/></div>:<label className="form-label">Client or organisation<input name="client" placeholder="Client company name" value={authUser?.organization_name||authUser?.name||previewClient} readOnly={!!authUser} onChange={authUser?undefined:event=>setPreviewClient(event.target.value)}/></label>}<label className="form-label">What are we building?<textarea name="description" rows="2" placeholder="A short description of the project scope…"/></label>{role==='Client'?<><label className="form-label">How should we find your product owner?<select name="ownerSelection" value={ownerMode} onChange={e=>setOwnerMode(e.target.value)}><option value="request">Post a request to product owners</option><option value="specific">Choose a specific product owner</option></select></label>{ownerMode==='specific'&&<div className="form-label">Choose product owner<UserSearchPicker selected={selectedOwner} onSelect={setSelectedOwner} tag="product_owner" role="employee" placeholder="Search product owners by name or ID…" fallback={Object.entries(people).map(([id,person])=>({...person,id}))}/><input type="hidden" name="requestedOwnerId" value={selectedOwner?.id||''}/></div>}<label className="form-label">Target delivery<input name="due" type="date"/></label><label className="form-label">Add a note for product owners<textarea name="requestComment" rows="2" placeholder="Describe what you need or ask a question…"/></label></>:<div className="form-row"><div className="form-label">Project owner<UserSearchPicker selected={selectedOwner} onSelect={setSelectedOwner} tag="product_owner" role="employee" placeholder="Search by name or ID…" fallback={Object.entries(people).map(([id,person])=>({...person,id}))}/><input type="hidden" name="ownerId" value={selectedOwner?.id||''}/></div><label className="form-label">Target delivery<input name="due" type="date"/></label></div>}<div className="form-label">Delivery steps<span className="form-hint">Tailor the visible milestones; you can change them later.</span><StepsEditor steps={projectSteps} setSteps={setProjectSteps}/></div></>}
 {showProposal&&<ProjectTeamProposal teams={proposal} setTeams={setProposal} rosters={rosters} picker={UserSearchPicker}/>}
 {isTask&&<><label className="form-label">Task title<input required name="title" placeholder="What needs to get done?" autoFocus/></label><label className="form-label">Description<textarea name="description" rows="3" placeholder="Add context, acceptance criteria, or links…"/></label><div className="form-row"><label className="form-label">Team<select name="teamId" value={selectedTeamId} required onChange={event=>{setSelectedTeamId(event.target.value);setSelectedAssignee(null)}}><option value="">Select project team</option>{(availableTeams.length?availableTeams:[{id:'preview-frontend',name:'Frontend'},{id:'preview-design',name:'Product design'},{id:'preview-backend',name:'Backend'},{id:'preview-content',name:'Content & SEO'}]).map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className="form-label">Add to<select name="sprintId" defaultValue=""><option value="">Backlog</option>{sprintOptions.map(sprint=><option key={sprint.id} value={sprint.id}>{sprint.name} · {sprint.start_date} – {sprint.end_date}</option>)}</select></label></div><div className="form-row"><label className="form-label">Complexity<select name="complexity"><option value="standard">Standard</option><option value="simple">Simple</option><option value="complex">Complex</option></select></label><label className="form-label">Priority<select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></label></div><div className="form-row"><div className="form-label">Assignee <span className="form-hint">Leave empty to use smart assignment.</span><UserSearchPicker selected={selectedAssignee} onSelect={setSelectedAssignee} role="employee" teamId={selectedTeamId} allowedIds={(()=>{const team=availableTeams.find(item=>String(item.id)===String(selectedTeamId));return team?.members?.filter(member=>typeof member==='object'?member.status==='accepted':true).map(member=>typeof member==='object'?member.user_id:member)||null})()} placeholder={selectedTeamId?'Search team members by name or ID…':'Select a team first'} fallback={Object.entries(people).map(([id,person])=>({...person,id}))}/><input type="hidden" name="assigneeId" value={selectedAssignee?.id||''}/></div><label className="form-label">Story points<select name="points"><option>2</option><option>1</option><option>3</option><option>5</option><option>8</option><option>13</option></select></label></div><label className="form-label">Due date<input type="date" name="due"/></label><div className="form-note"><Zap size={16}/><span>Tasks can go to the backlog or any sprint. Complex work is suggested for the highest-level available team member.</span></div></>}
 {isContract&&<>{role==='Admin'?<ContractProjectSearch projects={projectList.filter(item=>item.serverId)} selected={contractProject} onSelect={setContractProject}/>:<div className="form-label">Project<strong>{contractProject?.name||'No project selected'}</strong></div>}<label className="form-label">Contract name<input required name="name" placeholder="Project agreement"/></label><label className="upload-drop"><input type="file" accept="application/pdf,.pdf" onChange={e=>setFile(e.target.files?.[0])}/><span className="upload-file-icon"><FileText size={21}/></span><b>{file?file.name:'Choose a PDF or drop it here'}</b><small>{file?`${(file.size/1024/1024).toFixed(1)} MB · Ready to upload`:'PDF files up to 20 MB'}</small><span className="upload-browse">Browse files</span></label><div className="form-note"><LockKeyhole size={16}/><span>Uploading sends the document to the client and project team for visibility. Any edits require admin approval before they take effect.</span></div></>}
 {isAi&&<><div className="form-row"><label className="form-label">Team<select name="teamId" value={selectedTeamId} onChange={event=>setSelectedTeamId(event.target.value)}><option value="">Choose later / unassigned</option>{availableTeams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className="form-label">Sprint placement<select name="sprintId"><option value="">Backlog</option>{sprintOptions.map(sprint=><option key={sprint.id} value={sprint.id}>{sprint.name} · {sprint.start_date} – {sprint.end_date}</option>)}{sprintOptions.length>1&&<option value="all">Distribute across sprints</option>}</select></label></div><label className="form-label">Project scope<textarea required name="scope" rows="6" placeholder="Paste project deliverables, acceptance criteria, or requirements. Use one deliverable per line." autoFocus/></label><div className="form-note"><Sparkles size={16}/><span>Webflow drafts tasks from the scope and sends them to the selected backlog or sprint plan. Review each task before work starts.</span></div></>}
 <div className="modal-footer">{isProject&&step===2&&<button type="button" className="secondary-button" onClick={()=>setStep(1)}>← Back</button>}<button type="button" className="secondary-button" onClick={close}>Cancel</button>{showProposal&&<button type="button" className="secondary-button" disabled={busy||suggesting} onClick={suggestTeams}><Sparkles size={15}/> {suggesting?'Generating…':'Generate suggestion'}</button>}<button className="primary-button" type="submit" disabled={busy||suggesting||((isTask||isAi)&&teamsLoading)||(isContract&&!contractProject?.serverId)}>{busy?(isAi?'Drafting…':isContract?'Uploading…':'Submitting…'):isSteps?<>Save steps <Check size={15}/></>:isCancel?<>Send request <ArrowRight size={15}/></>:isTask?<><Plus size={15}/> Create task</>:isProject?<><ArrowRight size={15}/>{step===1?(role==='Client'?'Submit request':'Continue to teams'):'Submit selected'}</>:isContract?<><Paperclip size={15}/> Upload for review</>:isTeams?<>Submit selected <ArrowRight size={15}/></>:<><Sparkles size={15}/> Generate suggestions</>}</button></div></form></div></div>}
function TaskEditForm({task,onSave,onCancel}) {
 const [draft,setDraft]=useState({title:task.title||'',description:task.description||'',priority:task.priority||'Medium',complexity:task.complexity||'Standard',points:task.points??1,estimatedHours:task.estimatedHours??Number(task.points||1)*4,due:task.due==='TBD'?'':task.due||''});
 const [busy,setBusy]=useState(false);
 const submit=async event=>{
  event.preventDefault();
  if(!draft.title.trim()||Number(draft.points)<0||Number(draft.estimatedHours)<=0)return;
  setBusy(true);
  try{if(await onSave(task,{...draft,title:draft.title.trim(),points:Number(draft.points),estimatedHours:Number(draft.estimatedHours)}))onCancel()}
  finally{setBusy(false)}
 };
 return <form className="task-edit-form" onSubmit={submit}>
  <label>Task name<input required maxLength="240" value={draft.title} onChange={event=>setDraft(old=>({...old,title:event.target.value}))}/></label>
  <label>Description<textarea rows="4" value={draft.description} onChange={event=>setDraft(old=>({...old,description:event.target.value}))}/></label>
  <div className="form-row"><label>Priority<select value={draft.priority} onChange={event=>setDraft(old=>({...old,priority:event.target.value}))}>{['Low','Medium','High'].map(value=><option key={value}>{value}</option>)}</select></label><label>Complexity<select value={draft.complexity} onChange={event=>setDraft(old=>({...old,complexity:event.target.value}))}>{['Simple','Standard','Complex'].map(value=><option key={value}>{value}</option>)}</select></label></div>
  <div className="form-row"><label>Story points<input type="number" min="0" max="1000" step="1" value={draft.points} onChange={event=>setDraft(old=>({...old,points:event.target.value}))}/></label><label>Estimated hours<input type="number" min="0.25" max="10000" step="0.25" value={draft.estimatedHours} onChange={event=>setDraft(old=>({...old,estimatedHours:event.target.value}))}/></label></div>
  <label>Due date<input type="date" value={draft.due} onChange={event=>setDraft(old=>({...old,due:event.target.value}))}/></label>
  <div className="task-workflow-actions"><button type="button" className="secondary-button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={busy}>{busy?'Saving…':'Save changes'}</button></div>
 </form>;
}
function TaskDetail({task,close,setTasks,tasks,notify,changeStatus,updateTask,canEdit}) {
 const [comment,setComment]=useState('');
 const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem('webflow_saved_tasks')||'[]').includes(task.id)}catch{return false}});
 const [more,setMore]=useState(false);
 const [editing,setEditing]=useState(false);
 const toggleSave=()=>{const current=JSON.parse(localStorage.getItem('webflow_saved_tasks')||'[]');const next=saved?current.filter(x=>x!==task.id):[...current,task.id];localStorage.setItem('webflow_saved_tasks',JSON.stringify(next));setSaved(!saved)};
 const share=async()=>{const url=new URL(location.href);url.searchParams.set('task',task.id);try{await navigator.clipboard.writeText(url.toString());notify('Task link copied')}catch{notify(`Task reference: ${task.id}`)}};
 const addComment=()=>{if(!comment.trim())return;setTasks(old=>old.map(t=>t.id===task.id?{...t,comments:(t.comments||0)+1,commentItems:[...(t.commentItems||[]),{author:'You',text:comment.trim(),created_at:new Date().toISOString()}]}:t));setComment('');notify('Comment added to task activity')};
 return <div className="detail-backdrop" onMouseDown={event=>event.target===event.currentTarget&&close()}><aside className="task-detail"><div className="detail-top"><span className="task-id">{task.id}</span><div><div className="task-more-wrap"><button className="icon-plain" aria-label="More task actions" onClick={()=>setMore(!more)}><MoreHorizontal size={18}/></button>{more&&<div className="task-more-menu">{canEdit&&<button onClick={()=>{setEditing(true);setMore(false)}}>Edit task</button>}<button onClick={()=>{setTasks(old=>[{...task,id:`NS-${Date.now()}`,title:`Copy of ${task.title}`,status:'To do'},...old]);setMore(false);notify('Task duplicated')}}>Duplicate task</button><button onClick={()=>{setTasks(old=>old.filter(item=>item.id!==task.id));close();notify('Task deleted')}}>Delete task</button></div>}</div><button className="icon-plain" onClick={close}><X size={18}/></button></div></div><div className="detail-project"><span className="project-dot violet"/> {task.projectName||'Project'} <ChevronRight size={13}/> Task</div><h2>{task.title}</h2><div className="detail-tags"><span className={`stage-badge ${task.status.toLowerCase().replace(' ','-')}`}>{task.status}</span><span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority} priority</span><span className={`complexity ${task.complexity.toLowerCase()}`}>{task.complexity}</span></div><div className="detail-actions"><button className="secondary-button" onClick={share}><ArrowRight size={15}/> Share</button><button className="secondary-button" onClick={toggleSave}><span>{saved?'★':'☆'}</span> {saved?'Saved':'Save'}</button><button className="secondary-button" onClick={()=>changeStatus(task,task.status==='Done'?'To do':'Done')}><Check size={15}/> {task.status==='Done'?'Reopen':'Complete'}</button></div>{editing?<div className="detail-section"><h3>Edit task</h3><TaskEditForm key={task.id} task={task} onSave={updateTask} onCancel={()=>setEditing(false)}/></div>:<><div className="detail-section"><h3>Details</h3><p>{task.description||'Add a description to help your team understand the work.'}</p></div><div className="detail-properties"><div><span>Assignee</span><b><Avatar id={task.assignee} size="mini-avatar"/>{task.assigneeName||people[task.assignee]?.name||'Unassigned'}</b></div><div><span>Team</span><b><span className="label-tag">{task.label}</span></b></div><div><span>Priority</span><b>{task.priority}</b></div><div><span>Complexity</span><b>{task.complexity}</b></div><div><span>Story points</span><b><Target size={14}/>{task.points} points</b></div><div><span>Estimated time</span><b><Clock3 size={14}/>{task.estimatedHours??Number(task.points||1)*4} hours</b></div><div><span>Due date</span><b><CalendarDays size={14}/>{task.due}</b></div></div></>}<div className="detail-section"><h3>Activity <span className="count-bubble">{task.comments||0}</span></h3>{(task.commentItems||[]).map((item,index)=><p className="task-comment" key={index}><b>{item.author}</b><span>{item.text}</span></p>)}<div className="comment-row"><Avatar id="JD" size="mini-avatar"/><input placeholder="Leave a comment…" value={comment} onChange={event=>setComment(event.target.value)} onKeyDown={event=>event.key==='Enter'&&addComment()}/><button onClick={addComment}><ArrowRight size={15}/></button></div></div></aside></div>;
}

export default App;
