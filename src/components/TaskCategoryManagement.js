import React, { Component } from 'react';

class TaskCategoryManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      categoryName: '',
      description: '',
      editingId: null,
      loading: false,
      error: null,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAddOrUpdate = this.handleAddOrUpdate.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.fetchCategories = this.fetchCategories.bind(this);
  }

  componentDidMount() {
    this.fetchCategories();
  }

  fetchCategories = async () => {
    this.setState({ loading: true, error: null });
    const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.setState({ error: 'No access token found. Please log in.', loading: false });
        setTimeout(() => window.location.href = '/', 1500);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/task-categories`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        throw new Error(`Failed to fetch categories: ${response.status} - ${await response.text()}`);
      }
      const categories = await response.json();
      this.setState({ categories });
    } catch (error) {
      console.error('Fetch categories error:', error);
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
    const { categoryName, description, editingId } = this.state;
    if (!categoryName.trim()) {
      this.setState({ error: 'Category name is required.' });
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
        ? `${BASE_URL}/api/task-categories/${editingId}`
        : `${BASE_URL}/api/task-categories/post_taskCategory`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryName, description }),
      });
      const responseText = await response.text();
      console.log(`Request ${method} to ${url}:`, response.status, responseText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(`Access denied: ${responseText}`);
        }
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} category: ${response.status} - ${responseText}`);
      }
      this.setState({ categoryName: '', description: '', editingId: null });
      this.fetchCategories();
    } catch (error) {
      console.error('Request error:', error);
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleEdit = (category) => {
    this.setState({
      editingId: category.categoryId,
      categoryName: category.categoryName,
      description: category.description || '',
    });
  };

  handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      this.setState({ loading: true, error: null });
      const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          this.setState({ error: 'No access token found. Please log in.', loading: false });
          setTimeout(() => window.location.href = '/', 1500);
          return;
        }

        const response = await fetch(`${BASE_URL}/api/task-categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Access denied. Insufficient permissions.');
          }
          throw new Error(`Failed to delete category: ${response.status} - ${await response.text()}`);
        }
        this.fetchCategories();
      } catch (error) {
        console.error('Delete category error:', error);
        this.setState({ error: error.message });
      } finally {
        this.setState({ loading: false });
      }
    }
  };

  render() {
    const { categories, categoryName, description, editingId, loading, error } = this.state;

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', background: 'linear-gradient(135deg, #f0f4f8, #d9e2ec)', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ color: '#2c3e50', textAlign: 'center', marginBottom: '20px', fontSize: '24px' }}>Task Category Management</h2>
        {error && <p style={{ color: '#e74c3c', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}

        <form onSubmit={this.handleAddOrUpdate} style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              name="categoryName"
              placeholder="Category Name"
              value={categoryName}
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
            <textarea
              name="description"
              placeholder="Description"
              value={description}
              onChange={this.handleInputChange}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px',
                height: '100px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
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
              {editingId ? 'Update Category' : 'Add Category'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => this.setState({ editingId: null, categoryName: '', description: '' })}
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
          <p style={{ textAlign: 'center', color: '#34495e' }}>Loading categories...</p>
        ) : categories.length > 0 ? (
          <div>
            <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Task Categories</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '5px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#ecf0f1' }}>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>ID</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Category Name</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Description</th>
                  <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.categoryId} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{category.categoryId}</td>
                    <td style={{ padding: '10px' }}>{category.categoryName}</td>
                    <td style={{ padding: '10px' }}>{category.description || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => this.handleEdit(category)}
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
                        onClick={() => this.handleDelete(category.categoryId)}
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
          <p style={{ textAlign: 'center', color: '#34495e' }}>No categories found.</p>
        )}
      </div>
    );
  }
}

export default TaskCategoryManagement;