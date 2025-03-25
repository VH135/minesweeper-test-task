import React, { useState, useEffect, useCallback } from 'react';
import './App.css'

const BOARD_SIZES = {
  small: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  large: { rows: 16, cols: 32, mines: 100 }
};

const Minesweeper = () => {
  const [boardSize, setBoardSize] = useState('medium');
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [flagsPlaced, setFlagsPlaced] = useState(0);
  const [firstClick, setFirstClick] = useState(true);

  // получение текущих размеров игрового поля
  const { rows, cols, mines } = BOARD_SIZES[boardSize];

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
  }, [initializeBoard]);

  // инициализация игры при смене размера доски или на первом рендере
  useEffect(() => {
    resetGame();
  }, [resetGame, boardSize]);

  // раскрытие клетки
  const revealCell = (row, col) => {
    if (gameStatus !== 'playing' || board[row][col].revealed || board[row][col].flagged) {
      return;
    }

    // расстановка мин при первом клике (мины быть не должно в этой клетке)
    if (firstClick) {
      const newBoard = placeMines(board, row, col);
      setBoard(newBoard);
      setFirstClick(false);
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
      return;
    }


  }

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
      'gray',        // 8
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
  };

  const cellSize = boardSize === 'large' ? '20px' : boardSize === 'medium' ? '25px' : '30px';
}
export default Minesweeper;