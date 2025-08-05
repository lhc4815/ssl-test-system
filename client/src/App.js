import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import WaitingPage from './pages/WaitingPage';
import TestPage from './pages/TestPage';
import CompletePage from './pages/CompletePage';
import './App.css';

function App() {
  console.log('🚀 App component is rendering');
  
  React.useEffect(() => {
    console.log('🔧 App component mounted');
    console.log('📍 Current URL:', window.location.href);
    console.log('📂 Current pathname:', window.location.pathname);
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/wait" element={<WaitingPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/complete" element={<CompletePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
