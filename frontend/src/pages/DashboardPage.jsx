import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <main className="container">
      <h1>Dashboard HRIS</h1>
      <p>Halo {user?.email}</p>
      <div className="card-row">
        <Link to="/employees">Kelola Karyawan</Link>
        <Link to="/activity-logs">Audit Trail</Link>
      </div>
    </main>
  );
}
