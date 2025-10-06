import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/user-login/Login.jsx";
import "react-toastify/dist/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from "./Protected.js";
import HomePage from "./components/HomePage.jsx";
import UserDetails from "./components/UserDetails.jsx";
import Status from "./pages/StatusSection/Status.jsx";
import Setting from "./pages/SettingSection/Setting.jsx";
function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path={"/user-login"} element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path={"/"} element={<HomePage />} />
            <Route path={"/user-profile"} element={<UserDetails />} />
            <Route path={"/status"} element={<Status />} />
            <Route path={"/setting"} element={<Setting />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
