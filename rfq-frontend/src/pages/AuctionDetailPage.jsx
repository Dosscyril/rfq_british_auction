import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRFQ, submitBid } from '../services/api';
import {
  PageHeader, Card, StatusBadge, Countdown, RankBadge,
  Button, Field, Input, Alert, Spinner, Currency,
} from '../components/UI';
import { format } from 'date-fns';

export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getRFQ(id);
      setRfq(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <Alert message={error} />;
  if (!rfq)    return <Alert message="RFQ not found" />;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <PageHeader
        title={rfq.name}
        subtitle={`${rfq.reference_id} · Pickup: ${format(new Date(rfq.pickup_date), 'dd MMM yyyy')}`}
        action={
          <Button variant="secondary" onClick={() => navigate('/')}>← All Auctions</Button>
        }
      />

      {/* Status bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Status</label>
            <div style={{ marginTop: 4 }}><StatusBadge status={rfq.status} /></div>
          </div>
          {rfq.status === 'ACTIVE' && (
            <div>
              <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Closes In</label>
              <div style={{ marginTop: 4 }}>
                <Countdown targetDate={rfq.bid_close_time} label="" />
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Current Close</label>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {format(new Date(rfq.bid_close_time), 'dd MMM yyyy, HH:mm:ss')}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Forced Close</label>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
              {format(new Date(rfq.forced_close_time), 'dd MMM yyyy, HH:mm:ss')}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#f8fafc', borderRadius: 8, padding: '8px 14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Config: X={rfq.trigger_window_mins}m / Y={rfq.extension_duration_mins}m</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
              Trigger: {rfq.extension_trigger?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Left column: bids + activity log */}
        <div>
          {/* Bids table */}
          <Card>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Supplier Bids ({rfq.bids?.length || 0})
            </h2>
            {rfq.bids?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No bids submitted yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      {['Rank','Supplier','Freight','Origin','Destination','Total','Transit','Validity','Time'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.bids.map((bid, i) => (
                      <tr key={bid.id}
                        style={{
                          background: i === 0 ? '#f0fdf4' : 'transparent',
                          borderBottom: '1px solid #f1f5f9',
                        }}>
                        <td style={{ padding: '10px 10px' }}>
                          <RankBadge rank={bid.rank} />
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: i === 0 ? 700 : 400, color: '#0f172a' }}>
                          {bid.supplier_name}
                        </td>
                        <td style={{ padding: '10px 10px' }}><Currency amount={bid.freight_charges} /></td>
                        <td style={{ padding: '10px 10px' }}><Currency amount={bid.origin_charges} /></td>
                        <td style={{ padding: '10px 10px' }}><Currency amount={bid.destination_charges} /></td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: i === 0 ? '#16a34a' : '#0f172a' }}>
                          <Currency amount={bid.total_amount} />
                        </td>
                        <td style={{ padding: '10px 10px' }}>{bid.transit_time_days}d</td>
                        <td style={{ padding: '10px 10px' }}>{format(new Date(bid.quote_validity), 'dd MMM')}</td>
                        <td style={{ padding: '10px 10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {format(new Date(bid.submitted_at), 'HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Activity log */}
          <Card>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Activity Log
            </h2>
            {rfq.activityLog?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 14 }}>No activity yet.</p>
            ) : (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {rfq.activityLog.map((log) => (
                  <ActivityEntry key={log.id} log={log} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: bid submission */}
        <div>
          {rfq.status === 'ACTIVE' ? (
            <BidForm rfqId={rfq.id} onSuccess={load} />
          ) : (
            <Card>
              <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Bid Submission
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                This auction is <strong>{rfq.status.replace('_', ' ')}</strong>. Bid submission is closed.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Activity entry ─────────────────────────────────────────────
function ActivityEntry({ log }) {
  const EVENT_STYLE = {
    BID_SUBMITTED:       { color: '#0284c7', icon: '●' },
    TIME_EXTENDED:       { color: '#d97706', icon: '↻' },
    AUCTION_CLOSED:      { color: '#6b7280', icon: '✕' },
    AUCTION_FORCE_CLOSED:{ color: '#dc2626', icon: '✕' },
  };
  const s = EVENT_STYLE[log.event_type] || { color: '#6b7280', icon: '●' };

  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
      <span style={{ color: s.color, fontWeight: 700, fontSize: 14, minWidth: 16 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#0f172a' }}>{log.description}</div>
        {log.event_type === 'TIME_EXTENDED' && log.old_close_time && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {format(new Date(log.old_close_time), 'HH:mm:ss')} →{' '}
            {format(new Date(log.new_close_time), 'HH:mm:ss')}
          </div>
        )}
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          {format(new Date(log.created_at), 'dd MMM HH:mm:ss')}
        </div>
      </div>
    </div>
  );
}

// ── Bid submission form ────────────────────────────────────────
const EMPTY_BID = {
  supplierName: '', freightCharges: '', originCharges: '',
  destinationCharges: '', transitTimeDays: '', quoteValidity: '',
};

function BidForm({ rfqId, onSuccess }) {
  const [form, setForm]       = useState(EMPTY_BID);
  const [errors, setErrors]   = useState({});
  const [submitting, setSub]  = useState(false);
  const [apiError, setApiErr] = useState(null);
  const [success, setSuccess] = useState(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const total = (
    (parseFloat(form.freightCharges) || 0) +
    (parseFloat(form.originCharges) || 0) +
    (parseFloat(form.destinationCharges) || 0)
  );

  const validate = () => {
    const e = {};
    if (!form.supplierName.trim()) e.supplierName = 'Required';
    if (!form.freightCharges || isNaN(form.freightCharges)) e.freightCharges = 'Required';
    if (!form.originCharges || isNaN(form.originCharges)) e.originCharges = 'Required';
    if (!form.destinationCharges || isNaN(form.destinationCharges)) e.destinationCharges = 'Required';
    if (!form.transitTimeDays || isNaN(form.transitTimeDays)) e.transitTimeDays = 'Required';
    if (!form.quoteValidity) e.quoteValidity = 'Required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSub(true); setApiErr(null); setSuccess(null);
    try {
      const result = await submitBid(rfqId, {
        ...form,
        freightCharges:     parseFloat(form.freightCharges),
        originCharges:      parseFloat(form.originCharges),
        destinationCharges: parseFloat(form.destinationCharges),
        transitTimeDays:    parseInt(form.transitTimeDays),
      });

      const msg = result.extension
        ? `Bid submitted! Auction extended by ${result.extension.reason}`
        : 'Bid submitted successfully!';
      setSuccess(msg);
      setForm(EMPTY_BID);
      onSuccess();
    } catch (err) {
      setApiErr(err.message);
    } finally {
      setSub(false);
    }
  };

  return (
    <Card>
      <h2 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
        Submit Bid
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>All charges in USD</p>

      {apiError  && <Alert message={apiError} />}
      {success   && <Alert message={success} type="success" />}

      <form onSubmit={handleSubmit}>
        <Field label="Carrier / Supplier Name *" error={errors.supplierName}>
          <Input value={form.supplierName} onChange={e => set('supplierName', e.target.value)} placeholder="e.g. Maersk Line" />
        </Field>
        <Field label="Freight Charges ($) *" error={errors.freightCharges}>
          <Input type="number" min={0} step="0.01" value={form.freightCharges} onChange={e => set('freightCharges', e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Origin Charges ($) *" error={errors.originCharges}>
          <Input type="number" min={0} step="0.01" value={form.originCharges} onChange={e => set('originCharges', e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Destination Charges ($) *" error={errors.destinationCharges}>
          <Input type="number" min={0} step="0.01" value={form.destinationCharges} onChange={e => set('destinationCharges', e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Transit Time (days) *" error={errors.transitTimeDays}>
          <Input type="number" min={1} value={form.transitTimeDays} onChange={e => set('transitTimeDays', e.target.value)} placeholder="e.g. 14" />
        </Field>
        <Field label="Quote Validity *" error={errors.quoteValidity}>
          <Input type="date" value={form.quoteValidity} onChange={e => set('quoteValidity', e.target.value)} />
        </Field>

        {/* Total preview */}
        {total > 0 && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
            padding: '10px 14px', marginBottom: 14, fontSize: 14,
          }}>
            <span style={{ color: '#64748b' }}>Total bid: </span>
            <strong style={{ color: '#16a34a' }}><Currency amount={total} /></strong>
          </div>
        )}

        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Submitting...' : 'Submit Bid'}
        </Button>
      </form>
    </Card>
  );
}