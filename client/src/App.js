import React, { useEffect, useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import User from './components/user'
import io from "socket.io-client";

function App() {
  const socket = useRef();
  useEffect(() => {
    socket.current = io.connect("/");
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
        Learn React
          <User />
        </a>      
      </header>
    </div>
  );
}

export default App;
