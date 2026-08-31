import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Problems from './pages/Problems';
import Collocations from './pages/Collocations';
import CollocationDetail from './pages/CollocationDetail';
import Essays from './pages/Essays';
import WritingTask1 from './pages/WritingTask1';
import WritingMistakes from './pages/WritingMistakes';
import Study from './pages/Study';
import Progress from './pages/Progress';
import Export from './pages/Export';
import Topics from './pages/Topics';
import MyWords from './pages/MyWords';
import Synonyms from './pages/Synonyms';
import BandScore from './pages/BandScore';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily-log" element={<DailyLog />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/collocations" element={<Collocations />} />
          <Route path="/collocations/:id" element={<CollocationDetail />} />
          <Route path="/my-words" element={<MyWords />} />
          <Route path="/synonyms" element={<Synonyms />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/essays" element={<Essays />} />
          <Route path="/writing-task1" element={<WritingTask1 />} />
          <Route path="/writing-mistakes" element={<WritingMistakes />} />
          <Route path="/study" element={<Study />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/band-score" element={<BandScore />} />
          <Route path="/export" element={<Export />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
