import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Building, Award, Shield, Save, KeyRound, Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

export const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const DEFAULT_PROFILE_PIC = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5 MB.');
      e.target.value = '';
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file format. Please upload JPG, PNG, or WEBP.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowModal(true);
  };

  const cancelUpload = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = () => {
    if (!selectedFile) return;

    setUploadingPic(true);
    setFileError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    api.post('/auth/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res) => {
        setUser(prev => ({ 
          ...prev, 
          profile_pic: res.profile_pic,
          profile_picture_update_used: true 
        }));
        cancelUpload();
      })
      .catch((err) => {
        setFileError(err.message || "Failed to update profile picture.");
      })
      .finally(() => setUploadingPic(false));
  };


  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setUser(prev => ({ ...prev, full_name: fullName, phone }));
      alert("Profile updated successfully!");
      setSaving(false);
    }, 600);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", type: 'error' });
      return;
    }

    setChangingPassword(true);
    api.put('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    })
      .then((res) => {
        setPasswordMsg({ text: res.message || "Password updated successfully!", type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err) => {
        setPasswordMsg({ text: err.message || "Failed to update password.", type: 'error' });
      })
      .finally(() => setChangingPassword(false));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account Profile Details</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          View and manage your Klaso institutional profile credentials.
        </p>
      </div>

      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <img
            src={user?.profile_pic || DEFAULT_PROFILE_PIC}
            alt="Profile"
            style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }}
          />
          <div style={{ flex: 1 }}>
            <span className="badge" style={{
              background: user?.role === 'admin' ? '#fee2e2' : user?.role === 'faculty' ? '#fef3c7' : '#e0e7ff',
              color: user?.role === 'admin' ? '#991b1b' : user?.role === 'faculty' ? '#92400e' : '#3730a3',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              {user?.role} Account
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user?.full_name}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>{user?.email}</p>
          </div>
          <div>
            {!user?.profile_picture_update_used ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={16} /> Update Profile Picture
                </button>
                <p style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', textAlign: 'right', margin: 0 }}>
                  Your profile picture can only be updated once. Please upload a professional photo.
                </p>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp"
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect}
                />
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '220px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  disabled
                  style={{ width: '100%', marginBottom: '8px', opacity: 0.7 }}
                >
                  Update Profile Picture
                </button>
                <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: 0, textAlign: 'center', fontWeight: 500 }}>
                  Profile picture update limit reached. Your profile picture cannot be changed again.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card glass-panel" style={{ width: '90%', maxWidth: '400px', background: 'white', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Update Profile Picture</h3>
              <button onClick={cancelUpload} style={{ background: 'none', border: 'none', cursor: 'pointer' }} disabled={uploadingPic}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              Upload a professional photo for your Klaso profile.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }}
              />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ImageIcon size={16} /> {selectedFile?.name}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>

            {fileError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #fca5a5' }}>
                <strong>Validation Failed:</strong> {fileError}
              </div>
            )}

            <div style={{ background: '#fffbeb', color: '#b45309', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '24px', border: '1px solid #fde68a' }}>
              <strong>Important:</strong> You can update your profile picture only once. Make sure you are happy with this photo before confirming.
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={cancelUpload} disabled={uploadingPic}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmUpload} disabled={uploadingPic}>
                {uploadingPic ? 'Uploading & Verifying...' : 'Confirm & Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Personal Information</h3>

        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>College Email</label>
            <input type="email" className="form-control" value={user?.email || ''} disabled style={{ background: '#f1f5f9' }} />
          </div>
          <div className="form-group">
            <label>{user?.role === 'faculty' ? 'Faculty ID' : 'Registration Number'}</label>
            <input type="text" className="form-control" value={user?.reg_no || ''} disabled style={{ background: '#f1f5f9' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>Department</label>
            <input type="text" className="form-control" value={user?.department || 'Computer Science'} disabled style={{ background: '#f1f5f9' }} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Profile Updates'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={20} color="var(--primary)" /> Change Password
        </h3>

        {passwordMsg.text && (
          <div style={{
            background: passwordMsg.type === 'error' ? '#fee2e2' : '#ecfdf5',
            border: passwordMsg.type === 'error' ? '1px solid #fca5a5' : '1px solid #a7f3d0',
            color: passwordMsg.type === 'error' ? '#991b1b' : '#065f46',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem'
          }}>
            {passwordMsg.text}
          </div>
        )}

        <div className="form-group">
          <label>Current Password</label>
          <input type="password" className="form-control" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
        </div>

        <button type="submit" className="btn btn-secondary" disabled={changingPassword} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
          <Shield size={18} /> {changingPassword ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};
