import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Problems from './pages/Problems';
import Collocations from './pages/Collocations';
import Essays from './pages/Essays';
import Progress from './pages/Progress';
import Export from './pages/Export';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily-log" element={<DailyLog />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/collocations" element={<Collocations />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/export" element={<Export />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
