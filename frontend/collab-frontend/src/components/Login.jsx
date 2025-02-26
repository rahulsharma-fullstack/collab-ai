import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      if (!formData.email || !formData.password) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        formData
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/chat');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        maxWidth: 400,
        margin: 'auto',
        mt: 4,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Typography variant="h4" gutterBottom align="center">
        Login
      </Typography>

      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}

      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        fullWidth
        variant="outlined"
        autoComplete="email"
      />

      <TextField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        fullWidth
        variant="outlined"
        autoComplete="current-password"
      />

      <Button 
        type="submit" 
        variant="contained" 
        fullWidth 
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>

      <Button 
        onClick={() => navigate('/register')} 
        variant="text" 
        fullWidth
        sx={{ mt: 1 }}
      >
        Don't have an account? Register
      </Button>
    </Box>
  );
};

export default Login;