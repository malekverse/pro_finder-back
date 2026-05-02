import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarPicker = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const numDays = daysInMonth(month, year);
  const firstDay = firstDayOfMonth(month, year);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderDays = () => {
    const dayElements = [];
    // Prefix empty slots
    for (let i = 0; i < firstDay; i++) {
        dayElements.push(<div key={`empty-${i}`} style={s.emptyDay} />);
    }

    for (let d = 1; d <= numDays; d++) {
        const dateObj = new Date(year, month, d);
        const isPast = dateObj < today;
        const isSelected = selectedDate && 
                          selectedDate.getDate() === d && 
                          selectedDate.getMonth() === month && 
                          selectedDate.getFullYear() === year;

        dayElements.push(
            <div 
                key={d} 
                className={`day-cell ${isPast ? 'past' : 'clickable'} ${isSelected ? 'selected' : ''}`}
                style={{
                    ...s.dayCell,
                    ...(isPast ? s.pastDay : s.clickableDay),
                    ...(isSelected ? s.selectedDay : {})
                }}
                onClick={() => !isPast && onDateSelect(dateObj)}
            >
                {d}
            </div>
        );
    }
    return dayElements;
  };

  return (
    <div style={s.calendar}>
      <div style={s.header}>
        <button onClick={handlePrevMonth} style={s.navBtn}><ChevronLeft size={18} /></button>
        <span style={s.monthLabel}>{monthNames[month]} {year}</span>
        <button onClick={handleNextMonth} style={s.navBtn}><ChevronRight size={18} /></button>
      </div>
      <div style={s.daysGrid}>
        {days.map(day => <div key={day} style={s.dayHeader}>{day}</div>)}
        {renderDays()}
      </div>
      <style>{`
        .day-cell.clickable:hover { 
            background: #f1f5f9 !important; 
            color: #1E3A5F !important;
            transform: scale(1.1);
        }
        .day-cell.selected {
            background: #1E3A5F !important;
            color: #fff !important;
            box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
        }
      `}</style>
    </div>
  );
};

const s = {
  calendar: {
    background: '#fff',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    width: '100%',
    maxWidth: '350px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  monthLabel: {
    fontWeight: '800',
    fontSize: '14px',
    color: '#1E3A5F'
  },
  navBtn: {
    background: '#f8fafc',
    border: 'none',
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    color: '#64748b'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px'
  },
  dayHeader: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: '700',
    color: '#4f5d6fff',
    paddingBottom: '1px',
    textTransform: 'uppercase'
  },
  dayCell: {
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  emptyDay: { height: '25px' },
  pastDay: { color: '#cbd5e1', cursor: 'default', fontSize: '12px' },
  clickableDay: { color: '#475569', cursor: 'pointer' },
  selectedDay: { zIndex: 2 }
};

export default CalendarPicker;
