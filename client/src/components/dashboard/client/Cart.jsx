import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeFromCart, updateQuantity, clearCart } from "../../../redux/features/cart/cartSlice";
import { useCreateOrderMutation } from "../../../redux/features/orderApiSlice";
import { 
  ShoppingBag, Trash2, Plus, Minus, X, 
  ArrowRight, Building2, Package, Loader2, CheckCircle 
} from "lucide-react";
import { toImageUrl } from "../../../utils/imageUtils";

const Cart = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const carts = useSelector((state) => state.cart.carts);
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();

  const handleCheckout = async (companyId, cart) => {
    // Vérifier si un item dépasse le stock
    const outOfStockItems = cart.items.filter(item => item.quantity > (item.stock || 0));
    if (outOfStockItems.length > 0) {
      alert(`Certains articles sont en rupture de stock : ${outOfStockItems.map(i => i.name).join(', ')}`);
      return;
    }

    try {
      // On vérifie si c'est un professionnel ou une entreprise
      // On peut regarder si le premier item a professionalId
      const isProfessional = !!cart.items[0]?.professionalId;

      const orderData = {
        companyId: isProfessional ? null : companyId,
        professionalId: isProfessional ? companyId : null,
        items: cart.items.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingAddress: { // Example default - in real app would be a form
          street: "Adresse par défaut",
          city: "Ville",
          zipCode: "1000",
          phone: "00000000"
        }
      };

      await createOrder(orderData).unwrap();
      dispatch(clearCart({ companyId }));
      navigate("/user/purchases");
      onClose();
    } catch (err) {
      console.error("Checkout failed:", err);
      alert(err.data?.message || "Erreur lors de la commande.");
    }
  };

  const hasItems = Object.keys(carts).length > 0;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.titleBox}>
            <ShoppingBag size={24} color="#24416b" />
            <h2 style={s.title}>Mon Panier</h2>
          </div>
          <button style={s.closeBtn} onClick={onClose}><X size={24} /></button>
        </div>

        <div style={s.content}>
          {!hasItems ? (
            <div style={s.empty}>
              <ShoppingBag size={64} color="#cbd5e1" />
              <p style={s.emptyText}>Votre panier est vide</p>
              <button style={s.continueBtn} onClick={onClose}>Continuer mes achats</button>
            </div>
          ) : (
            <div style={s.cartList}>
              {Object.entries(carts).map(([companyId, cart]) => (
                <div key={companyId} style={s.companySection}>
                  <div style={s.companyHeader}>
                    <div style={s.companyInfo}>
                      <div style={s.logoBox}>
                        {cart.logoUrl ? (
                          <img src={toImageUrl(cart.logoUrl)} alt="" style={s.logo} />
                        ) : (
                          <Building2 size={20} color="#94a3b8" />
                        )}
                      </div>
                      <h3 style={s.companyName}>{cart.companyName}</h3>
                    </div>
                    <button 
                      style={s.clearBtn} 
                      onClick={() => dispatch(clearCart({ companyId }))}
                    >
                      Vider ce panier
                    </button>
                  </div>

                  <div style={s.itemList}>
                    {cart.items.map((item) => (
                      <div key={item._id} style={s.itemRow}>
                        <div style={s.itemMain}>
                          <div style={s.itemImgBox}>
                            {item.imagesProduct?.[0] ? (
                              <img src={toImageUrl(item.imagesProduct[0])} alt="" style={s.itemImg} />
                            ) : (
                              <Package size={24} color="#cbd5e1" />
                            )}
                          </div>
                          <div style={s.itemDetails}>
                            <h4 style={s.itemName}>{item.name}</h4>
                            <p style={s.itemPrice}>{item.price.toLocaleString()} DT</p>
                            {item.quantity > (item.stock || 0) && (
                              <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', margin: '4px 0 0' }}>
                                Rupture de stock (Max: {item.stock || 0})
                              </p>
                            )}
                          </div>
                        </div>

                        <div style={s.itemActions}>
                          <div style={s.qtyBox}>
                            <button 
                              style={s.qtyBtn} 
                              onClick={() => dispatch(updateQuantity({ 
                                companyId, 
                                productId: item._id, 
                                quantity: Math.max(1, item.quantity - 1) 
                              }))}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={s.qtyValue}>{item.quantity}</span>
                            <button 
                              style={s.qtyBtn} 
                              onClick={() => dispatch(updateQuantity({ 
                                companyId, 
                                productId: item._id, 
                                quantity: item.quantity + 1 
                              }))}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            style={s.removeBtn}
                            onClick={() => dispatch(removeFromCart({ companyId, productId: item._id }))}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={s.companyFooter}>
                    <div style={s.totalBox}>
                      <span style={s.totalLabel}>Total {cart.companyName} :</span>
                      <span style={s.totalValueText}>
                        {cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} DT
                      </span>
                    </div>
                    <button 
                      style={{
                        ...s.checkoutBtn,
                        opacity: (isCreating || cart.items.some(item => item.quantity > (item.stock || 0))) ? 0.6 : 1,
                        cursor: (isCreating || cart.items.some(item => item.quantity > (item.stock || 0))) ? 'not-allowed' : 'pointer'
                      }}
                      disabled={isCreating || cart.items.some(item => item.quantity > (item.stock || 0))}
                      onClick={() => handleCheckout(companyId, cart)}
                    >
                      {isCreating ? <Loader2 className="animate-spin" /> : (
                        <>Valider la commande <ArrowRight size={18} /></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
//
const s = {
  overlay: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { background: '#f8fafc', width: '100%', maxWidth: '600px', height: '90vh', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { padding: '20px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  titleBox: { display: 'flex', alignItems: 'center', gap: '12px' },
  title: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' },
  content: { flex: 1, overflowY: 'auto', padding: '24px' },
  empty: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  emptyText: { fontSize: '18px', fontWeight: '600', color: '#64748b', margin: 0 },
  continueBtn: { padding: '12px 24px', background: '#24416b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  cartList: { display: 'flex', flexDirection: 'column', gap: '30px' },
  companySection: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  companyHeader: { padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' },
  companyInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoBox: { width: '32px', height: '32px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  companyName: { fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0 },
  clearBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  itemList: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  itemRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' },
  itemMain: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  itemImgBox: { width: '50px', height: '50px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemDetails: { display: 'flex', flexDirection: 'column', gap: '2px' },
  itemName: { fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: 0 },
  itemPrice: { fontSize: '13px', color: '#64748b', margin: 0 },
  itemActions: { display: 'flex', alignItems: 'center', gap: '15px' },
  qtyBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  qtyBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },
  qtyValue: { fontSize: '14px', fontWeight: '700', color: '#1e293b', minWidth: '20px', textAlign: 'center' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', transition: '0.2s' },
  companyFooter: { padding: '16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' },
  totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  totalLabel: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  totalValueText: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  checkoutBtn: { width: '100%', padding: '14px', background: '#24416b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.2s' },
};

export default Cart;
