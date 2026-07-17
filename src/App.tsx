import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewRepair from './pages/NewRepair';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Insurance from './pages/Insurance';
import AddInsurance from './pages/AddInsurance';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-repair" element={<NewRepair />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/add-insurance" element={<AddInsurance />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

