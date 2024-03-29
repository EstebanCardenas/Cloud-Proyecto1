import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import NavBar from './components/NavBar';
import Home from './components/Home'
import Concursos from './components/Concursos'
import HomeConcurso from './components/HomeConcurso'
import ConcursoDetail from './components/ConcursoDetail'
import { useEffect, useState } from 'react';

function App() {
  const [logged, setLogged] = useState(false)

  //onMount
  useEffect(() => {
    //async function getConcurso

    const token = localStorage.getItem("access_token")
    if (token)
      setLogged(true)
  }, [])

  return (
    <Router>
      <Switch>
        {/* HOME */}
        <Route exact path="/"> 
          <NavBar 
            logged={logged}
            setLogged={setLogged}
          />
          <Home />
        </Route>
        {/* CONCURSOS */}
        <Route path="/concursos">
          <NavBar 
              logged={logged}
              setLogged={setLogged}
          />
          <Concursos />
        </Route>
        {/* HOME DE CONCURSO */}
        <Route path="/home/concurso/:url" component={HomeConcurso} />
        {/* DETAIL CONCURSO ADMINS */}
        <Route path="/concurso/:id" component={ConcursoDetail} />
      </Switch>
    </Router>
  )
}

export default App;
