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
}