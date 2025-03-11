import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Loader2 } from 'lucide-react';

const GmailCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeIntegration = async () => {
      try {
        const tempToken = searchParams.get('token');
        if (!tempToken) {
          throw new Error('No token received');
        }

        await axios.post(
          `${API_URL}/api/gmail/complete-integration`,
          { tempToken },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        navigate('/gmail');
      } catch (err) {
        console.error('Integration error:', err);
        setError('Failed to complete Gmail integration');
        setTimeout(() => navigate('/gmail'), 3000);
      }
    };

    completeIntegration();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="text-gray-600">Redirecting back to Gmail page...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
      <div className="text-gray-600">Completing Gmail integration...</div>
    </div>
  );
};

export default GmailCallback; 