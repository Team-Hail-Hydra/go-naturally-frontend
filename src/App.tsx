import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import AuthPage from "./pages/auth";
import Welcome from "./pages/welcome";
import Game from "./pages/game";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
