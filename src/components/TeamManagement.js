import React, { Component } from 'react';

class TeamManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      teams: [],
      teamname: '',
      editingId: null,
      searchKeyword: '',
      loading: false,
      error: null,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAddOrUpdate = this.handleAddOrUpdate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.fetchTeams = this.fetchTeams.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    this.fetchTeams();
  }

  fetchTeams = async (searchTerm = '') => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.setState({ error: 'No access token found. Please log in.', loading: false });
        setTimeout(() => window.location.href = '/', 1500);
        return;
      }

      const url = searchTerm
        ? `${BASE_URL}/api/serachteamskey/${encodeURIComponent(searchTerm)}`
        : `${BASE_URL}/api/getallteams`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        throw new Error(`Failed to fetch teams: ${response.status} - ${errorText}`);
      }
      const teams = await response.json();
      this.setState({ teams });
    } catch (error) {
      console.error('Fetch teams error:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleAddOrUpdate = async (e) => {
    e.preventDefault();
    const { teamname, editingId } = this.state;
    if (!teamname.trim()) {
      this.setState({ error: 'Team name is required.' });
      return;
    }

    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.setState({ error: 'No access token found. Please log in.', loading: false });
        setTimeout(() => window.location.href = '/', 1500);
        return;
      }

      const url = editingId
        ? `${BASE_URL}/api/update/${editingId}`
        : `${BASE_URL}/api/post`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamname }),
      });
      const responseText = await response.text();
      console.log(`Request ${method} to ${url}:`, response.status, responseText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(`Access denied: ${responseText}`);
        }
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} team: ${response.status} - ${responseText}`);
      }
      this.setState({ teamname: '', editingId: null });
      await this.fetchTeams();
    } catch (error) {
      console.error('Request error:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleEdit = (team) => {
    this.setState({
      editingId: team.id,
      teamname: team.teamname,
    });
  };

  handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      this.setState({ loading: true, error: null });
      const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          this.setState({ error: 'No access token found. Please log in.', loading: false });
          setTimeout(() => window.location.href = '/', 1500);
          return;
        }

        const response = await fetch(`${BASE_URL}/api/delete/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 403) {
            throw new Error('Access denied. Insufficient permissions.');
          }
          throw new Error(`Failed to delete team: ${response.status} - ${errorText}`);
        }
        await this.fetchTeams();
      } catch (error) {
        console.error('Delete team error:', error);
        this.setState({ error: error.message });
      } finally {
        this.setState({ loading: false });
      }
    }
  };

  handleSearch = (e) => {
    const searchKeyword = e.target.value;
    this.setState({ searchKeyword });
    this.fetchTeams(searchKeyword);
  };

  render() {
    const { teams, teamname, editingId, searchKeyword, loading, error } = this.state;

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '20px', fontSize: '24px' }}>Team Management</h2>
        {error && <p style={{ color: '#e74c3c', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            name="searchKeyword"
            placeholder="Search teams by keyword..."
            value={searchKeyword}
            onChange={this.handleSearch}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px',
              boxSizing: 'border-box',
            }}
            disabled={loading}
          />
        </div>

        <form onSubmit={this.handleAddOrUpdate} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              name="teamname"
              placeholder="Team Name"
              value={teamname}
              onChange={this.handleInputChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
              required
              disabled={loading}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'background-color 0.3s',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#27ae60')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#2ecc71')}
            >
              {editingId ? 'Update Team' : 'Add Team'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => this.setState({ editingId: null, teamname: '' })}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  marginLeft: '10px',
                  transition: 'background-color 0.3s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#5a6268')}
                onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#6c757d')}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#34495e' }}>Loading teams...</p>
        ) : teams.length > 0 ? (
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Teams</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '5px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>ID</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Team Name</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{team.id}</td>
                    <td style={{ padding: '10px' }}>{team.teamname}</td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => this.handleEdit(team)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#3498db',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          marginRight: '5px',
                          transition: 'background-color 0.3s',
                          opacity: loading ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#2980b9')}
                        onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#3498db')}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => this.handleDelete(team.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#e74c3c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          transition: 'background-color 0.3s',
                          opacity: loading ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#c0392b')}
                        onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#e74c3c')}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#34495e' }}>No teams found.</p>
        )}
      </div>
    );
  }
}

export default TeamManagement;