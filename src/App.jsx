//import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import React, { useState, useEffect, useCallback } from 'react';

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

}