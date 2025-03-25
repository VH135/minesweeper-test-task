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
}