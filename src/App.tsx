import { BrowserRouter, Routes, Route } from "react-router-dom";
import Map from "./components/Map";
import { RegisterForm } from "./pages/register";
import Dashboard from "./pages/welcome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/welcome" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
