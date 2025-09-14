import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import RegisterForm from "./pages/register";
import Dashboard from "./pages/welcome";
import Game from "./pages/game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/welcome" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
