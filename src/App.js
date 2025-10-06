import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import CreateProfile from './components/CreateProfile';
import Dashboard from './components/Dashboard';
import UserDetails from './components/UserDetailes';
import RoleManagement from './components/RoleManagement';
import PositionManagement from './components/PositionManagement';
import ShiftManagement from './components/ShiftManagement';
import TaskCategoryManagement from './components/TaskCategoryManagement';
import TeamManagement from './components/TeamManagement';
import TimesheetManagement from './components/TimeSheetManagement';
import UserPositionManagement from './components/UserPositionManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/create-profile/:id" element={<CreateProfile />} />
        <Route path="/users/:id" element={<UserDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/position_management" element={<PositionManagement />} />
        <Route path="/roles" element={<RoleManagement />} />
        <Route path="/shiftmanagemnet" element={<ShiftManagement />} />
        <Route path="/TaskCategoryManagement" element={<TaskCategoryManagement />} />
        <Route path="/TeamManagement" element={<TeamManagement />} />
        <Route path="/TimeSheetManagement" element={<TimesheetManagement />} />
         <Route path="/Userpostions" element={<UserPositionManagement/>} />
      </Routes>
    </Router>
  );
}

export default App;