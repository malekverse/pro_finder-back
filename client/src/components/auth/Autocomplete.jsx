import { useState, useRef, useEffect } from 'react';
import styles from "../../styles/Form.module.css";
const Autocomplete = ({ options, placeholder, label, onSelect, value, getOptionLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const labelFn = getOptionLabel || ((opt) => (opt?.name ?? ''));

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
    labelFn(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const selected = typeof value === 'object' ? value : options.find(opt => opt._id === value);
  const displayText = isOpen ? searchTerm : (selected ? labelFn(selected) : '');

  return (
    <div className={styles.inputGroup} ref={wrapperRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={displayText}
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
                  onSelect(opt);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
              >
                {labelFn(opt)}
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
