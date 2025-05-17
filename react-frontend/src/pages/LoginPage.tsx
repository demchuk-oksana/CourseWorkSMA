import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the intended destination from state or default to home page
  const from = location.state?.from?.pathname || '/';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    if (isRegisterMode && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      if (isRegisterMode) {
        // Registration logic
        const response = await fetch('http://localhost:5064/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Registration failed');
        }
        
        setSuccess('Registration successful! You can now log in.');
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login logic
        const response = await fetch('http://localhost:5064/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }
        
        const data = await response.json();
        
        // Store tokens via the auth context
        login(data.accessToken, data.refreshToken);
        
        // Navigate to the page the user was trying to access, or home
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${isRegisterMode ? 'Registration' : 'Login'} failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError(null);
    setSuccess(null);
  };
  
  return (
    <div className={styles.loginPageRoot}>
      <div className={styles.loginContainer}>
        <h1 className={styles.loginTitle}>Category Manager</h1>
        
        {error && (
          <div className={styles.loginError}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.loginSuccess}>
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div>
            <label htmlFor="username" className={styles.loginLabel}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.loginInput}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className={styles.loginLabel}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.loginInput}
              disabled={isLoading}
            />
          </div>
          
          {isRegisterMode && (
            <div>
              <label htmlFor="confirmPassword" className={styles.loginLabel}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.loginInput}
                disabled={isLoading}
              />
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={styles.loginButton}
            >
              {isLoading ? 'Processing...' : isRegisterMode ? 'Register' : 'Sign in'}
            </button>
          </div>
          
          <div className={styles.toggleContainer}>
            <button 
              type="button" 
              onClick={toggleMode} 
              className={styles.toggleModeButton}
              disabled={isLoading}
            >
              {isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;