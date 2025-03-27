import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Minesweeper.css';

const BOARD_SIZES = {
  small: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  large: { rows: 16, cols: 32, mines: 100 }
};

const Minesweeper = () => {
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState('medium');
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get current board dimensions
  const { rows, cols, mines } = BOARD_SIZES[boardSize];

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!timerActive && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, time]);

  // Save high score when game is won
  useEffect(() => {
    if (gameStatus === 'won') {
      saveHighScore(time, boardSize);
    }
  }, [gameStatus, time, boardSize]);

  // Initialize the board
  const initializeBoard = useCallback(() => {
    const newBoard = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push({
          revealed: false,
          hasMine: false,
          flagged: false,
          adjacentMines: 0,
        });
      }
      newBoard.push(row);
    }
    return newBoard;
  }, [rows, cols]);

  // Place mines randomly, ensuring the first click is safe
  const placeMines = useCallback((board, firstRow, firstCol) => {
    let minesPlaced = 0;
    const newBoard = JSON.parse(JSON.stringify(board));

    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);

      // Don't place a mine on the first click position or where a mine already exists
      if ((row !== firstRow || col !== firstCol) && !newBoard[row][col].hasMine) {
        newBoard[row][col].hasMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines for each cell
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newBoard[i][j].hasMine) {
          let count = 0;
          // Check all 8 surrounding cells
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && newBoard[ni][nj].hasMine) {
                count++;
              }
            }
          }
          newBoard[i][j].adjacentMines = count;
        }
      }
    }

    return newBoard;
  }, [rows, cols, mines]);

  // Reset the game
  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setGameStatus('playing');
    setFlagsPlaced(0);
    setFirstClick(true);
    setTime(0);
    setTimerActive(false);
  }, [initializeBoard]);

  // Initialize the game when board size changes or on first render
  useEffect(() => {
    resetGame();
  }, [resetGame, boardSize]);

  // Save high score to localStorage
  const saveHighScore = (time, size) => {
    const highScores = JSON.parse(localStorage.getItem('minesweeperHighScores') || '{}');
    const sizeScores = highScores[size] || [];

    // Add new score
    const newScore = {
      time,
      date: new Date().toISOString()
    };

    // Update scores and keep only top 10
    const updatedScores = [...sizeScores, newScore]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);

    highScores[size] = updatedScores;
    localStorage.setItem('minesweeperHighScores', JSON.stringify(highScores));
  };

  // Reveal a cell
  const revealCell = (row, col) => {
    if (gameStatus !== 'playing' || board[row][col].revealed || board[row][col].flagged) {
      return;
    }

    // Start timer on first click
    if (firstClick) {
      setTimerActive(true);
      const newBoard = placeMines(board, row, col);
      setBoard(newBoard);
      setFirstClick(false);
      // Now reveal the cell on the new board
      revealCellOnBoard(newBoard, row, col);
      return;
    }

    revealCellOnBoard([...board], row, col);
  };

  // Helper function to reveal a cell (and potentially adjacent cells)
  const revealCellOnBoard = (board, row, col) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col].revealed) {
      return;
    }

    board[row][col].revealed = true;
    board[row][col].flagged = false; // Remove flag if it was there

    if (board[row][col].hasMine) {
      // Game over - reveal all mines
      revealAllMines(board);
      setGameStatus('lost');
      setBoard(board);
      setTimerActive(false);
      return;
    }

    // If it's an empty cell (no adjacent mines), reveal adjacent cells recursively
    if (board[row][col].adjacentMines === 0) {
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          revealCellOnBoard(board, row + di, col + dj);
        }
      }
    }

    setBoard([...board]);
    checkWinCondition(board);
  };

  // Reveal all mines when game is lost
  const revealAllMines = (board) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (board[i][j].hasMine) {
          board[i][j].revealed = true;
        }
      }
    }
  };

  // Toggle flag on a cell
  const toggleFlag = (row, col) => {
    if (gameStatus !== 'playing' || board[row][col].revealed) {
      return;
    }

    const newBoard = [...board];
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);

    // Update flags placed count
    setFlagsPlaced(newBoard[row][col].flagged ? flagsPlaced + 1 : flagsPlaced - 1);
  };

  // Check if the player has won
  const checkWinCondition = (board) => {
    let unrevealedSafeCells = 0;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!board[i][j].revealed && !board[i][j].hasMine) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      setGameStatus('won');
      setTimerActive(false);
    }
  };

  // Get cell color based on adjacent mines count
  const getNumberColor = (count) => {
    const colors = [
      'transparent', // 0
      'blue',        // 1
      'green',       // 2
      'red',         // 3
      'darkblue',    // 4
      'brown',       // 5
      'teal',        // 6
      'black',       // 7
      'gray',        // 8
    ];
    return colors[count];
  };

  // Render cell content
  const renderCellContent = (cell) => {
    if (!cell.revealed) {
      return cell.flagged ? '🚩' : '';
    }
    if (cell.hasMine) {
      return '💣';
    }
    return cell.adjacentMines > 0 ? cell.adjacentMines : '';
  };

  // Handle board size change
  const handleSizeChange = (size) => {
    setBoardSize(size);
    setShowSettings(false);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Calculate cell size based on board dimensions
  const cellSize = boardSize === 'large' ? '20px' : boardSize === 'medium' ? '25px' : '30px';

  // Settings Screen
  const renderSettings = () => (
    <div className="settings-screen">
      <h2>Game Settings</h2>

      <div className="size-options">
        <h3>Board Size:</h3>
        <div className="size-buttons">
          <button
            className={boardSize === 'small' ? 'active' : ''}
            onClick={() => handleSizeChange('small')}
          >
            Small (8×8)
          </button>
          <button
            className={boardSize === 'medium' ? 'active' : ''}
            onClick={() => handleSizeChange('medium')}
          >
            Medium (16×16)
          </button>
          <button
            className={boardSize === 'large' ? 'active' : ''}
            onClick={() => handleSizeChange('large')}
          >
            Large (32×16)
          </button>
        </div>
      </div>

      <div className="settings-buttons">
        <button onClick={() => setShowSettings(false)} className="settings-button">
          Back to Game
        </button>
      </div>
    </div>
  );

  // Game Screen
  const renderGame = () => (
    <>
      <div className="game-header">
        <h1>Minesweeper</h1>
        <div className="header-buttons">
          <button onClick={resetGame} className="header-button" title="Reset">
            🔄
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="header-button"
            title="Settings"
          >
            ⚙️
          </button>
          <button
            onClick={() => navigate('/highscores')}
            className="header-button"
            title="High Scores"
          >
            🏆
          </button>
        </div>
      </div>

      <div className="game-info">
        <div>Mines: {mines - flagsPlaced}</div>
        <div className="face-button">
          {gameStatus === 'playing' ? '😊' : gameStatus === 'won' ? '😎' : '😵'}
        </div>
        <div>Time: {formatTime(time)}</div>
      </div>

      <div className="board" style={{ maxWidth: `${cols * parseInt(cellSize) + 4}px` }}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${cell.revealed ? 'revealed' : ''} ${cell.flagged ? 'flagged' : ''}`}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(rowIndex, colIndex);
                }}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: boardSize === 'large' ? '12px' : '16px',
                  color: cell.revealed && !cell.hasMine ? getNumberColor(cell.adjacentMines) : 'inherit',
                  backgroundColor: cell.revealed
                    ? cell.hasMine
                      ? '#ff0000'
                      : '#e0e0e0'
                    : '#c0c0c0',
                }}
              >
                {renderCellContent(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="status-info">
        <div>Status: {gameStatus}</div>
      </div>

      <div className="instructions">
        <p>Left-click to reveal a cell</p>
        <p>Right-click to place/remove a flag</p>
      </div>
    </>
  );

  return (
    <div className="minesweeper-container">
      {showSettings ? renderSettings() : renderGame()}
    </div>
  );
};

export default Minesweeper;