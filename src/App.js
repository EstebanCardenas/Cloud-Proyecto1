import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import NavBar from './components/NavBar';
import { useState } from 'react';

function App() {
  const [logged, setLogged] = useState(false)

  return (
    <Router>
      <NavBar 
        logged={logged}
        setLogged={setLogged}
      />
    </Router>
  )
}

export default App;
