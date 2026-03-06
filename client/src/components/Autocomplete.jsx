import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Form.module.css';

const Autocomplete = ({ options, placeholder, label, onSelect, value }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Met à jour le texte affiché si la valeur change (ex: reset)
  useEffect(() => {
    const selected = options.find(opt => opt._id === value);
    setSearchTerm(selected ? selected.name : '');
  }, [value, options]);

  // Ferme la liste si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.inputGroup} ref={wrapperRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && (
        <ul className={styles.autocompleteList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <li 
                key={opt._id} 
                onClick={() => {
                  onSelect(opt._id);
                  setSearchTerm(opt.name);
                  setIsOpen(false);
                }}
              >
                {opt.name}
              </li>
            ))
          ) : (
            <li className={styles.noOption}>No results found</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;