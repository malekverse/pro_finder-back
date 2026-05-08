import React, { useState } from "react";
import { ChevronLeft, ChevronRight, User, Clock, Trash2, CheckCircle2, Lock, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { useCreateManualBlockMutation, useDeleteManualBlockMutation } from "../../../redux/features/reservationApiSlice";

const CompanyCalendar = ({ reservations, onUpdateStatus }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // { date, reservations }
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [createBlock, { isLoading: isBlocking }] = useCreateManualBlockMutation();
  const [deleteBlock] = useDeleteManualBlockMutation();

  const allSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const handleDayClick = (d, dayReservations) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSelectedDay({ date: dateStr, d, res: dayReservations });
    setIsModalOpen(true);
  };

  const handleBlockAll = async () => {
    try {
      const bookedSlots = selectedDay.res.map(r => r.timeSlot);
      const slotsToBlock = allSlots.filter(s => !bookedSlots.includes(s));
      
      await createBlock({
        date: selectedDay.date,
        timeSlots: slotsToBlock
      }).unwrap();
      
      setIsModalOpen(false);
    } catch (err) {
      alert("Erreur lors du blocage : " + (err.data?.message || err.message));
    }
  };

  const handleToggleSlot = async (slot) => {
    const existingBlock = selectedDay.res.find(r => r.timeSlot === slot && r.isManualBlock);
    if (existingBlock) {
      await deleteBlock(existingBlock._id).unwrap();
      // Update local state to reflect change immediately if possible, or wait for polling
    } else {
      await createBlock({
        date: selectedDay.date,
        timeSlots: [slot]
      }).unwrap();
    }
  };

  const renderDays = () => {
    const dayElements = [];
    const firstDay = firstDayOfMonth(month, year);
    const numDays = daysInMonth(month, year);

    for (let i = 0; i < firstDay; i++) {
        dayElements.push(<div key={`empty-${i}`} style={s.emptyDay} />);
    }

    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayReservations = reservations.filter(res => {
        if (!res.date) return false;
        const resDate = new Date(res.date);
        const resDateStr = resDate.toISOString().split('T')[0];
        return resDateStr === dateStr;
      });

      dayElements.push(
        <div key={d} style={s.dayCell} onClick={() => handleDayClick(d, dayReservations)}>
          <span style={s.dayNum}>{d}</span>
          <div style={s.eventsList}>
            {dayReservations.map((res) => (
              <div 
                key={res._id} 
                style={{
                  ...s.event, 
                  background: res.status === 'blocked' ? '#f1f5f9' : (res.status === 'confirmed' || res.status === 'paid' ? '#dcfce7' : res.status === 'cancelled' ? '#fee2e2' : '#eff6ff'),
                  borderLeft: `4px solid ${res.status === 'blocked' ? '#94a3b8' : (res.status === 'confirmed' || res.status === 'paid' ? '#22c55e' : res.status === 'cancelled' ? '#ef4444' : '#3b82f6')}`
                }}
              >
                <div style={s.eventTime}>
                  {res.status === 'blocked' && <Lock size={10} style={{marginRight: 4}} />}
                  {res.timeSlot}
                </div>
                <div style={s.eventName}>
                  {res.status === 'blocked' ? 'INDISPONIBLE' : (res.serviceId?.name || 'Service')}
                </div>
                {res.status !== 'blocked' && (
                  <div style={s.eventService}>
                    {res.userId?.fullName || 'Client'}
                  </div>
                )}
              </div>
            ))}
            {dayReservations.length === 0 && <div style={s.addHint}><Plus size={14} /></div>}
          </div>
        </div>
      );
    }
    return dayElements;
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.navGroup}>
           <button onClick={handlePrevMonth} style={s.navBtn}><ChevronLeft size={20} /></button>
           <h2 style={s.monthTitle}>{monthNames[month]} {year}</h2>
           <button onClick={handleNextMonth} style={s.navBtn}><ChevronRight size={20} /></button>
        </div>
        <div style={s.legend}>
            <div style={s.legendItem}><span style={{...s.dot, background: '#3b82f6'}} /> Réservation</div>
            <div style={s.legendItem}><span style={{...s.dot, background: '#94a3b8'}} /> Bloqué</div>
        </div>
      </div>

      <div style={s.calendarGrid}>
        {days.map(day => <div key={day} style={s.dayHeader}>{day}</div>)}
        {renderDays()}
      </div>

      {isModalOpen && (
        <div style={ms.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={ms.modal} onClick={e => e.stopPropagation()}>
            <div style={ms.header}>
              <div>
                <h3 style={ms.title}>Disponibilités du {selectedDay?.d} {monthNames[month]}</h3>
                <p style={ms.sub}>Gérez vos créneaux manuellement</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={ms.close}><X size={20} /></button>
            </div>

            <div style={ms.content}>
               <button onClick={handleBlockAll} disabled={isBlocking} style={ms.blockFullBtn}>
                  <Lock size={18} /> BLOQUER TOUTE LA JOURNÉE
               </button>

               <div style={ms.divider}>OU BLOQUER PAR CRÉNEAU</div>

               <div style={ms.slotsGrid}>
                  {allSlots.map(slot => {
                    const existingRes = selectedDay.res.find(r => r.timeSlot === slot);
                    const isBlocked = existingRes?.status === 'blocked';
                    const isBooked = existingRes && existingRes.status !== 'blocked' && existingRes.status !== 'cancelled';

                    return (
                      <div 
                        key={slot} 
                        style={{
                          ...ms.slotCard,
                          ...(isBlocked ? ms.slotBlocked : {}),
                          ...(isBooked ? ms.slotBooked : {}),
                          cursor: isBooked ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => !isBooked && handleToggleSlot(slot)}
                      >
                         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                            <span style={{fontWeight:'700'}}>{slot}</span>
                            {isBlocked ? <Lock size={14} color="#ef4444" /> : isBooked ? <CheckCircle2 size={14} color="#10b981" /> : <Plus size={14} color="#94a3b8" />}
                         </div>
                         <span style={{fontSize:'10px', marginTop:'4px', opacity: 0.7}}>
                            {isBooked ? 'RÉSERVÉ' : isBlocked ? 'BLOQUÉ' : 'LIBRE'}
                         </span>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  container: {
    background: '#fff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    minHeight: '800px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  navGroup: { display: 'flex', alignItems: 'center', gap: '20px' },
  monthTitle: { fontSize: '22px', fontWeight: '800', color: '#1E3A5F', margin: 0, minWidth: '180px', textAlign: 'center' },
  navBtn: { 
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', 
    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: '0.2s', color: '#1E3A5F'
  },
  legend: { display: 'flex', gap: '20px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    background: '#e2e8f0',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  dayHeader: {
    background: '#f8fafc',
    padding: '12px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  dayCell: {
    background: '#fff',
    minHeight: '140px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyDay: { background: '#fcfcfc' },
  dayNum: { fontSize: '14px', fontWeight: '700', color: '#94a3b8' },
  eventsList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  event: {
    padding: '6px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: '0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  eventTime: { fontWeight: '800', color: '#1E3A5F' },
  eventName: { fontWeight: '700', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  eventService: { fontSize: '10px', color: '#64748b', fontStyle: 'italic' },
  addHint: { display: 'flex', justifyContent: 'center', padding: '4px', opacity: 0.3, color: '#1E3A5F' }
};

const ms = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '24px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  header: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '18px', fontWeight: '800', color: '#1E3A5F', margin: 0 },
  sub: { fontSize: '13px', color: '#64748b', margin: '4px 0 0' },
  close: { background: '#f8fafc', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  content: { padding: '24px' },
  blockFullBtn: { 
    width: '100%', padding: '16px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', 
    fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s' 
  },
  divider: { margin: '24px 0', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#94a3b8', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' },
  slotsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  slotCard: { 
    padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', 
    display: 'flex', flexDirection: 'column', transition: '0.2s', textAlign: 'left' 
  },
  slotBlocked: { borderColor: '#ef4444', background: '#fef2f2', color: '#ef4444' },
  slotBooked: { borderColor: '#10b981', background: '#f0fdf4', color: '#10b981', opacity: 0.8 },
};

export default CompanyCalendar;
