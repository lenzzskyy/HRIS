import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function ActivityLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/activity-logs').then((res) => setLogs(res.data.data));
  }, []);

  return (
    <main className="container">
      <h2>Activity Logs</h2>
      <ul>
        {logs.map((log) => (
          <li key={log.id}>{log.createdAt} - {log.module} - {log.action} - {log.description}</li>
        ))}
      </ul>
    </main>
  );
}
