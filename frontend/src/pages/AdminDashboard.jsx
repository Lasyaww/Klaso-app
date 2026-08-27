import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, BookOpen, Layers, Building, AlertTriangle, Plus, CheckCircle2, UserPlus, Clock, Trash2 } from 'lucide-react';
import api from '../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [domains, setDomains] = useState([]);
  const [roster, setRoster] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDomain, setNewDomain] = useState('');

  // Pre-authorized roster form
  const [rosterEmail, setRosterEmail] = useState('');
  const [rosterRegNo, setRosterRegNo] = useState('');
  const [rosterName, setRosterName] = useState('');
  const [rosterRole, setRosterRole] = useState('student');
  const [rosterDept, setRosterDept] = useState('Computer Science');
  const [rosterYear, setRosterYear] = useState('1st Year');
  const [rosterSection, setRosterSection] = useState('Section A');
  const [rosterDesignation, setRosterDesignation] = useState('Assistant Professor');
  const [rosterMsg, setRosterMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = () => {
    Promise.all([
      api.get('/admin/dashboard-stats'),
      api.get('/admin/domains'),
      api.get('/admin/roster'),
      api.get('/admin/users')
    ])
      .then(([st, dom, rst, usr]) => {
        setStats(st);
        setDomains(dom);
        setRoster(rst);
        setUsers(usr);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain) return;
    api.post('/admin/domains', { domain: newDomain })
      .then((res) => {
        setDomains(prev => [...prev, res]);
        setNewDomain('');
      })
      .catch((err) => alert(err.message));
  };

  const handleAddToRoster = (e) => {
    e.preventDefault();
    setRosterMsg('');

    api.post('/admin/roster', {
      email: rosterEmail,
      reg_no: rosterRegNo,
      full_name: rosterName,
      role: rosterRole,
      department: rosterDept,
      year: rosterYear,
      section: rosterSection,
      designation: rosterDesignation
    })
      .then((res) => {
        setRoster(prev => [res, ...prev]);
        if (res.user_obj) {
           setUsers(prev => [res.user_obj, ...prev]);
        }
        setRosterMsg(`Successfully pre-authorized and auto-registered ${rosterRole} '${rosterName}' (${rosterRegNo})!`);
        setRosterEmail('');
        setRosterRegNo('');
        setRosterName('');
      })
      .catch((err) => {
        setRosterMsg(`Error: ${err.message}`);
      });
  };

  const handleToggleUserStatus = (userId) => {
    api.put(`/admin/users/${userId}/status`)
      .then(() => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u));
      })
      .catch((err) => alert(err.message));
  };

  const handleDeleteRoster = (id) => {
    if (!window.confirm("Are you sure you want to delete this pre-authorized entry?")) return;
    
    api.delete(`/admin/roster/${id}`)
      .then(() => {
        setRoster(prev => prev.filter(r => r.id !== id));
      })
      .catch((err) => alert(err.message));
  };

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading System Administrator Console...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card glass-panel" style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        color: 'white',
        padding: '24px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>
          <ShieldCheck size={18} /> System Administrator Console
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>
          Klaso Campus Master Administration 🏛️
        </h2>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div style={{ color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 700 }}>Total Students</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>{stats?.total_students}</div>
        </div>

        <div className="card" style={{ background: '#fef3c7', borderColor: '#fde68a' }}>
          <div style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 700 }}>Total Faculty</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#92400e', marginTop: '4px' }}>{stats?.total_faculty}</div>
        </div>

        <div className="card" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
          <div style={{ color: '#047857', fontSize: '0.8rem', fontWeight: 700 }}>Active Subjects</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>{stats?.total_subjects}</div>
        </div>

        <div className="card" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
          <div style={{ color: '#b91c1c', fontSize: '0.8rem', fontWeight: 700 }}>Low Attendance Risk</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>{stats?.low_attendance_students}</div>
        </div>
      </div>

      {/* Pre-Authorized Roster Management Section */}
      <div className="card" style={{ borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <UserPlus size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pre-Authorize Student & Faculty Roster</h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
          Add authorized emails and registration numbers. Students and faculty can ONLY register if their email & registration number have been added below by Admin.
        </p>

        {rosterMsg && (
          <div style={{
            background: rosterMsg.startsWith('Error') ? '#fee2e2' : '#ecfdf5',
            border: rosterMsg.startsWith('Error') ? '1px solid #fca5a5' : '1px solid #a7f3d0',
            color: rosterMsg.startsWith('Error') ? '#991b1b' : '#065f46',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '16px'
          }}>
            {rosterMsg}
          </div>
        )}

        <form onSubmit={handleAddToRoster} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select className="form-control" value={rosterRole} onChange={(e) => setRosterRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>College Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. sneha@klaso.edu"
              value={rosterEmail}
              onChange={(e) => setRosterEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>{rosterRole === 'student' ? 'Registration Number' : 'Faculty ID'}</label>
            <input
              type="text"
              className="form-control"
              placeholder={rosterRole === 'student' ? 'e.g. 22ABC125' : 'e.g. FAC003'}
              value={rosterRegNo}
              onChange={(e) => setRosterRegNo(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sneha Reddy"
              value={rosterName}
              onChange={(e) => setRosterName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Department</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Computer Science"
              value={rosterDept}
              onChange={(e) => setRosterDept(e.target.value)}
              required
            />
          </div>

          {rosterRole === 'student' && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Year</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 1st Year"
                  value={rosterYear}
                  onChange={(e) => setRosterYear(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Section</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Section A"
                  value={rosterSection}
                  onChange={(e) => setRosterSection(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {rosterRole === 'faculty' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Designation</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Assistant Professor"
                value={rosterDesignation}
                onChange={(e) => setRosterDesignation(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '22px' }}>
              <Plus size={16} /> Pre-Authorize Roster Entry
            </button>
          </div>
        </form>

        {/* Pre-Authorized Roster Table */}
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Pre-Authorized Campus Roster Entries</h4>
        <div className="table-responsive">
          <table className="klaso-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Reg / Faculty ID</th>
                <th>College Email</th>
                <th>Department</th>
                <th>Signup Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.role === 'faculty' ? '#fef3c7' : '#e0e7ff',
                      color: r.role === 'faculty' ? '#92400e' : '#3730a3',
                      textTransform: 'uppercase'
                    }}>
                      {r.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{r.reg_no}</td>
                  <td>{r.email}</td>
                  <td>{r.department}</td>
                  <td>
                    <span className={`badge ${r.is_registered ? 'badge-good' : 'badge-warning'}`}>
                      {r.is_registered ? '✅ Registered' : '⏳ Pending Signup'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDeleteRoster(r.id)}
                      style={{ padding: '6px', color: '#ef4444', background: '#fee2e2', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Domain Control Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Authorized Email Domain Whitelist</h3>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '16px' }}>
          Only email domains listed below are accepted by Klaso signup validation.
        </p>

        <form onSubmit={handleAddDomain} style={{ display: 'flex', gap: '10px', maxWidth: '480px', marginBottom: '16px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. klaso.edu"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Add Domain
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {domains.map(d => (
            <span key={d.id} className="badge badge-good" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              <CheckCircle2 size={14} /> @{d.domain}
            </span>
          ))}
        </div>
      </div>

      {/* User Accounts Management */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Active Campus User Accounts Roster</h3>
        <div className="table-responsive">
          <table className="klaso-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Reg / ID</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge" style={{
                      background: u.role === 'admin' ? '#fee2e2' : u.role === 'faculty' ? '#fef3c7' : '#e0e7ff',
                      color: u.role === 'admin' ? '#991b1b' : u.role === 'faculty' ? '#92400e' : '#3730a3',
                      textTransform: 'uppercase'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.reg_no || '-'}</td>
                  <td>{u.department || 'CSE'}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-good' : 'badge-critical'}`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleToggleUserStatus(u.id)}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
