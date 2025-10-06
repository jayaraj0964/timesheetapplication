import React, { Component } from 'react';
import '../Timesheet.css';

class TimesheetManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timesheets: [],
      categories: [],
      shifts: [],
      users: [],
      workDate: new Date().toISOString().split('T')[0],
      hoursWorked: '',
      details: '',
      categoryId: '',
      shiftId: '',
      userId: '',
      currentUser: { id: '', role: '', userId: '' },
      editingId: null,
      loading: false,
      error: null,
      successMessage: null,
      timeIn: null,
      timeOut: null,
      isTracking: false,
      elapsedTime: '00:00:00',
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAddOrUpdate = this.handleAddOrUpdate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.fetchTimesheets = this.fetchTimesheets.bind(this);
    this.fetchCategories = this.fetchCategories.bind(this);
    this.fetchShifts = this.fetchShifts.bind(this);
    this.fetchUsers = this.fetchUsers.bind(this);
    this.fetchCurrentUser = this.fetchCurrentUser.bind(this);
    this.retryFetchUsers = this.retryFetchUsers.bind(this);
    this.handleTimeIn = this.handleTimeIn.bind(this);
    this.handleTimeOut = this.handleTimeOut.bind(this);
    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.timer = null;
  }

  // Singleton timer management
  static timerInstance = null;
  static getTimerInstance() {
    if (!TimesheetManagement.timerInstance) {
      TimesheetManagement.timerInstance = {
        timeIn: null,
        interval: null,
        updateElapsedTime: (newTime) => {
          if (TimesheetManagement.timerInstance.currentInstance) {
            TimesheetManagement.timerInstance.currentInstance.setState({ elapsedTime: newTime });
          }
        },
        currentInstance: null,
      };
    }
    return TimesheetManagement.timerInstance;
  }

  componentDidMount() {
    const timerInstance = TimesheetManagement.getTimerInstance();
    timerInstance.currentInstance = this;

    const savedTimeIn = localStorage.getItem('timeIn');
    const savedIsTracking = localStorage.getItem('isTracking') === 'true';
    const savedElapsedTime = localStorage.getItem('elapsedTime') || '00:00:00';

    let timeIn = null;
    if (savedTimeIn && savedTimeIn !== 'null' && savedTimeIn !== '') {
      timeIn = new Date(savedTimeIn);
      if (isNaN(timeIn.getTime())) timeIn = null;
    }

    if (timeIn && savedIsTracking) {
      const elapsedMs = new Date() - timeIn;
      const hours = Math.floor(elapsedMs / 3600000);
      const minutes = Math.floor((elapsedMs % 3600000) / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);
      const currentElapsedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      this.setState({
        timeIn,
        isTracking: true,
        elapsedTime: currentElapsedTime,
      }, () => {
        if (!timerInstance.interval) this.startTimer();
      });
    } else if (timerInstance.timeIn && timerInstance.interval) {
      this.setState({
        timeIn: timerInstance.timeIn,
        isTracking: true,
        elapsedTime: savedElapsedTime,
      });
    }

    this.fetchCurrentUser().then(() => {
      this.fetchCategories();
      this.fetchShifts();
      this.fetchUsers();
      this.fetchTimesheets();
    });
  }

  componentWillUnmount() {
    const timerInstance = TimesheetManagement.getTimerInstance();
    if (this.state.isTracking) {
      timerInstance.timeIn = this.state.timeIn;
      timerInstance.currentInstance = null; // Clear current instance reference
    } else {
      this.stopTimer();
      timerInstance.timeIn = null;
      timerInstance.interval = null;
      timerInstance.currentInstance = null;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.timeIn !== this.state.timeIn || prevState.isTracking !== this.state.isTracking || prevState.elapsedTime !== this.state.elapsedTime) {
      localStorage.setItem('timeIn', this.state.timeIn ? this.state.timeIn.toISOString() : '');
      localStorage.setItem('isTracking', this.state.isTracking);
      localStorage.setItem('elapsedTime', this.state.elapsedTime);
    }
  }

  fetchCurrentUser = async () => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to fetch current user: ${response.status} - ${errorText}`);
      }
      const userData = await response.json();
      const appUserId = userData.id;
      const role = userData.role || 'ROLE_USER';
      const profileUserId = userData.profile?.userId || '';
      this.setState((prevState) => ({
        currentUser: { ...prevState.currentUser, id: appUserId, role, userId: profileUserId.toString() },
        userId: role === 'ROLE_USER' ? profileUserId.toString() : prevState.userId,
      }));
    } catch (error) {
      console.error('Error in fetchCurrentUser:', error);
      this.setState({ error: error.message });
      setTimeout(() => window.location.href = '/', 1500);
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchTimesheets = async () => {
    this.setState({ loading: true, error: null, successMessage: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const response = await fetch(`${BASE_URL}/api/timesheets`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to fetch timesheets: ${response.status} - ${errorText}`);
      }
      const timesheets = await response.json();
      this.setState({ timesheets });
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchCategories = async () => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const response = await fetch(`${BASE_URL}/api/task-categories`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to fetch categories: ${response.status} - ${errorText}`);
      }
      const categories = await response.json();
      this.setState({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchShifts = async () => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const response = await fetch(`${BASE_URL}/api/shifts`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to fetch shifts: ${response.status} - ${errorText}`);
      }
      const shifts = await response.json();
      this.setState({ shifts });
    } catch (error) {
      console.error('Error fetching shifts:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchUsers = async () => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const response = await fetch(`${BASE_URL}/api/users/all`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Please check your authentication token or permissions.');
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }
      const users = await response.json();
      this.setState({ users });
    } catch (error) {
      console.error('Error fetching users:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  retryFetchUsers = async () => {
    this.setState({ loading: true, error: null });
    await this.fetchUsers();
  };

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleTimeIn = () => {
    const { currentUser } = this.state;
    if (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') {
      this.setState({ error: 'User ID not available. Please create a profile or log in again.' });
      return;
    }
    if (!this.state.isTracking) {
      const newTimeIn = new Date();
      const timerInstance = TimesheetManagement.getTimerInstance();
      timerInstance.timeIn = newTimeIn;
      this.setState({ timeIn: newTimeIn, isTracking: true, elapsedTime: '00:00:00' }, this.startTimer);
    }
  };

  handleTimeOut = async () => {
    const { details, categoryId, shiftId, currentUser, timeIn } = this.state;
    if (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') {
      this.setState({ error: 'User ID is required. Please create a profile or log in again.' });
      return;
    }
    if (!details || !categoryId || !shiftId) {
      this.setState({ error: 'Please fill all fields (Details, Category, Shift) before Time Out.' });
      return;
    }
    if (!timeIn) {
      this.setState({ error: 'Please click Time In before Time Out.' });
      return;
    }

    const timeOut = new Date();
    const elapsedMs = timeOut - timeIn;
    const hours = Math.floor(elapsedMs / 3600000);
    const minutes = Math.floor((elapsedMs % 3600000) / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const hoursWorked = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    this.setState({ timeOut, hoursWorked, isTracking: false }, this.stopTimer);

    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.setState({ error: 'No authentication token found. Please log in.' });
        return;
      }

      const userId = currentUser.role === 'ROLE_ADMIN' ? this.state.userId || currentUser.userId : currentUser.userId;
      if (!userId && currentUser.role !== 'ROLE_ADMIN') {
        throw new Error('User ID is required for non-admin users.');
      }
      const response = await fetch(`${BASE_URL}/api/timesheets/posttimesheet`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workDate: this.state.workDate,
          hoursWorked,
          details,
          categoryId: parseInt(categoryId),
          shiftId: parseInt(shiftId),
          userId: userId ? parseInt(userId) : null,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to save timesheet: ${response.status} - ${errorText}`);
      }
      this.setState({
        workDate: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        details: '',
        categoryId: '',
        shiftId: '',
        userId: currentUser.role === 'ROLE_USER' ? currentUser.userId : '',
        timeIn: null,
        timeOut: null,
        isTracking: false,
        elapsedTime: '00:00:00',
        successMessage: 'Timesheet saved successfully!',
      });
      await this.fetchTimesheets();
      localStorage.removeItem('timeIn');
      localStorage.removeItem('isTracking');
      localStorage.removeItem('elapsedTime');
      TimesheetManagement.getTimerInstance().timeIn = null;
    } catch (error) {
      console.error('Error in handleTimeOut:', error);
      this.setState({ error: error.message });
    }
  };

  handleAddOrUpdate = async (e) => {
    e.preventDefault();
    const { workDate, hoursWorked, details, categoryId, shiftId, currentUser, editingId } = this.state;
    if (currentUser.role !== 'ROLE_ADMIN') {
      this.setState({ error: 'Only admins can add or update timesheets.' });
      return;
    }
    if (!workDate || !hoursWorked || !details || !categoryId || !shiftId || !this.state.userId) {
      this.setState({ error: 'All fields are required, including User ID.' });
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(hoursWorked)) {
      this.setState({ error: 'Hours worked must be in HH:MM format.' });
      return;
    }

    this.setState({ loading: true, error: null, successMessage: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No authentication token found. Please log in.');
      const userId = this.state.userId;
      const url = editingId
        ? `${BASE_URL}/api/timesheets/${editingId}`
        : `${BASE_URL}/api/timesheets/posttimesheet`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workDate,
          hoursWorked: `${hoursWorked}:00`,
          details,
          categoryId: parseInt(categoryId),
          shiftId: parseInt(shiftId),
          userId: parseInt(userId),
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} timesheet: ${response.status} - ${errorText}`);
      }
      this.setState({
        workDate: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        details: '',
        categoryId: '',
        shiftId: '',
        userId: '',
        editingId: null,
        successMessage: `Timesheet ${editingId ? 'updated' : 'added'} successfully!`,
      });
      await this.fetchTimesheets();
    } catch (error) {
      console.error('Error in handleAddOrUpdate:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleEdit = (timesheet) => {
    if (this.state.currentUser.role !== 'ROLE_ADMIN') {
      this.setState({ error: 'Only admins can edit timesheets.' });
      return;
    }
    this.setState({
      editingId: timesheet.timesheetId,
      workDate: timesheet.workDate,
      hoursWorked: timesheet.hoursWorked ? timesheet.hoursWorked.substring(0, 5) : '',
      details: timesheet.details,
      categoryId: timesheet.categoryId ? timesheet.categoryId.toString() : '',
      shiftId: timesheet.shiftId ? timesheet.shiftId.toString() : '',
      userId: timesheet.userId ? timesheet.userId.toString() : '',
    });
  };

  handleDelete = async (timesheetId) => {
    if (this.state.currentUser.role !== 'ROLE_ADMIN') {
      this.setState({ error: 'Only admins can delete timesheets.' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this timesheet?')) {
      this.setState({ loading: true, error: null, successMessage: null });
      const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) throw new Error('No authentication token found. Please log in.');
        const response = await fetch(`${BASE_URL}/api/timesheets/${timesheetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 403) throw new Error('Access denied. Insufficient permissions.');
          throw new Error(`Failed to delete timesheet: ${response.status} - ${errorText}`);
        }
        this.setState({ successMessage: 'Timesheet deleted successfully!' });
        await this.fetchTimesheets();
      } catch (error) {
        console.error('Error in handleDelete:', error);
        this.setState({ error: error.message });
      } finally {
        this.setState({ loading: false });
      }
    }
  };

  startTimer = () => {
  const timerInstance = TimesheetManagement.getTimerInstance();
  if (!timerInstance.interval) {
    timerInstance.interval = setInterval(() => {
      // Ensure this.state is accessible by capturing it in a local variable
      const { timeIn, isTracking } = this.state;
      if (isTracking && timeIn) {
        const elapsedMs = new Date() - new Date(timeIn);
        const hours = Math.floor(elapsedMs / 3600000);
        const minutes = Math.floor((elapsedMs % 3600000) / 60000);
        const seconds = Math.floor((elapsedMs % 60000) / 1000);
        const newElapsedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerInstance.updateElapsedTime(newElapsedTime);
      }
    }, 1000);
  }
};

  stopTimer = ()=> {
    const timerInstance = TimesheetManagement.getTimerInstance();
    if (timerInstance.interval) {
      clearInterval(timerInstance.interval);
      timerInstance.interval = null;
    }
  };

  render() {
    const { timesheets, categories, shifts, users, workDate, hoursWorked, details, categoryId, shiftId, userId, currentUser, editingId, loading, error, successMessage, isTracking, elapsedTime } = this.state;

    return (
      <div className="timesheet-container">
        <h2 className="timesheet-title">
          {currentUser.role === 'ROLE_ADMIN' ? 'All Timesheets' : 'My Timesheet Management'}
        </h2>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {error && (
          <p className="error-message">
            {error}
            {error.includes('Failed to fetch users') && (
              <button onClick={this.retryFetchUsers} className="retry-button">Retry</button>
            )}
          </p>
        )}

        <form onSubmit={this.handleAddOrUpdate} className="timesheet-form">
          <div className="form-group">
            <input
              type="date"
              name="workDate"
              value={workDate}
              onChange={this.handleInputChange}
              required
              disabled={currentUser.role !== 'ROLE_ADMIN'}
            />
            <div className="time-buttons">
              <button
                type="button"
                onClick={this.handleTimeIn}
                disabled={isTracking || (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') || loading}
                className={isTracking || (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') || loading ? 'disabled' : ''}
              >
                Time In
              </button>
              <button
                type="button"
                onClick={this.handleTimeOut}
                disabled={!isTracking || (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') || loading}
                className={!isTracking || (!currentUser.userId && currentUser.role !== 'ROLE_ADMIN') || loading ? 'disabled' : ''}
              >
                Time Out
              </button>
            </div>
            <p className="track-time">Track Time: {elapsedTime}</p>
            <input
              type="time"
              name="hoursWorked"
              value={hoursWorked}
              onChange={this.handleInputChange}
              required
              disabled={true}
            />
            <textarea
              name="details"
              placeholder="Details"
              value={details}
              onChange={this.handleInputChange}
              required
              disabled={(currentUser.role !== 'ROLE_ADMIN' && editingId !== null) || loading}
            />
            <select
              name="categoryId"
              value={categoryId}
              onChange={this.handleInputChange}
              required
              disabled={(currentUser.role !== 'ROLE_ADMIN' && editingId !== null) || loading}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId.toString()}>{cat.categoryName}</option>
              ))}
            </select>
            <select
              name="shiftId"
              value={shiftId}
              onChange={this.handleInputChange}
              required
              disabled={(currentUser.role !== 'ROLE_ADMIN' && editingId !== null) || loading}
            >
              <option value="">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift.shiftId} value={shift.shiftId.toString()}>{shift.shiftName}</option>
              ))}
            </select>
            {currentUser.role === 'ROLE_ADMIN' ? (
              <select
                name="userId"
                value={userId}
                onChange={this.handleInputChange}
                required
                disabled={loading}
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId.toString()}>
                    {user.firstName || user.email || `User ${user.userId}`}
                  </option>
                ))}
              </select>
            ) : (
              <input type="hidden" name="userId" value={currentUser.userId} readOnly />
            )}
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || isTracking || currentUser.role !== 'ROLE_ADMIN'}
              className={loading || isTracking || currentUser.role !== 'ROLE_ADMIN' ? 'disabled' : ''}
            >
              {editingId ? 'Update Timesheet' : 'Add Timesheet'}
            </button>
            {editingId && currentUser.role === 'ROLE_ADMIN' && (
              <button
                type="button"
                onClick={() => this.setState({
                  editingId: null,
                  workDate: new Date().toISOString().split('T')[0],
                  hoursWorked: '',
                  details: '',
                  categoryId: '',
                  shiftId: '',
                  userId: currentUser.role === 'ROLE_USER' ? currentUser.userId : '',
                })}
                disabled={loading}
                className={loading ? 'disabled' : ''}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p className="loading-message">Loading timesheets...</p>
        ) : timesheets.length > 0 ? (
          <div>
            <h3 className="timesheet-table-title">
              {currentUser.role === 'ROLE_ADMIN' ? 'All Timesheets' : 'My Timesheets'}
            </h3>
            <table className="timesheet-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours Worked</th>
                  <th>Details</th>
                  <th>Category</th>
                  <th>Shift</th>
                  {currentUser.role === 'ROLE_ADMIN' && <th>User</th>}
                  {currentUser.role === 'ROLE_ADMIN' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {timesheets.map((timesheet) => (
                  <tr key={timesheet.timesheetId}>
                    <td>{timesheet.workDate}</td>
                    <td>{timesheet.hoursWorked ? timesheet.hoursWorked.substring(0, 5) : ''}</td>
                    <td>{timesheet.details}</td>
                    <td>{categories.find((cat) => cat.categoryId === timesheet.categoryId)?.categoryName || 'N/A'}</td>
                    <td>{shifts.find((shift) => shift.shiftId === timesheet.shiftId)?.shiftName || 'N/A'}</td>
                    {currentUser.role === 'ROLE_ADMIN' && (
                      <td>
                        {timesheet.userId
                          ? users.find((user) => user.userId === timesheet.userId)?.firstName ||
                            users.find((user) => user.userId === timesheet.userId)?.email ||
                            `User ${timesheet.userId}`
                          : 'N/A'}
                      </td>
                    )}
                    {currentUser.role === 'ROLE_ADMIN' && (
                      <td>
                        <button onClick={() => this.handleEdit(timesheet)} disabled={loading} className={loading ? 'disabled' : ''}>Edit</button>
                        <button onClick={() => this.handleDelete(timesheet.timesheetId)} disabled={loading} className={loading ? 'disabled' : ''}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-timesheets">No timesheets found.</p>
        )}
      </div>
    );
  }
}

export default TimesheetManagement;