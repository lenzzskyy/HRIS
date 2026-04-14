import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

export function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    api.get('/employees', { params: { q: debounced } }).then((res) => setEmployees(res.data.data));
  }, [debounced]);

  const rows = useMemo(() => employees.map((item) => (
    <tr key={item.id}>
      <td>{item.employeeCode}</td>
      <td>{item.fullName}</td>
      <td>{item.department?.name}</td>
      <td>{item.title}</td>
    </tr>
  )), [employees]);

  return (
    <main className="container">
      <h2>Karyawan</h2>
      <input placeholder="Cari nama / NIK" value={query} onChange={(e) => setQuery(e.target.value)} />
      <table>
        <thead><tr><th>NIK</th><th>Nama</th><th>Departemen</th><th>Jabatan</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </main>
  );
}
