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

  // получение текущих размеров игрового поля
  const { rows, cols, mines } = BOARD_SIZES[boardSize];

  // игровой таймер
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

  // сохранение результата, если игра выиграна
  useEffect(() => {
    if (gameStatus === 'won') {
      saveHighScore(time, boardSize);
    }
  }, [gameStatus, time, boardSize]);

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

  // случайное расположение мин, первый клик всегда безопасный
  const placeMines = useCallback((board, firstRow, firstCol) => {
    let minesPlaced = 0;
    const newBoard = JSON.parse(JSON.stringify(board));

    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);

      // мины нет на месте первого клика или где уже есть мина
      if ((row !== firstRow || col !== firstCol) && !newBoard[row][col].hasMine) {
        newBoard[row][col].hasMine = true;
        minesPlaced++;
      }
    }

    // подсчёт количества мин по соседству для каждой клетки
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!newBoard[i][j].hasMine) {
          let count = 0;

          // проверка всех 8 соседних клеток
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

  const resetGame = useCallback(() => {
    setBoard(initializeBoard());
    setGameStatus('playing');
    setFlagsPlaced(0);
    setFirstClick(true);
    setTime(0);
    setTimerActive(false);
  }, [initializeBoard]);

  // инициализация игры при смене размера доски или на первом рендере
  useEffect(() => {
    resetGame();
  }, [resetGame, boardSize]);

  // сохранение результата игры в localStorage
  const saveHighScore = (time, size) => {
    const highScores = JSON.parse(localStorage.getItem('minesweeperHighScores') || '{}');
    const sizeScores = highScores[size] || [];

    const newScore = {
      time,
      date: new Date().toISOString()
    };

    const updatedScores = [...sizeScores, newScore]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10);

    highScores[size] = updatedScores;
    localStorage.setItem('minesweeperHighScores', JSON.stringify(highScores));
  };

  // раскрытие клетки
  const revealCell = (row, col) => {
    if (gameStatus !== 'playing' || board[row][col].revealed || board[row][col].flagged) {
      return;
    }

    // запусе таймера при первом клике
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

  // вспомогательная функция для раскрытия клеток (и возможных соседних)
  const revealCellOnBoard = (board, row, col) => {
    if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col].revealed) {
      return;
    }

    board[row][col].revealed = true;
    board[row][col].flagged = false; // удаляет флаг, если он тут был

    if (board[row][col].hasMine) {
      // раскрывает все мины, когда игра закончена
      revealAllMines(board);
      setGameStatus('lost');
      setBoard(board);
      setTimerActive(false);
      return;
    }

    // Если клетка пустая (рядом нет мин), раскрывает соседние клетки
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

  // раскрывает все мины в случае проигрыша
  const revealAllMines = (board) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (board[i][j].hasMine) {
          board[i][j].revealed = true;
        }
      }
    }
  };

  // переключение флага на клетке
  const toggleFlag = (row, col) => {
    if (gameStatus !== 'playing' || board[row][col].revealed) {
      return;
    }

    const newBoard = [...board];
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);

    // обновляет счётчик проставленных флагов
    setFlagsPlaced(newBoard[row][col].flagged ? flagsPlaced + 1 : flagsPlaced - 1);
  };

  // проверка победы игрока
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
      'white',       // 8
    ];
    return colors[count];
  };

  const renderCellContent = (cell) => {
    if (!cell.revealed) {
      return cell.flagged ? '🚩' : '';
    }
    if (cell.hasMine) {
      return '💣';
    }
    return cell.adjacentMines > 0 ? cell.adjacentMines : '';
  };

  const handleSizeChange = (size) => {
    setBoardSize(size);
    setShowSettings(false);
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

  const cellSize = boardSize === 'large' ? '20px' : boardSize === 'medium' ? '25px' : '30px';

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

  const renderGame = () => (
    <>
      <div className="game-header">
        <h1>Minesweeper React</h1>
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

      <div className="status-info">
        <div>Status: {gameStatus}</div>
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
    </>
  );

  return (
    <div className="minesweeper-container">
      {showSettings ? renderSettings() : renderGame()}
    </div>
  );
};

export default Minesweeper;