import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ClipboardList, Briefcase, CalendarCheck, Users, User, Shield, FolderKanban, AlertCircle, CheckCircle } from 'lucide-react';
import '../App.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: '',
    username: '',
    email: '',
    role: '',
    profileUserId: '', // Added to store profile userId
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [timesheetForm, setTimesheetForm] = useState({
    details: '',
    categoryId: '',
    shiftId: '',
  });

  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  useEffect(() => {
    const fetchUserDataAndTimesheets = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('No access token. Please log in.');
        setLoading(false);
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      try {
        // Fetch user data
        const userResponse = await fetch(`${BASE_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!userResponse.ok) throw new Error(`Failed to fetch user data: ${userResponse.status}`);
        const userDataResponse = await userResponse.json();
        console.log('API Response for /api/users/me:', userDataResponse);

        // Check if profile exists
        if (!userDataResponse.profile) {
          setError('Profile not found. Please create your profile.');
          setTimeout(() => navigate(`/create-profile/${userDataResponse.id}`), 1500);
          return;
        }

        // Set user data
        setUserData({
          id: userDataResponse.id || '',
          username: userDataResponse.email || 'Unknown',
          email: userDataResponse.email || 'Not provided',
          role: userDataResponse.role || 'ROLE_USER',
          profileUserId: userDataResponse.profile?.userId?.toString() || '',
        });

        // Fetch timesheets, categories, and shifts
        const [timesheetResponse, categoryResponse, shiftResponse] = await Promise.all([
          fetch(`${BASE_URL}/api/timesheets`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${BASE_URL}/api/task-categories`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${BASE_URL}/api/shifts`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (!timesheetResponse.ok) throw new Error(`Failed to fetch timesheet data: ${timesheetResponse.status}`);
        if (!categoryResponse.ok) throw new Error(`Failed to fetch categories: ${categoryResponse.status}`);
        if (!shiftResponse.ok) throw new Error(`Failed to fetch shifts: ${shiftResponse.status}`);

        const timesheetData = await timesheetResponse.json();
        const categoryData = await categoryResponse.json();
        const shiftData = await shiftResponse.json();

        setTimesheets(timesheetData);
        setCategories(categoryData);
        setShifts(shiftData);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndTimesheets();
  }, [navigate]);

  useEffect(() => {
    let timer;
    if (isTracking && timeIn) {
      timer = setInterval(() => {
        const elapsedMs = new Date() - timeIn;
        const hours = Math.floor(elapsedMs / 3600000);
        const minutes = Math.floor((elapsedMs % 3600000) / 60000);
        const seconds = Math.floor((elapsedMs % 60000) / 1000);
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking, timeIn]);

  const handleInputChange = (e) => {
    setTimesheetForm({ ...timesheetForm, [e.target.name]: e.target.value });
  };

  const allOperations = [
    { label: 'Shift Management', icon: Clock, path: '/shiftmanagemnet' },
    { label: 'Task Category Management', icon: ClipboardList, path: '/TaskCategoryManagement' },
    { label: 'Team Management', icon: Briefcase, path: '/TeamManagement' },
    { label: 'Timesheet Management', icon: CalendarCheck, path: '/TimeSheetManagement' },
    { label: 'User Positions', icon: Users, path: '/Userpostions' },
    { label: 'Role Management', icon: Shield, path: '/roles' },
    { label: 'Position Management', icon: FolderKanban, path: '/position_management' },
    { label: 'User Details', icon: User, path: userData.id ? `/users/${userData.id}` : '#' },
  ];

  const operations = userData.role === 'ROLE_ADMIN'
    ? allOperations
    : allOperations.filter(op => op.label === 'User Details' || op.label === 'Timesheet Management');

  const handleNavigate = (path) => {
    if (path === '#') {
      setError('User ID not available. Please try again later.');
      return;
    }
    navigate(path);
  };

  const handleProfileClick = () => {
    if (userData.id) {
      navigate(`/users/${userData.id}`);
    } else {
      setError('User ID not available. Please try again later.');
    }
  };

  const handleTimeIn = () => {
    if (!userData.profileUserId && userData.role !== 'ROLE_ADMIN') {
      setError('Profile not complete. Please create your profile.');
      setTimeout(() => navigate(`/create-profile/${userData.id}`), 1500);
      return;
    }
    if (!isTracking) {
      const newTimeIn = new Date();
      setTimeIn(newTimeIn);
      setIsTracking(true);
      setElapsedTime('00:00:00');
    }
  };

  const handleTimeOut = async () => {
    if (!isTracking || !timeIn) {
      setError('Please click Time In before Time Out.');
      return;
    }
    if (!timesheetForm.details || !timesheetForm.categoryId || !timesheetForm.shiftId) {
      setError('Please fill all fields (Details, Category, Shift) before Time Out.');
      return;
    }

    const newTimeOut = new Date();
    const elapsedMs = newTimeOut - timeIn;
    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const hoursWorked = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    setTimeOut(newTimeOut);
    setIsTracking(false);
    setElapsedTime('00:00:00');

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setError('No authentication token found');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/timesheets/posttimesheet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workDate: new Date().toISOString().split('T')[0],
          hoursWorked,
          details: timesheetForm.details,
          categoryId: parseInt(timesheetForm.categoryId),
          shiftId: parseInt(timesheetForm.shiftId),
          userId: userData.role === 'ROLE_ADMIN' ? null : parseInt(userData.profileUserId),
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save timesheet: ${response.status} - ${errorText}`);
      }
      const updatedTimesheet = await response.json();
      setTimesheets(prev => [...prev, updatedTimesheet]);
      setSuccessMessage('Timesheet saved successfully!');
      setTimesheetForm({ details: '', categoryId: '', shiftId: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving timesheet:', error);
      setError(`Error saving timesheet: ${error.message}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '900px', padding: '2rem', position: 'relative' }}>
        {/* Profile Button */}
        {!loading && !error && userData.id && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#4a90e2',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.9rem',
              transition: 'background 0.2s',
            }}
            onClick={handleProfileClick}
            onMouseOver={(e) => (e.currentTarget.style.background = '#357abd')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#4a90e2')}
          >
            <User size={18} />
            <span>Profile</span>
          </div>
        )}

        <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title">Dashboard</h1>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="message-error" style={{ color: '#721c24' }}>{error}</p>
          ) : (
            <div>
              <p className="subtitle" style={{ fontSize: '1.2rem', color: '#f9f1f1ff', marginBottom: '0.5rem' }}>
                Hello {userData.role === 'ROLE_ADMIN' ? 'Admin' : 'User'} {userData.username}
              </p>
            </div>
          )}
        </div>

        {successMessage && (
          <p className="message-success" style={{ color: '#155724', textAlign: 'center' }}>
            <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {successMessage}
          </p>
        )}
        {error && (
          <p className="message-error" style={{ color: '#721c24', textAlign: 'center' }}>
            <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {error}
          </p>
        )}

        <div
          className="form-container"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}
        >
          {operations.map((op, index) => (
            <div
              key={index}
              className="operation-card"
              style={{
                background: '#f8f9fa',
                padding: '1.5rem',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: op.path !== '#' ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s',
                opacity: op.path === '#' ? 0.6 : 1,
              }}
              onClick={() => handleNavigate(op.path)}
              onMouseOver={(e) => (op.path !== '#' ? (e.currentTarget.style.transform = 'scale(1.05)') : null)}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <op.icon size={40} style={{ color: '#4a90e2', marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{op.label}</p>
            </div>
          ))}
        </div>

        {!loading && !error && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ fontSize: '1.2rem', color: '#333', marginBottom: '1rem' }}>
              {userData.role === 'ROLE_ADMIN' ? 'All Timesheets' : 'My Timesheet & Time Tracking'}
            </h2>
            {userData.role === 'ROLE_USER' && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button
                    onClick={handleTimeIn}
                    disabled={isTracking}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: isTracking ? '#ccc' : '#2ecc71',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: isTracking ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Time In
                  </button>
                  <button
                    onClick={handleTimeOut}
                    disabled={!isTracking}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: !isTracking ? '#ccc' : '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: !isTracking ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Time Out
                  </button>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <textarea
                    name="details"
                    placeholder="Enter timesheet details"
                    value={timesheetForm.details}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      marginBottom: '10px',
                    }}
                  />
                  <select
                    name="categoryId"
                    value={timesheetForm.categoryId}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      marginBottom: '10px',
                    }}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                    ))}
                  </select>
                  <select
                    name="shiftId"
                    value={timesheetForm.shiftId}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="" disabled>Select Shift</option>
                    {shifts.map((shift) => (
                      <option key={shift.shiftId} value={shift.shiftId}>{shift.shiftName}</option>
                    ))}
                  </select>
                </div>
                <p style={{ textAlign: 'center', fontSize: '18px', marginBottom: '10px' }}>
                  Elapsed Time: {elapsedTime}
                </p>
              </div>
            )}
            {timesheets && timesheets.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {timesheets.map((entry, index) => (
                  <li key={index} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                    {entry.workDate} - {entry.hoursWorked ? entry.hoursWorked.substring(0, 5) : 'N/A'} - {entry.details || 'N/A'} 
                    {userData.role === 'ROLE_ADMIN' && entry.userId ? ` (User ID: ${entry.userId})` : ''}
                    {entry.categoryId && categories.length > 0 ? ` - Category: ${categories.find(cat => cat.categoryId === entry.categoryId)?.categoryName || 'N/A'}` : ''}
                    {entry.shiftId && shifts.length > 0 ? ` - Shift: ${shifts.find(shift => shift.shiftId === entry.shiftId)?.shiftName || 'N/A'}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No timesheet entries available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;