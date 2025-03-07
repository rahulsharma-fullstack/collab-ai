import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import axios from 'axios';

const MemoryRecall = () => {
  const [memories, setMemories] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');
  const [days, setDays] = useState(30);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/memories?type=${type}&days=${days}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMemories(response.data.memories);
      setSummary(response.data.summary);
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 600, mx: 'auto', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Memory Recall
      </Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <FormControl size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            label="Type"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="meeting">Meetings</MenuItem>
            <MenuItem value="deadline">Deadlines</MenuItem>
            <MenuItem value="decision">Decisions</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Time Range</InputLabel>
          <Select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            label="Time Range"
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          onClick={fetchMemories}
          disabled={loading}
        >
          Recall
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {summary && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="body1">{summary}</Typography>
            </Paper>
          )}

          {memories.map((memory) => (
            <Paper key={memory._id} sx={{ p: 2, mb: 1, bgcolor: 'grey.100' }}>
              <Typography variant="caption" color="textSecondary">
                {new Date(memory.createdAt).toLocaleDateString()} - {memory.type}
              </Typography>
              <Typography>{memory.content}</Typography>
            </Paper>
          ))}
        </>
      )}
    </Paper>
  );
};

export default MemoryRecall; 