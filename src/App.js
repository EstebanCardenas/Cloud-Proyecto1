import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import NavBar from './components/NavBar';
import Home from './components/Home'
import Concursos from './components/Concursos'
import { useEffect, useState } from 'react';

function App() {
  const [logged, setLogged] = useState(false)

  //onMount
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (token)
      setLogged(true)
  }, [])

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <NavBar 
            logged={logged}
            setLogged={setLogged}
          />
          <Home />
        </Route>
        <Route path="/concursos">
          <NavBar 
              logged={logged}
              setLogged={setLogged}
          />
          <Concursos />
        </Route>
      </Switch>
    </Router>
  )
}

export default App;
