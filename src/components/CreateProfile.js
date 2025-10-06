import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import '../App.css';

const CreateProfile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    skills: '',
    address: '',
    contactNumber: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    relationship: '',
    educationQualification: '',
    email: '',
    roleId: '',
    teamId: '', // Changed from teamid to teamId to match UserInfoDTO
  });

  const [teams, setTeams] = useState([]);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams(); // user ID from URL

  // 🔄 Fetch teams, roles, and current user on mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setMessage({ text: 'No access token found. Please log in.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }
      const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

      try {
        // Fetch current user to prefill email
        const userRes = await fetch(`${BASE_URL}/api/users/me`, { headers });
        if (!userRes.ok) throw new Error(`Failed to fetch user: ${userRes.status}`);
        const userData = await userRes.json();
        setFormData((prev) => ({ ...prev, email: userData.email || '' }));

        // Fetch teams and roles
        const [teamRes, roleRes] = await Promise.all([
          fetch(`${BASE_URL}/api/getallteams`, { headers }),
          fetch(`${BASE_URL}/api/roles/getallroles`, { headers }),
        ]);

        if (!teamRes.ok) throw new Error(`Failed to fetch teams: ${teamRes.status}`);
        if (!roleRes.ok) throw new Error(`Failed to fetch roles: ${roleRes.status}`);

        const teamData = await teamRes.json();
        const roleData = await roleRes.json();

        // Handle both array and wrapped object responses
        setTeams(teamData.teams || teamData || []);
        setRoles(roleData.roles || roleData || []);

        if (!teamData?.teams?.length && !roleData?.roles?.length) {
          setMessage({ text: 'No roles or teams available. Admins can create them after profile creation.', type: 'info' });
        }
      } catch (error) {
        console.error('❌ Dropdown fetch error:', error.message);
        setMessage({ text: 'Failed to load teams or roles. You can proceed without selecting them.', type: 'warning' });
      }
    };

    fetchDropdownData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber)) return 'Contact number must be 10 digits';
    if (formData.emergencyContactNumber && !/^\d{10}$/.test(formData.emergencyContactNumber)) return 'Emergency contact number must be 10 digits';
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setMessage({ text: 'No access token found. Please log in.', type: 'error' });
      setLoading(false);
      setTimeout(() => navigate('/'), 1500);
      return;
    }

    try {
      const response = await fetch(`https://springbootemployetimesheet-1.onrender.com/api/users/postuser/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          roleId: formData.roleId && formData.roleId !== '0' ? parseInt(formData.roleId) : null,
          teamId: formData.teamId && formData.teamId !== '0' ? parseInt(formData.teamId) : null, // Changed to teamId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create profile: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setMessage({ text: '✅ Profile created successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('❌ Submit error:', error.message);
      setMessage({ text: error.message.includes('Email mismatch') ? '❌ Email must match your registered email' : '❌ Failed to create profile: Network error or invalid data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="header-section">
          <h1 className="title">Create Profile</h1>
          <p className="subtitle">Complete your profile details</p>
        </div>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : message.type === 'warning' ? 'message-warning' : message.type === 'info' ? 'message-info' : 'message-error'}`}>
            {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
            <span className="message-text">{message.text}</span>
          </div>
        )}

        <div className="form-container">
          {[
            { name: 'firstName', placeholder: 'Enter your first name', required: true },
            { name: 'middleName', placeholder: 'Enter your middle name' },
            { name: 'lastName', placeholder: 'Enter your last name' },
            { name: 'birthDate', type: 'date', placeholder: 'Select your birth date' },
            { name: 'skills', placeholder: 'Enter your skills (e.g., Java, React)' },
            { name: 'address', placeholder: 'Enter your address' },
            { name: 'contactNumber', placeholder: 'Enter your contact number (10 digits)' },
            { name: 'emergencyContactName', placeholder: 'Emergency contact name' },
            { name: 'emergencyContactNumber', placeholder: 'Emergency contact number (10 digits)' },
            { name: 'email', type: 'email', placeholder: 'Enter your email', required: true },
          ].map(({ name, placeholder, type = 'text', required = false }) => (
            <div className="input-group" key={name}>
              <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="input-field"
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}

          {/* 🔽 Gender Dropdown */}
          <div className="input-group">
            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 🔽 Relationship Dropdown */}
          <div className="input-group">
            <select name="relationship" value={formData.relationship} onChange={handleChange} className="input-field">
              <option value="" disabled>Select Relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Sister">Sister</option>
              <option value="Brother">Brother</option>
              <option value="Spouse">Spouse</option>
            </select>
          </div>

          {/* 🔽 Education Dropdown */}
          <div className="input-group">
            <select name="educationQualification" value={formData.educationQualification} onChange={handleChange} className="input-field">
              <option value="" disabled>Select Education</option>
              <option value="B.Tech">B.Tech</option>
              <option value="Degree">Degree</option>
              <option value="M.Tech">M.Tech</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          {/* 🔽 Role Dropdown */}
          <div className="input-group">
            <select name="roleId" value={formData.roleId} onChange={handleChange} className="input-field">
              <option value="" disabled>Select Role (optional)</option>
              {roles.length > 0 ? (
                roles.map(role => (
                  <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
                ))
              ) : (
                <option value="" disabled>No roles available</option>
              )}
            </select>
          </div>

          {/* 🔽 Team Dropdown */}
          <div className="input-group">
            <select name="teamId" value={formData.teamId} onChange={handleChange} className="input-field">
              <option value="" disabled>Select Team (optional)</option>
              {teams.length > 0 ? (
                teams.map(team => (
                  <option key={team.id} value={team.id}>{team.teamname}</option>
                ))
              ) : (
                <option value="" disabled>No teams available</option>
              )}
            </select>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="submit-button">
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;