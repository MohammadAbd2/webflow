import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';

export async function workspaceRequest(path, options={}) {
 const { data, ...init }=options;
 const response=await fetch(`/api${path}`,{
  ...init,
  headers:{Authorization:`Bearer ${localStorage.getItem('stride_token')}`,'Content-Type':'application/json'},
  body:data===undefined?undefined:JSON.stringify(data)
 });
 const body=await response.text();
 let result;
 try{result=body?JSON.parse(body):null}catch{result=null}
 if(!response.ok){
  const detail=typeof result?.detail==='string'?result.detail:`Request failed (${response.status}${response.statusText?` ${response.statusText}`:''}).`;
  throw new Error(detail);
 }
 if(result===null)throw new Error('The workspace returned an invalid response. Please try again.');
 return result;
}

export const requestStatuses={open:'Open',taken:'Taken',approved:'Approved',completed:'Completed'};
const requestOptions=Object.entries(requestStatuses);
const formatDate=value=>value?new Date(value).toLocaleDateString(undefined,{timeZone:'UTC'}):'—';

export function AdminRequests({notify,openProject}) {
 const [rows,setRows]=useState([]);
 const [filter,setFilter]=useState('');
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [bulk,setBulk]=useState({current_status:'completed',from_date:'',through_date:'',action:'delete'});
 async function reload(){
  try {setRows(await workspaceRequest('/project-requests'));setError('')}
  catch(error){setError(error.message)}
  finally{setBusy(false)}
 }
 useEffect(()=>{reload();const timer=setInterval(reload,20000);return()=>clearInterval(timer)},[]);
 const visible=rows.filter(row=>!filter||row.status===filter);
 const matching=rows.filter(row=>row.status===bulk.current_status&&bulk.from_date&&bulk.through_date
  &&row.status_changed_at?.slice(0,10)>=bulk.from_date&&row.status_changed_at?.slice(0,10)<=bulk.through_date);
 async function change(data){
  if(data.action==='delete'&&!window.confirm(data.request_id?'Delete this client request and its comments?':'Delete the requests and comments matching these filters?'))return;
  setBusy(true);
  try{
   const result=await workspaceRequest('/admin/project-requests',{method:'PATCH',data});
   await reload();
   notify(`${result.affected} request${result.affected===1?'':'s'} ${data.action==='delete'?'deleted':'updated'}`);
  }catch(error){setError(error.message);setBusy(false)}
 }
 const changeBulk=(key,value)=>setBulk(current=>({...current,[key]:value}));
 return <>
  <div className="welcome-row"><div><h1>Client requests</h1><p className="lead">Review incoming requests and manage their status.</p></div><button className="secondary-button" onClick={reload}>Refresh</button></div>
  <form className="panel workflow-panel" onSubmit={event=>{event.preventDefault();change(bulk)}}>
   <h2>Bulk actions</h2><p>Filter by the date a request entered its current status. Dates are inclusive and use UTC.</p>
   <div className="workflow-fields">
    <label>Current status<select value={bulk.current_status} onChange={e=>changeBulk('current_status',e.target.value)}>{requestOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <label>From<input type="date" required value={bulk.from_date} onChange={e=>changeBulk('from_date',e.target.value)}/></label>
    <label>Through<input type="date" required min={bulk.from_date} value={bulk.through_date} onChange={e=>changeBulk('through_date',e.target.value)}/></label>
    <label>Action<select value={bulk.action} onChange={e=>changeBulk('action',e.target.value)}>{requestOptions.map(([value,label])=><option key={value} value={value}>Mark {label.toLowerCase()}</option>)}<option value="delete">Delete</option></select></label>
   </div>
   <div className="workflow-actions"><span>{matching.length} matching {matching.length===1?'request':'requests'}</span><button className="primary-button" disabled={busy||!matching.length}>Apply to matching requests</button></div>
   <div className="bulk-matching-requests" aria-live="polite">
    {matching.length?matching.map(row=><article key={row.id}><div><strong>{row.name}</strong><span>{row.client_name}</span></div><small>{requestStatuses[row.status]} since {formatDate(row.status_changed_at)}</small></article>)
     :<p>{bulk.from_date&&bulk.through_date?'No requests match this status and date range.':'Choose a date range to preview matching requests.'}</p>}
   </div>
  </form>
  {error&&<p className="auth-error" role="alert">{error}</p>}
  <section className="panel workflow-panel">
   <div className="workflow-actions"><h2>Request history</h2><label>Show <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All statuses</option>{requestOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
   {!visible.length&&<p>{busy?'Loading requests…':'No requests match this filter.'}</p>}
   {visible.map(row=><article key={row.id} className="workflow-row">
    <div><h3>{row.name}</h3><p>{row.client_name}{row.requested_owner_name?` · ${row.requested_owner_name}`:''}</p><p>{row.description}</p><small>Status changed {formatDate(row.status_changed_at)}</small>
     {!!row.comments?.length&&<details><summary>Request conversation</summary>{row.comments.map(comment=><p key={comment.id}><strong>{comment.sender_name}</strong> {comment.body}</p>)}</details>}</div>
    <div className="workflow-actions">
     {row.project_id&&<button className="secondary-button" onClick={()=>openProject(row.project_id)}>Open project <ChevronRight size={15}/></button>}
     <select aria-label={`Status for ${row.name}`} value={row.status} disabled={busy} onChange={e=>change({request_id:row.id,action:e.target.value})}>{requestOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
     <button className="decline-button" disabled={busy} onClick={()=>change({request_id:row.id,action:'delete'})}>Delete</button>
    </div>
   </article>)}
  </section>
 </>;
}

export function ClientProfileSettings({user,onSave}) {
 const [organization,setOrganization]=useState(user.organization_name||'');
 const [phone,setPhone]=useState(user.phone_number||'');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState(null);
 async function save(event){
  event.preventDefault();
  setBusy(true);
  setFeedback(null);
  try {
   const updated=await workspaceRequest('/auth/client-profile',{method:'PATCH',data:{organization_name:organization,phone_number:phone}});
   onSave(updated);
   setOrganization(updated.organization_name||'');
   setPhone(updated.phone_number||'');
   setFeedback({text:'Client profile saved.'});
  }catch(error){setFeedback({text:error.message,error:true})}
  finally{setBusy(false)}
 }
 return <section className="panel settings-content account-settings client-profile-settings">
  <h2>Client profile</h2><p>Your organization name appears on project requests. Your telephone number is visible to you and administrators.</p>
  <form onSubmit={save}>
   <div className="account-fields">
    <label className="settings-field">Organization name<input value={organization} onChange={e=>setOrganization(e.target.value)} maxLength={160} autoComplete="organization"/></label>
    <label className="settings-field">Telephone number<input value={phone} onChange={e=>setPhone(e.target.value)} maxLength={40} type="tel" autoComplete="tel"/></label>
   </div>
   <div className="workflow-actions"><button className="primary-button" disabled={busy}>{busy?'Saving…':'Save profile'}</button></div>
   {feedback&&<p className={feedback.error?'auth-error':'settings-success'} role={feedback.error?'alert':'status'}>{feedback.text}</p>}
  </form>
 </section>;
}

function EmployeeSelections({picker:Picker,chosen,onChange,rosters=[],exclude=[],showChosen=true}) {
 const [selected,setSelected]=useState(null);
 function add(person){
  if(person&&!exclude.includes(person.id)&&!chosen.some(existing=>existing.id===person.id))onChange([...chosen,person]);
 }
 return <div className="employee-selections">
  <div className="workflow-actions">
   <div className="employee-selection-picker"><Picker selected={selected} onSelect={setSelected} role="employee" placeholder="Search employees by name or ID"/></div>
   <button className="secondary-button" type="button" disabled={!selected||exclude.includes(selected.id)||chosen.some(person=>person.id===selected.id)}
    onClick={()=>{add(selected);setSelected(null)}}><Plus size={15}/> Add employee</button>
  </div>
  {rosters.map(team=><details key={team.id}><summary>{team.name} · {team.owner_name}</summary>
   <div className="workflow-checks">{team.members.filter(member=>!exclude.includes(member.user_id)).map(member=><label key={member.user_id}>
    <input type="checkbox" checked={chosen.some(person=>person.id===member.user_id)} onChange={event=>{
     if(event.target.checked)add({id:member.user_id,name:member.name});
     else onChange(chosen.filter(person=>person.id!==member.user_id));
    }}/>{member.name}</label>)}
    {!team.members.some(member=>!exclude.includes(member.user_id))&&<small>No available members.</small>}
   </div>
  </details>)}
  {showChosen&&chosen.length>0&&<div className="workflow-checks">{chosen.map(person=><button type="button" key={person.id}
   className="secondary-button" onClick={()=>onChange(chosen.filter(member=>member.id!==person.id))} aria-label={`Remove ${person.name}`}>{person.name}<X size={14}/></button>)}</div>}
 </div>;
}

function InviteMembers({team,rosters,picker,project,notify,onUpdate}) {
 const [chosen,setChosen]=useState([]);
 const [busy,setBusy]=useState(false);
 const exclude=team.members.filter(member=>member.status!=='rejected').map(member=>member.user_id);
 async function invite(event){
  event.preventDefault();
  setBusy(true);
  try{
   const result=await workspaceRequest(`/${project?'teams':'roster-teams'}/${team.id}/invitations`,{method:'POST',data:{user_ids:chosen.map(person=>person.id)}});
   onUpdate(result.team);
   setChosen([]);
   notify(`${result.invited} invitation${result.invited===1?'':'s'} sent`);
  }catch(error){notify(error.message)}
  finally{setBusy(false)}
 }
 return <form className="team-invite-form" onSubmit={invite}>
  <EmployeeSelections picker={picker} chosen={chosen} onChange={setChosen} rosters={rosters} exclude={exclude}/>
  <button className="primary-button" disabled={busy||!chosen.length}>{busy?'Sending…':'Send invitations'}</button>
 </form>;
}

export function ScrumTeams({picker,notify}) {
 const [teams,setTeams]=useState([]);
 const [rosters,setRosters]=useState([]);
 const [projects,setProjects]=useState([]);
 const [name,setName]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 async function reload(){
  setLoading(true);
  try{
   const [own,all,assigned]=await Promise.all([workspaceRequest('/roster-teams?mine=true'),workspaceRequest('/roster-teams'),workspaceRequest('/scrum-master/project-teams')]);
   setTeams(own);setRosters(all);setProjects(assigned);setError('');
  }catch(error){setError(error.message)}
  finally{setLoading(false)}
 }
 useEffect(()=>{reload()},[]);
 async function create(event){
  event.preventDefault();
  setBusy(true);
  try{
   const team=await workspaceRequest('/roster-teams',{method:'POST',data:{name}});
   setTeams(old=>[...old,team]);setName('');notify('Team created');
  }catch(error){notify(error.message)}
  finally{setBusy(false)}
 }
 return <>
  <div className="welcome-row"><div><h1>Teams</h1><p className="lead">Build reusable teams and invite colleagues to projects you lead.</p></div><button className="secondary-button" onClick={reload}>Refresh</button></div>
  {error&&<p role="alert" className="auth-error">{error}</p>}
  <section className="panel workflow-panel">
   <h2>Your teams</h2>
   <form className="workflow-actions" onSubmit={create}><label>Team name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={120} required/></label><button className="primary-button" disabled={busy}><Plus size={16}/> Create team</button></form>
   {loading&&<p>Loading teams…</p>}
   {teams.map(team=><article className="team-workflow-card" key={team.id}>
    <h3>{team.name}</h3>
    <div className="workflow-checks">{team.members.map(member=><span className="stage-badge" key={member.user_id}>{member.name} · {member.status}</span>)}</div>
    <InviteMembers team={team} picker={picker} notify={notify} onUpdate={updated=>setTeams(old=>old.map(row=>row.id===updated.id?updated:row))}/>
   </article>)}
  </section>
  <section className="panel workflow-panel">
   <h2>Project invitations</h2><p>Select employees from any team or search for an individual.</p>
   {!loading&&!projects.length&&<p>You are not leading any approved, open projects yet.</p>}
   {projects.map(team=><article className="team-workflow-card" key={team.id}>
    <h3>{team.project_name} · {team.name}</h3>
    <InviteMembers team={team} rosters={rosters} project picker={picker} notify={notify} onUpdate={updated=>setProjects(old=>old.map(row=>row.id===updated.id?updated:row))}/>
   </article>)}
  </section>
 </>;
}

export function RosterInvitations({notify}) {
 const [rows,setRows]=useState(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(null);
 useEffect(()=>{
  const controller=new AbortController();
  workspaceRequest('/roster-invitations',{signal:controller.signal}).then(setRows).catch(error=>{if(!controller.signal.aborted)setError(error.message)});
  return()=>controller.abort();
 },[]);
 async function respond(id,accept){
  setBusy(id);
  try{
   await workspaceRequest(`/roster-invitations/${id}/respond`,{method:'POST',data:{accept}});
   setRows(old=>old.filter(item=>item.id!==id));notify(accept?'Team invitation accepted':'Team invitation declined');
  }catch(error){setError(error.message)}
  finally{setBusy(null)}
 }
 return <section className="panel workflow-panel">
  <h2>Team invitations</h2>
  {error&&<p className="auth-error" role="alert">{error}</p>}
  {!rows?<p>{error?'Could not load team invitations.':'Loading team invitations…'}</p>:!rows.length&&<p>No team invitations waiting for a response.</p>}
  {rows?.map(row=><article className="workflow-row" key={row.id}>
   <div><h3>{row.team}</h3><p>Invited by {row.owner}</p></div>
   <div className="workflow-actions"><button className="secondary-button" disabled={busy!==null} onClick={()=>respond(row.id,false)}>Decline</button><button className="primary-button" disabled={busy!==null} onClick={()=>respond(row.id,true)}><Check size={15}/> Accept</button></div>
  </article>)}
 </section>;
}

function ProposalTeam({team,rosters,picker:Picker,onChange,onRemove}) {
 const [query,setQuery]=useState('');
 const matches=rosters.filter(row=>`${row.name} ${row.owner_name}`.toLowerCase().includes(query.trim().toLowerCase()));
 function toggle(row,checked){
  onChange({...team,lead:team.lead||(checked?{id:row.owner_id,name:row.owner_name}:null),
   rosterIds:checked?[...team.rosterIds,row.id]:team.rosterIds.filter(id=>id!==row.id)});
 }
 return <div className="team-config enabled">
  <div className="team-name-edit"><Users size={17}/><input aria-label="Team name" value={team.name} maxLength={120} placeholder="Project team name" onChange={event=>onChange({...team,name:event.target.value})}/>
   <button type="button" className="icon-plain" aria-label={`Remove ${team.name||'team'}`} onClick={onRemove}><X size={16}/></button>
  </div>
  <div className="team-config-fields proposal-fields">
   <div><span className="config-caption">SCRUM MASTER</span><Picker selected={team.lead} onSelect={lead=>onChange({...team,lead})} role="employee" tag="scrum_master" preserveSelection placeholder="Search scrum masters by name or ID"/></div>
   <div><label className="config-caption" htmlFor={`roster-search-${team.key}`}>WORKSPACE TEAMS</label>
    <div className="user-search-input-wrap"><Search size={15}/><input id={`roster-search-${team.key}`} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search teams by name or scrum master"/></div>
    <div className="workflow-checks">
     {matches.map(row=><label key={row.id}><input type="checkbox" checked={team.rosterIds.includes(row.id)} onChange={event=>toggle(row,event.target.checked)}/>
      <span><b>{row.name}</b><small>{row.owner_name} · {row.members.length} members</small></span></label>)}
     {!matches.length&&<small>{query?'No matching teams.':'No reusable teams are available. You can still select a scrum master.'}</small>}
    </div>
   </div>
  </div>
 </div>;
}

export function ProjectTeamProposal({teams,setTeams,rosters,picker}) {
 return <>
  <div className="team-config-list">
   {teams.map(team=><ProposalTeam key={team.key} team={team} rosters={rosters} picker={picker}
    onChange={updated=>setTeams(old=>old.map(row=>row.key===team.key?updated:row))}
    onRemove={()=>setTeams(old=>old.filter(row=>row.key!==team.key))}/>)}
  </div>
  <div className="team-add-row"><button type="button" className="secondary-button" onClick={()=>setTeams(old=>[...old,{key:crypto.randomUUID(),name:'',lead:null,rosterIds:[]}])}><Plus size={15}/> Add a project team</button></div>
  <div className="form-note"><ShieldCheck size={16}/><span>The admin reviews the selected teams. Approved members then receive a project invitation.</span></div>
 </>;
}

function AdminTeamEditor({team,picker:Picker,onSave,disabled}) {
 const leadName=team.members.find(person=>person.user_id===team.scrum_master_id)?.name;
 const [lead,setLead]=useState({id:team.scrum_master_id,name:leadName||`Employee #${team.scrum_master_id}`});
 const [chosen,setChosen]=useState(team.members.filter(member=>!member.is_scrum_master).map(member=>({id:member.user_id,name:member.name})));
 const [rejected,setRejected]=useState([]);
 const [saved,setSaved]=useState(false);
 const ids=chosen.filter(person=>person.id!==lead?.id).map(person=>person.id);
 return <section className="team-workflow-card">
  <h4>{team.name}</h4>
  <div className="form-label">Scrum master<Picker selected={lead} onSelect={value=>{if(value&&value.id!==lead?.id&&lead)setRejected(old=>[...old,lead]);setLead(value);setSaved(false)}} role="employee" tag="scrum_master" preserveSelection placeholder="Search for a replacement scrum master"/></div>
  {[...chosen,...rejected].filter(person=>person.id!==lead?.id).map(person=>{
   const declined=rejected.some(item=>item.id===person.id);
   return <div className="workflow-row" key={person.id}><span>{person.name} · {declined?'Rejected':'Selected'}</span>
    <button className={declined?'secondary-button':'decline-button'} type="button" disabled={disabled} onClick={()=>{
     setSaved(false);
     if(declined){setRejected(old=>old.filter(item=>item.id!==person.id));setChosen(old=>[...old,person])}
     else{setChosen(old=>old.filter(item=>item.id!==person.id));setRejected(old=>[...old,person])}
    }}>{declined?'Restore':'Reject'}</button>
   </div>;
  })}
  <EmployeeSelections picker={Picker} chosen={chosen} onChange={value=>{setChosen(value);setRejected(old=>old.filter(person=>!value.some(item=>item.id===person.id)));setSaved(false)}}
   exclude={lead?[lead.id]:[]} showChosen={false}/>
  <button className="secondary-button" type="button" disabled={disabled||!lead} onClick={async()=>{if(await onSave({scrum_master_id:lead.id,member_ids:ids}))setSaved(true)}}><Check size={15}/> {saved?'Members saved':'Accept selected members'}</button>
 </section>;
}

export function AdminTeamApproval({project,picker,notify,onApproved}) {
 const [teams,setTeams]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [reviewed,setReviewed]=useState([]);
 const [editing,setEditing]=useState([]);
 const base=`/admin/projects/${project.serverId}`;
 async function load(){
  try{setTeams(await workspaceRequest(`/projects/${project.serverId}/teams`));setError('')}
  catch(error){setError(error.message)}
 }
 async function save(team,data){
  setBusy(true);
  try{
   const updated=await workspaceRequest(`${base}/teams/${team.id}`,{method:'PATCH',data});
   setTeams(old=>old.map(row=>row.id===updated.id?updated:row));
   setReviewed(old=>[...new Set([...old,team.id])]);setEditing(old=>old.filter(id=>id!==team.id));
   return true;
  }catch(error){setError(error.message);return false}
  finally{setBusy(false)}
 }
 async function approve(){
  setBusy(true);
  try{
   const updated=await workspaceRequest(`${base}/approve`,{method:'POST'});
   onApproved(updated);notify('Proposal approved · project invitations sent');
  }catch(error){setError(error.message)}
  finally{setBusy(false)}
 }
 return <article className="team-workflow-card">
  <h3>{project.name}</h3><p>{project.owner} proposed teams for {project.client}.</p>
  {!teams&&<button className="secondary-button" onClick={load}>Review proposed members</button>}
  {error&&<p role="alert" className="auth-error">{error}</p>}
  {teams?.map(team=>reviewed.includes(team.id)&&!editing.includes(team.id)?<div key={team.id} className="workflow-row">
   <div><strong>{team.name}</strong><p>{team.members.map(member=>member.name).join(', ')}</p></div>
   <button className="secondary-button" onClick={()=>setEditing(old=>[...old,team.id])}>Edit accepted members</button>
  </div>:<AdminTeamEditor key={team.id} team={team} picker={picker} onSave={data=>save(team,data)} disabled={busy}/>)}
  {teams&&<button className="primary-button" disabled={busy||!teams.length||reviewed.length!==teams.length||editing.length>0} onClick={approve}><ShieldCheck size={16}/> Approve request</button>}
 </article>;
}
