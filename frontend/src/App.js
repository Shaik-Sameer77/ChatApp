import {BrowserRouter as Router, Routes,Route} from "react-router-dom"

import Login from "./pages/user-login/Login.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path={'/user-login'} element={<Login/>}/>
      </Routes>
    </Router>
  );
}

export default App;
