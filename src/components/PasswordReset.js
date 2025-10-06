// import React, { useState } from 'react';
// import { Eye, EyeOff, Lock, User, Mail, AlertCircle, CheckCircle } from 'lucide-react';
// import './App.css';

// const AuthForm = () => {
//   const [isRegister, setIsRegister] = useState(false);
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     role: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [message, setMessage] = useState({ text: '', type: '' });
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.username.trim()) newErrors.username = 'Username is required';
//     if (!formData.password.trim()) newErrors.password = 'Password is required';
//     if (isRegister && !formData.email.trim()) newErrors.email = 'Email is required';
//     if (isRegister && !formData.role.trim()) newErrors.role = 'Role is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     setMessage({ text: '', type: '' });

//     const endpoint = isRegister ? '/auth/register' : '/auth/login';
//     const payload = isRegister
//       ? {
//           username: formData.username,
//           password: formData.password,
//           email: formData.email,
//           role: formData.role
//         }
//       : {
//           username: formData.username,
//           password: formData.password
//         };

//     try {
//       const response = await fetch(`http://localhost:8080${endpoint}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       const data = await response.json();

//       if (response.ok) {
//         if (!isRegister) {
//           // Login success: store tokens
//           localStorage.setItem('accessToken', data.accessToken);
//           localStorage.setItem('refreshToken', data.refreshToken);
//           setMessage({ text: 'Login successful!', type: 'success' });

//           setTimeout(() => {
//             window.location.href = '/dashboard';
//           }, 1500);
//         } else {
//           setMessage({ text: 'Registration successful!', type: 'success' });
//           setFormData({ username: '', email: '', password: '', role: '' });
//           setIsRegister(false);
//         }
//       } else {
//         const errorText = typeof data === 'string' ? data : 'Something went wrong';
//         setMessage({ text: errorText, type: 'error' });
//       }
//     } catch (error) {
//       setMessage({ text: 'Network error. Try again.', type: 'error' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <div className="header-section">
//           <Lock className="lock-icon" />
//           <h1 className="title">{isRegister ? 'Register' : 'Login'}</h1>
//           <p className="subtitle">{isRegister ? 'Create your account' : 'Access your account'}</p>
//         </div>

//         {message.text && (
//           <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
//             {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
//             <span className="message-text">{message.text}</span>
//           </div>
//         )}

//         <div className="form-container">
//           {/* Username */}
//           <div className="input-group">
//             <label htmlFor="username" className="input-label">Username</label>
//             <div className="input-wrapper">
//               <User className="input-icon" />
//               <input
//                 type="text"
//                 id="username"
//                 name="username"
//                 value={formData.username}
//                 onChange={handleInputChange}
//                 className={`input-field ${errors.username ? 'input-error' : ''}`}
//                 placeholder="Enter username"
//               />
//             </div>
//             {errors.username && <p className="error-text">{errors.username}</p>}
//           </div>

//           {/* Email (only for register) */}
//           {isRegister && (
//             <div className="input-group">
//               <label htmlFor="email" className="input-label">Email</label>
//               <div className="input-wrapper">
//                 <Mail className="input-icon" />
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   className={`input-field ${errors.email ? 'input-error' : ''}`}
//                   placeholder="Enter email"
//                 />
//               </div>
//               {errors.email && <p className="error-text">{errors.email}</p>}
//             </div>
//           )}

//           {/* Role (only for register) */}
//           {isRegister && (
//             <div className="input-group">
//               <label htmlFor="role" className="input-label">Role</label>
//               <select
//                 id="role"
//                 name="role"
//                 value={formData.role}
//                 onChange={handleInputChange}
//                 className={`input-field ${errors.role ? 'input-error' : ''}`}
//               >
//                 <option value="">Select role</option>
//                 <option value="ROLE_USER">User</option>
//                 <option value="ROLE_ADMIN">Admin</option>
//               </select>
//               {errors.role && <p className="error-text">{errors.role}</p>}
//             </div>
//           )}

//           {/* Password */}
//           <div className="input-group">
//             <label htmlFor="password" className="input-label">Password</label>
//             <div className="password-input-wrapper">
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 id="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 className={`input-field password-input ${errors.password ? 'input-error' : ''}`}
//                 placeholder="Enter password"
//               />
//               <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
//                 {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
//               </button>
//             </div>
//             {errors.password && <p className="error-text">{errors.password}</p>}
//           </div>

//           {/* Submit Button */}
//           <button
//             type="button"
//             onClick={handleSubmit}
//             disabled={loading}
//             className={`submit-button ${loading ? 'submit-button-loading' : ''}`}
//           >
//             {loading ? (isRegister ? 'Registering...' : 'Logging in...') : (isRegister ? 'Register' : 'Login')}
//           </button>
//         </div>

//         <div className="footer-section">
//           <p className="toggle-text">
//             {isRegister ? 'Already have an account?' : 'New to banking?'}{' '}
//             <button className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
//               {isRegister ? 'Login here' : 'Register here'}
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuthForm;
