import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import '../App.css';

const PositionManagement = () => {
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({ positionName: '', rolesResponsblities: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setMessage({ text: 'No access token found. Please log in.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/positions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setPositions(data);
      } else if (res.status === 403) {
        setMessage({ text: 'Access denied. Insufficient permissions.', type: 'error' });
      } else {
        setMessage({ text: `Failed to fetch positions: ${res.status} - ${await res.text()}`, type: 'error' });
      }
    } catch (error) {
      console.error('Fetch positions error:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.positionName.trim()) {
      setMessage({ text: 'Position name is required.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setMessage({ text: 'No access token found. Please log in.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      const url = editingId ? `/api/positions/${editingId}` : '/api/positions/postpositions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionName: formData.positionName,
          rolesResponsblities: formData.rolesResponsblities,
        }),
      });

      const responseText = await res.text();
      console.log(`Request ${method} to ${url}:`, res.status, responseText);

      if (res.ok) {
        setMessage({ text: `Position ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
        setFormData({ positionName: '', rolesResponsblities: '' });
        setEditingId(null);
        fetchPositions();
      } else if (res.status === 403) {
        setMessage({ text: `Access denied: ${responseText}`, type: 'error' });
      } else {
        setMessage({ text: `Failed to ${editingId ? 'update' : 'create'} position: ${res.status} - ${responseText}`, type: 'error' });
      }
    } catch (error) {
      console.error('Request error:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (position) => {
    setFormData({ positionName: position.positionName, rolesResponsblities: position.rolesResponsblities });
    setEditingId(position.positionId);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this position?')) {
      setLoading(true);
      setMessage({ text: '', type: '' });
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setMessage({ text: 'No access token found. Please log in.', type: 'error' });
          setTimeout(() => navigate('/'), 1500);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/positions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          setMessage({ text: 'Position deleted successfully!', type: 'success' });
          fetchPositions();
        } else if (res.status === 403) {
          setMessage({ text: 'Access denied. Insufficient permissions.', type: 'error' });
        } else {
          setMessage({ text: `Failed to delete position: ${res.status} - ${await res.text()}`, type: 'error' });
        }
      } catch (error) {
        console.error('Delete position error:', error);
        setMessage({ text: 'Network error. Please try again.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">Position Management</h1>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
            <span className="message-text">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container">
          <div className="input-group">
            <input
              type="text"
              name="positionName"
              value={formData.positionName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter Position Name"
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <textarea
              name="rolesResponsblities"
              value={formData.rolesResponsblities}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter Roles & Responsibilities"
              rows="4"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Add') + ' Position'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ positionName: '', rolesResponsblities: '' });
              }}
              className="submit-button cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </form>

        {loading ? (
          <p>Loading positions...</p>
        ) : positions.length > 0 ? (
          <table className="position-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Position Name</th>
                <th>Roles & Responsibilities</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.positionId}>
                  <td>{position.positionId}</td>
                  <td>{position.positionName}</td>
                  <td>{position.rolesResponsblities || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEdit(position)} className="action-button edit-button" disabled={loading}>
                      <Edit />
                    </button>
                    <button onClick={() => handleDelete(position.positionId)} className="action-button delete-button" disabled={loading}>
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No positions found.</p>
        )}
      </div>
    </div>
  );
};

export default PositionManagement;