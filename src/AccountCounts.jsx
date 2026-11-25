import React, { useEffect, useState } from 'react';

export default function AccountCounts() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('stride_token');
    fetch('/api/admin/users?limit=1&include_total=true', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Could not load account totals');
      setCounts(body.counts);
    }).catch(requestError => {
      if (!controller.signal.aborted) setError(requestError.message);
    });
    return () => controller.abort();
  }, []);

  if (error) return <p className="auth-error" role="alert">{error}</p>;
  return <div className="account-counts" aria-label="Accounts by type">
    {[['All accounts', 'all'], ['Clients', 'client'], ['Employees', 'employee'], ['Admins', 'admin']].map(([label, key]) =>
      <div className="account-count" key={key}><span>{label}</span><b>{counts?.[key] ?? '—'}</b></div>
    )}
  </div>;
}
