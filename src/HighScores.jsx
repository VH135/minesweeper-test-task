import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Minesweeper.css';

const HighScores = () => {
  const navigate = useNavigate();
  const highScores = JSON.parse(localStorage.getItem('minesweeperHighScores') || '{}');

  const getSizeName = (size) => {
    switch (size) {
      case 'small': return 'Small (8×8)';
      case 'medium': return 'Medium (16×16)';
      case 'large': return 'Large (32×16)';
      default: return size;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="highscores-container">
      <h1>Minesweeper High Scores</h1>

      <button
        onClick={() => navigate('/')}
        className="back-button"
      >
        Back to Game
      </button>

      {Object.keys(highScores).length === 0 ? (
        <p className="no-scores">No high scores yet!</p>
      ) : (
        Object.entries(highScores).map(([size, scores]) => (
          <div key={size} className="score-table">
            <h2>{getSizeName(size)}</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((score, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{formatTime(score.time)}</td>
                    <td>{formatDate(score.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default HighScores;