import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Clock, BookOpen, Bot, Award,
  Users, UserCheck, Building, ShieldCheck, User, Settings, Layers, Video, Library
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Semesters', path: '/semesters', icon: Library },
    { name: 'Attendance', path: '/attendance', icon: UserCheck },
    { name: 'Timetable', path: '/timetable', icon: Clock },
    { name: 'My Notes', path: '/notes', icon: BookOpen },
    { name: 'AI Study Buddy', path: '/ai-study-buddy', icon: Bot, highlight: true },
    { name: 'Quizzes', path: '/quizzes', icon: Award },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const facultyNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', path: '/faculty/attendance', icon: UserCheck },
    { name: 'My Classes', path: '/notes', icon: Layers },
    { name: 'Course Materials', path: '/notes', icon: BookOpen },
    { name: 'AI Quiz Studio', path: '/quizzes', icon: Award },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users Control', path: '/admin/management', icon: Users },
    { name: 'Subjects & Classes', path: '/admin/management', icon: Layers },
    { name: 'Buildings & Rooms', path: '/admin/management', icon: Building },
    { name: 'Authorized Domains', path: '/admin/management', icon: ShieldCheck },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'faculty' ? facultyNav : studentNav;

  return (
    <aside style={{
      width: '240px',
      background: 'white',
      borderRight: '1px solid var(--border-light)',
      minHeight: 'calc(100vh - 65px)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '8px' }}>
        Main Menu
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.92rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? (item.highlight ? '#0284c7' : 'var(--primary)') : '#475569',
              background: isActive ? (item.highlight ? 'rgba(6, 182, 212, 0.12)' : 'var(--primary-light)') : 'transparent',
              borderLeft: isActive ? (item.highlight ? '4px solid #06B6D4' : '4px solid var(--primary)') : '4px solid transparent',
              transition: 'all 0.2s ease'
            })}
          >
            <Icon size={18} color={item.highlight ? '#06B6D4' : undefined} />
            <span>{item.name}</span>
            {item.highlight && (
              <span className="badge" style={{ background: '#06B6D4', color: 'white', fontSize: '0.65rem', padding: '2px 6px', marginLeft: 'auto' }}>
                AI 🤖
              </span>
            )}
          </NavLink>
        );
      })}
    </aside>
  );
};
