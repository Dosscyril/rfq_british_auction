import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuctionListPage  from './pages/AuctionListPage';
import CreateRFQPage    from './pages/CreateRFQPage';
import AuctionDetailPage from './pages/AuctionDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <nav style={{
          background: '#0f172a', padding: '0 24px',
          display: 'flex', alignItems: 'center', height: 52,
        }}>
          <a href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            ⚡ British Auction — RFQ
          </a>
        </nav>

        <Routes>
          <Route path="/"            element={<AuctionListPage />} />
          <Route path="/rfqs/new"    element={<CreateRFQPage />} />
          <Route path="/rfqs/:id"    element={<AuctionDetailPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}