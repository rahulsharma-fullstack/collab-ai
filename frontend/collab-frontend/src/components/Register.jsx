import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data
      if (!formData.email || !formData.username || !formData.password) {
        setError('All fields are required');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        formData
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/chat');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleRegister}
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
        Register
      </Typography>

      {error && (
        <Typography color="error" align="center" gutterBottom>
          {error}
        </Typography>
      )}

      <TextField
        label="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
        fullWidth
        variant="outlined"
        error={!!error}
      />

      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        fullWidth
        variant="outlined"
        error={!!error}
      />

      <TextField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        fullWidth
        variant="outlined"
        error={!!error}
      />

      <Button 
        type="submit" 
        variant="contained" 
        fullWidth 
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Register'}
      </Button>

      <Button 
        onClick={() => navigate('/login')} 
        variant="text" 
        fullWidth
        sx={{ mt: 1 }}
      >
        Already have an account? Login
      </Button>
    </Box>
  );
};

export default Register;