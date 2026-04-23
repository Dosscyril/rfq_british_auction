import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRFQs } from '../services/api';
import {
  PageHeader, Card, StatusBadge, Countdown, Button,
  Currency, Spinner, Alert, Select,
} from '../components/UI';
import { format } from 'date-fns';

export default function AuctionListPage() {
  const navigate = useNavigate();
  const [rfqs, setRfqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRFQs({ status: statusFilter || undefined });
      setRfqs(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <PageHeader
        title="British Auction — RFQ System"
        subtitle="Live auction listings with automatic time extensions"
        action={
          <Button onClick={() => navigate('/rfqs/new')}>
            + Create RFQ
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 200 }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="FORCE_CLOSED">Force Closed</option>
        </Select>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {error && <Alert message={error} />}
      {loading ? <Spinner /> : (
        rfqs.length === 0
          ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 48 }}>No RFQs found.</p>
          : rfqs.map((rfq) => (
              <Card key={rfq.id} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{rfq.name}</span>
                      <StatusBadge status={rfq.status} />
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{rfq.reference_id}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {rfq.status === 'ACTIVE' && (
                      <Countdown targetDate={rfq.bid_close_time} label="Closes in" />
                    )}
                    {(rfq.status === 'CLOSED' || rfq.status === 'FORCE_CLOSED') && (
                      <span style={{ fontSize: 13, color: '#64748b' }}>
                        Closed: {format(new Date(rfq.bid_close_time), 'dd MMM yyyy, HH:mm')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12, marginTop: 16, padding: '12px 0',
                  borderTop: '1px solid #f1f5f9',
                }}>
                  <StatBox label="Lowest Bid" value={rfq.lowest_bid ? <Currency amount={rfq.lowest_bid} /> : '—'} />
                  <StatBox label="Total Bids" value={rfq.bid_count} />
                  <StatBox label="Forced Close" value={format(new Date(rfq.forced_close_time), 'dd MMM HH:mm')} />
                  <StatBox label="Current Close" value={format(new Date(rfq.bid_close_time), 'dd MMM HH:mm')} />
                </div>
              </Card>
            ))
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{value}</div>
    </div>
  );
}