import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  carts: {}, // { [companyId]: { companyName: '', logoUrl: '', items: [] } }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, companyId, companyName, logoUrl, quantity = 1 } = action.payload;
      
      if (!state.carts[companyId]) {
        state.carts[companyId] = {
          companyName,
          logoUrl,
          items: [],
        };
      }

      const existingItem = state.carts[companyId].items.find(item => item._id === product._id);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.carts[companyId].items.push({ ...product, quantity });
      }
    },
    removeFromCart: (state, action) => {
      const { companyId, productId } = action.payload;
      if (state.carts[companyId]) {
        state.carts[companyId].items = state.carts[companyId].items.filter(item => item._id !== productId);
        if (state.carts[companyId].items.length === 0) {
          delete state.carts[companyId];
        }
      }
    },
    updateQuantity: (state, action) => {
      const { companyId, productId, quantity } = action.payload;
      if (state.carts[companyId]) {
        const item = state.carts[companyId].items.find(item => item._id === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    clearCart: (state, action) => {
      const { companyId } = action.payload;
      delete state.carts[companyId];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
