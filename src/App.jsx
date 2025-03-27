import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MinesweeperGame from './Minesweeper.jsx';
import HighScores from './HighScores.jsx';

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