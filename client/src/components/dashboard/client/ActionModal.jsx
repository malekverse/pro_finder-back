import React, { useState } from "react";
import { X, Minus, Plus, Loader } from "lucide-react";
import { toImageUrl } from "../../../utils/imageUtils";

const ActionModal = ({ type, item, onClose, onSubmit, isLoading, user }) => {
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    zipCode: ""
  });

  if (!item) return null;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={m.overlay} onClick={onClose}>
      <div style={m.content} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <h3 style={m.title}>{type === 'product' ? 'Commander le produit' : 'Réserver le service'}</h3>
          <button onClick={onClose} style={m.close}><X size={20} /></button>
        </div>

        <div style={m.body}>
          <div style={m.itemInfo}>
            <div style={m.itemImgWrapper}>
              <img src={toImageUrl(type === 'product' ? item.imagesProduct?.[0] : item.imagesServices?.[0])} style={m.itemImg} alt="" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={m.itemName}>{item.name}</p>
              <p style={m.itemPrice}>{item.price} TND {type === 'service' && `(${item.duration})`}</p>
              <p style={m.itemCompany}>Vendu par {item.companyId?.companyName || 'Société'}</p>
            </div>
          </div>

          {type === 'product' ? (
            <>
              <div style={m.field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={m.label}>Quantité</label>
                  {quantity > (item.stock || 0) && (
                    <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>
                      Rupture de stock (Max: {item.stock || 0})
                    </span>
                  )}
                </div>
                <div style={m.qtyBox}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={m.qtyBtn}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={m.qtyVal}>{quantity}</span>
                  <button
                    onClick={() => {
                      if (quantity < (item.stock || 0)) {
                        setQuantity(quantity + 1);
                      } else {
                        alert("Stock maximum atteint !");
                      }
                    }}
                    style={m.qtyBtn}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div style={m.field}>
                <label style={m.label}>Adresse de livraison</label>
                <input
                  type="text"
                  name="street"
                  placeholder="Rue et numéro"
                  style={{ ...m.input, marginBottom: '10px' }}
                  value={address.street}
                  onChange={handleAddressChange}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    name="city"
                    placeholder="Ville"
                    style={{ ...m.input, flex: 2 }}
                    value={address.city}
                    onChange={handleAddressChange}
                  />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="CP"
                    style={{ ...m.input, flex: 1 }}
                    value={address.zipCode}
                    onChange={handleAddressChange}
                  />
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={m.label}>Date souhaitée</label>
                <input type="date" style={m.input} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={m.label}>Heure</label>
                <input type="time" style={m.input} value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
          )}

          <div style={m.field}>
            <label style={m.label}>Note optionnelle</label>
            <textarea
              style={m.textarea}
              placeholder="Instructions particulières..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={m.totalBox}>
            <span style={m.totalLabel}>Total à payer :</span>
            <span style={m.totalVal}>{type === 'product' ? (item.price * quantity).toLocaleString() : item.price?.toLocaleString()} TND</span>
          </div>
        </div>

        <div style={m.footer}>
          <button onClick={onClose} style={m.cancelBtn}>Annuler</button>
          <button
            onClick={() => onSubmit({ quantity, date, time, note, address })}
            style={{
              ...m.confirmBtn,
              opacity: (isLoading || (type === 'service' && (!date || !time)) || (type === 'product' && (!address.street || !address.city || quantity > (item.stock || 0)))) ? 0.6 : 1,
              cursor: (isLoading || (type === 'service' && (!date || !time)) || (type === 'product' && (!address.street || !address.city || quantity > (item.stock || 0)))) ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading || (type === 'service' && (!date || !time)) || (type === 'product' && (!address.street || !address.city || quantity > (item.stock || 0)))}
          >
            {isLoading ? <Loader size={18} className="spin" /> : (type === 'product' ? 'Confirmer la commande' : 'Confirmer la réservation')}
          </button>
        </div>
      </div>
    </div>
  );
};

const m = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
  content: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 },
  close: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  body: { padding: '24px' },
  itemInfo: { display: 'flex', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' },
  itemImgWrapper: { width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', flexShrink: 0 },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemName: { fontWeight: 700, fontSize: '16px', color: '#1e293b', margin: '0 0 4px' },
  itemPrice: { fontWeight: 800, color: '#1E3A5F', fontSize: '15px', margin: 0 },
  itemCompany: { fontSize: '12px', color: '#64748b', margin: '4px 0 0' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' },
  qtyBox: { display: 'flex', alignItems: 'center', gap: '0', width: 'fit-content', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  qtyBtn: { width: '36px', height: '36px', border: 'none', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: '0.2s' },
  qtyVal: { width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#1e293b', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', height: '100px', resize: 'none', outline: 'none' },
  totalBox: { marginTop: '24px', padding: '20px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' },
  totalLabel: { fontSize: '15px', fontWeight: 700, color: '#475569' },
  totalVal: { fontSize: '20px', fontWeight: 800, color: '#1E3A5F' },
  footer: { padding: '20px 24px', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' },
  cancelBtn: { padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer', transition: '0.2s' },
  confirmBtn: { padding: '12px 28px', borderRadius: '10px', border: 'none', background: '#1E3A5F', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' },
};

export default ActionModal;