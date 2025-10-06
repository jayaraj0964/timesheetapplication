import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Users } from 'lucide-react';
import '../App.css';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State declarations
  const [userData, setUserData] = useState(null);
  const [currentUser, setCurrentUser] = useState({ id: '', role: '' });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  // Fetch current user and target user data
  useEffect(() => {
    const fetchUserData = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No access token found. Please log in.');
        setLoading(false);
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      try {
        // Fetch current user
        const meResponse = await fetch(`${BASE_URL}/api/users/me`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!meResponse.ok) {
          const errorText = await meResponse.text();
          if (meResponse.status === 403) throw new Error('Access denied. Insufficient permissions.');
          throw new Error(`Failed to fetch current user: ${meResponse.status} - ${errorText}`);
        }
        const meData = await meResponse.json();
        console.log('✅ /api/users/me response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', meData);

        // Use top-level role if available, otherwise fall back to profile.roleName
        const role = meData.role || (meData.profile?.roleName ? `ROLE_${meData.profile.roleName.toUpperCase().replace(/ADMIN.*/, 'ADMIN')}` : 'ROLE_USER');
        const userId = meData.id || '';

        setCurrentUser({ id: userId, role });
        console.log('✅ Current user role detected:', role, 'for user ID:', userId);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(`Network error: ${err.message}`);
      }

      try {
        // Fetch target user
        const res = await fetch(`${BASE_URL}/api/users/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await res.json();
        console.log('✅ /api/users/:id response:', data);

        if (res.ok) {
          if (currentUser.role === 'ROLE_USER' && currentUser.id !== parseInt(id)) {
            setError('You can only view your own details.');
            setUserData(null);
          } else {
            setUserData(data);
          }
        } else {
          if (res.status === 403) throw new Error('Access denied. Insufficient permissions.');
          throw new Error(`Failed to fetch user details: ${res.status} - ${typeof data === 'string' ? data : 'Unknown error'}`);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(`Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, navigate, currentUser.role]);

  // Admin-only: Fetch all users
  const handleGetAllUsers = async () => {
    if (currentUser.role !== 'ROLE_ADMIN') {
      setError('You do not have permission to view all users.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${BASE_URL}/api/users/all`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to fetch all users: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('✅ /api/users/all response:', data);

      const usersArray = Array.isArray(data) ? data : (data.data || []);
      setAllUsers(usersArray);
      setShowAllUsers(true);
    } catch (err) {
      console.error('Error fetching all users:', err);
      setError(`Error fetching all users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Debug log for state changes
  useEffect(() => {
    console.log('✅ Updated allUsers:', allUsers);
    console.log('✅ showAllUsers:', showAllUsers);
    console.log('✅ currentUser:', currentUser);
  }, [allUsers, showAllUsers, currentUser]);

  // UI rendering
  if (loading) return <p style={{ textAlign: 'center', color: '#1a3c34' }}>Loading...</p>;
  if (error)
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="message message-error" style={{ backgroundColor: '#ffe6e6', color: '#d32f2f' }}>
            <AlertCircle className="message-icon" />
            <span className="message-text">{error}</span>
          </div>
        </div>
      </div>
    );

  return (
    <div
      className="auth-container"
      style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, #e6f0fa, #b3cde0)',
      }}
    >
      <div
        className="auth-card"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h1
          className="title"
          style={{ color: '#1a3c34', textAlign: 'center', marginBottom: '20px', fontSize: '28px' }}
        >
          User Details
        </h1>
        {userData && (
          <div style={{ marginBottom: '20px', color: '#1a3c34' }}>
            <p className="subtitle" style={{ fontSize: '18px', fontWeight: 'bold' }}>
              ID: {userData.id}
            </p>
            <p>Email: {userData.email || 'N/A'}</p>
            {userData.profile && (
              <div>
                <p><strong>First Name:</strong> {userData.profile.firstName || 'N/A'}</p>
                <p><strong>Middle Name:</strong> {userData.profile.middleName || 'N/A'}</p>
                <p><strong>Last Name:</strong> {userData.profile.lastName || 'N/A'}</p>
                <p><strong>Birth Date:</strong> {userData.profile.birthDate || 'N/A'}</p>
                <p><strong>Gender:</strong> {userData.profile.gender || 'N/A'}</p>
                <p><strong>Skills:</strong> {userData.profile.skills || 'N/A'}</p>
                <p><strong>Address:</strong> {userData.profile.address || 'N/A'}</p>
                <p><strong>Contact Number:</strong> {userData.profile.contactNumber || 'N/A'}</p>
                <p><strong>Emergency Contact Name:</strong> {userData.profile.emergencyContactName || 'N/A'}</p>
                <p><strong>Emergency Contact Number:</strong> {userData.profile.emergencyContactNumber || 'N/A'}</p>
                <p><strong>Relationship:</strong> {userData.profile.relationship || 'N/A'}</p>
                <p><strong>Education Qualification:</strong> {userData.profile.educationQualification || 'N/A'}</p>
              </div>
            )}
          </div>
        )}

        {/* Debug display of current user role
        <p style={{ color: '#1a3c34', marginBottom: '10px' }}>
          Current User Role: {currentUser.role} (ID: {currentUser.id})
        </p> */}

        {/* Admin-only button */}
        {currentUser.role === 'ROLE_ADMIN' && (
          <button
            onClick={handleGetAllUsers}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#0288d1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s',
              opacity: loading ? 0.6 : 1,
              fontSize: '16px',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#0277bd')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#0288d1')}
            disabled={loading}
          >
            <Users size={18} />
            <span>Get All Users</span>
          </button>
        )}

        {/* All users list in a table */}
        {showAllUsers && allUsers.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ color: '#1a3c34', marginBottom: '10px', fontSize: '22px' }}>
              All Users <Users size={20} />
            </h2>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#0b0b0bff',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#b3cde0' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #90a4ae', textAlign: 'left' }}>User ID</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #90a4ae', textAlign: 'left' }}>First Name</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #90a4ae', textAlign: 'left' }}>Skills</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.userId} style={{ borderBottom: '1px solid #cfd8dc' }}>
                    <td style={{ padding: '12px' }}>{user.userId || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.firstName || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{user.skills || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;