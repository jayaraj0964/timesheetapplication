import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import '../App.css';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [formData, setFormData] = useState({ startTime: '', endTime: '', shiftName: '', discription: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  // Allowed shift names from backend
  const ALLOWED_SHIFT_NAMES = ['Morning', 'evening', 'late-night', 'us-holiday', 'Indian_holiday','night_shift'];

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const accessToken = localStorage.getItem('accessToken');
      console.log('Fetching shifts with token:', accessToken ? 'Present' : 'Missing');
      if (!accessToken) {
        setMessage({ text: 'No access token found. Please log in.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/shifts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      console.log('✅ /api/shifts response:', data, 'Status:', res.status);
      if (res.ok) {
        setShifts(data);
      } else if (res.status === 403) {
        setMessage({ text: 'Access denied. Insufficient permissions.', type: 'error' });
      } else {
        setMessage({ text: `Failed to fetch shifts: ${res.status} - ${await res.text()}`, type: 'error' });
      }
    } catch (error) {
      console.error('Fetch shifts error:', error);
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
    if (!formData.shiftName.trim()) {
      setMessage({ text: 'Shift name is required.', type: 'error' });
      return;
    }
    if (!ALLOWED_SHIFT_NAMES.includes(formData.shiftName)) {
      setMessage({ text: 'Invalid shift name. Use: Morning, evening, late-night, us-holiday, or Indian_holiday.', type: 'error' });
      return;
    }
    if (!formData.startTime.trim() || !formData.endTime.trim()) {
      setMessage({ text: 'Start time and end time are required.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const accessToken = localStorage.getItem('accessToken');
      console.log('Submitting with token:', accessToken ? 'Present' : 'Missing', 'Token value:', accessToken);
      if (!accessToken) {
        setMessage({ text: 'No access token found. Please log in.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      // Check token expiration
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const exp = tokenPayload.exp * 1000; // Convert to milliseconds
      if (exp < Date.now()) {
        setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
        setTimeout(() => navigate('/'), 1500);
        return;
      }

      const url = editingId ? `/api/shifts/${editingId}` : '/api/shifts/postshifts';
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        startTime: formData.startTime + ':00', // Ensure HH:mm:ss format
        endTime: formData.endTime + ':00',    // Ensure HH:mm:ss format
        shiftName: formData.shiftName,
        discription: formData.discription,
      };
      console.log(`Sending ${method} to ${url} with payload:`, JSON.stringify(payload));

      const res = await fetch(`${BASE_URL}${url}`, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      console.log(`✅ Response from ${method} to ${url}: Status: ${res.status}, Body:`, responseText);

      if (res.ok) {
        setMessage({ text: `Shift ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
        setFormData({ startTime: '', endTime: '', shiftName: '', discription: '' });
        setEditingId(null);
        await fetchShifts();
      } else if (res.status === 403) {
        setMessage({ text: `Access denied: ${responseText}`, type: 'error' });
      } else {
        setMessage({ text: `Failed to ${editingId ? 'update' : 'create'} shift: ${res.status} - ${responseText}`, type: 'error' });
      }
    } catch (error) {
      console.error('Request error:', error);
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shift) => {
    setFormData({
      startTime: shift.startTime.slice(0, 5), // Extract HH:mm
      endTime: shift.endTime.slice(0, 5),     // Extract HH:mm
      shiftName: shift.shiftName,
      discription: shift.discription || '',
    });
    setEditingId(shift.shiftId);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setLoading(true);
      setMessage({ text: '', type: '' });
      try {
        const accessToken = localStorage.getItem('accessToken');
        console.log('Deleting with token:', accessToken ? 'Present' : 'Missing');
        if (!accessToken) {
          setMessage({ text: 'No access token found. Please log in.', type: 'error' });
          setTimeout(() => navigate('/'), 1500);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/shifts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log(`✅ Response from DELETE /api/shifts/${id}: Status: ${res.status}, Body:`, await res.text());
        if (res.ok) {
          setMessage({ text: 'Shift deleted successfully!', type: 'success' });
          await fetchShifts();
        } else if (res.status === 403) {
          setMessage({ text: 'Access denied. Insufficient permissions.', type: 'error' });
        } else {
          setMessage({ text: `Failed to delete shift: ${res.status} - ${await res.text()}`, type: 'error' });
        }
      } catch (error) {
        console.error('Delete shift error:', error);
        setMessage({ text: 'Network error. Please try again.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="title">Shift Management</h1>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
            <span className="message-text">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container">
          <div className="input-group">
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter Start Time"
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter End Time"
              required
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <input
              type="text"
              name="shiftName"
              value={formData.shiftName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter Shift Name"
              list="shiftNames" // Add datalist for suggestions
              required
              disabled={loading}
            />
            <datalist id="shiftNames">
              {ALLOWED_SHIFT_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="input-group">
            <textarea
              name="discription"
              value={formData.discription}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter Description"
              rows="4"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Saving...' : (editingId ? 'Update' : 'Add') + ' Shift'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ startTime: '', endTime: '', shiftName: '', discription: '' });
              }}
              className="submit-button cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </form>

        {loading ? (
          <p>Loading shifts...</p>
        ) : shifts.length > 0 ? (
          <table className="position-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Shift Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.shiftId}>
                  <td>{shift.shiftId}</td>
                  <td>{shift.startTime}</td>
                  <td>{shift.endTime}</td>
                  <td>{shift.shiftName}</td>
                  <td>{shift.discription || 'N/A'}</td>
                  <td>
                    <button onClick={() => handleEdit(shift)} className="action-button edit-button" disabled={loading}>
                      <Edit />
                    </button>
                    <button onClick={() => handleDelete(shift.shiftId)} className="action-button delete-button" disabled={loading}>
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No shifts found.</p>
        )}
      </div>
    </div>
  );
};

export default ShiftManagement;