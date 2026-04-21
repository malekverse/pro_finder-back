import React from "react";
import { Clock, Ban } from "lucide-react";

const TimeSlotPicker = ({ slots, selectedSlot, onSlotSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div style={s.container}>
        <div style={s.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={s.skeletonItem} />)}
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div style={s.emptyState}>
        <Ban size={40} color="#94a3b8" />
        <p style={s.emptyText}>Aucun créneau disponible pour cette date.</p>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <h4 style={s.label}>Choisissez une heure :</h4>
      <div style={s.grid}>
        {slots.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.isAvailable}
            style={{
              ...s.slotBtn,
              ...(slot.isAvailable ? s.available : s.booked),
              ...(selectedSlot === slot.time ? s.selected : {})
            }}
            onClick={() => onSlotSelect(slot.time)}
          >
            <Clock size={14} />
            {slot.time}
          </button>
        ))}
      </div>
      <style>{`
        .slot-btn:hover:not(:disabled) {
          border-color: #1E3A5F !important;
          color: #1E3A5F !important;
          background: #f8fafc !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

const s = {
  container: { width: '100%' },
  label: { fontSize: '14px', fontWeight: '800', color: '#1E3A5F', marginBottom: '15px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px'
  },
  slotBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '45px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#fff'
  },
  available: { color: '#475569' },
  booked: {
    background: '#f1f5f9',
    color: '#cbd5e1',
    cursor: 'not-allowed',
    borderStyle: 'dashed'
  },
  selected: {
    background: '#1E3A5F !important',
    color: '#fff !important',
    borderColor: '#1E3A5F !important',
    boxShadow: '0 4px 12px rgba(30, 58, 95, 0.2)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    background: '#f8fafc',
    borderRadius: '16px',
    textAlign: 'center'
  },
  emptyText: { color: '#64748b', fontSize: '14px', marginTop: '10px' },
  skeletonGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  skeletonItem: { height: '45px', background: '#f1f5f9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }
};

export default TimeSlotPicker;
