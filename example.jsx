// Example of updated React component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhonemeChart = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [activePhoneme, setActivePhoneme] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [phonemeData, setPhonemeData] = useState({ consonants: [], vowels: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = 'http://localhost:8000/api';
  
  // Fetch languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/languages`);
        setLanguages(response.data);
      } catch (err) {
        setError('Failed to load languages');
        console.error(err);
      }
    };
    
    fetchLanguages();
  }, []);
  
  // Fetch phoneme data when language changes
  useEffect(() => {
    const fetchPhonemeData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/languages/${selectedLanguage}/phonemic`);
        setPhonemeData(response.data);
        setActivePhoneme(null);
        setError(null);
      } catch (err) {
        setError('Failed to load phoneme data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedLanguage) {
      fetchPhonemeData();
    }
  }, [selectedLanguage]);
  
  // Handle language selection
  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };
  
  // Handle phoneme click
  const handlePhonemeClick = (phoneme) => {
    setActivePhoneme(phoneme);
  };
  
  // Play audio
  const playAudio = (audioFile) => {
    if (!audioFile) return;
    
    const audio = new Audio(`${API_BASE_URL}/audio/${selectedLanguage}/${audioFile}`);
    audio.play().catch(err => console.error('Error playing audio:', err));
  };
  
  // ... rest of your component code
};
