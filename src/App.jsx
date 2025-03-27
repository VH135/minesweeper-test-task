// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MinesweeperGame from './Minesweeper.jsx';
import HighScores from './HighScores.jsx';
//import './styles.css'
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MinesweeperGame />} />
        <Route path="/highscores" element={<HighScores />} />
      </Routes>
    </Router>
  );
}

export default App;