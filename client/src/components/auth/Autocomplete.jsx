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

    // filtra les options  
   const filteredOptions = options
    .filter(opt => labelFn(opt).toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const labelA = labelFn(a).toLowerCase();
      const labelB = labelFn(b).toLowerCase();
      const search = searchTerm.toLowerCase();

      // Match exact
      if (labelA === search && labelB !== search) return -1;
      if (labelB === search && labelA !== search) return 1;

      // Commence par
      const startsWithA = labelA.startsWith(search);
      const startsWithB = labelB.startsWith(search);
      if (startsWithA && !startsWithB) return -1;
      if (startsWithB && !startsWithA) return 1;

      return labelA.localeCompare(labelB);
    });
  //  recupere l'option selectionnée  
  const selected = typeof value === 'object' ? value : options.find(opt => opt._id === value);
  const displayText = isOpen ? searchTerm : (selected ? labelFn(selected) : '');
  
  //signup form
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
