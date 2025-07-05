import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from ".";
import axios from "axios";
import type { CartItem } from "../types/CartItem";
import type { Cart } from "../types/Cart";

import { getCart, saveCart } from "../utils/cart";

// Преобразование с сервера → клиент
const mapServerToClient = (item: Cart): CartItem => {
  const mapped = {
    id: item.id,
    sneakerId: item.sneaker,
    sizeId: item.size.id,   // здесь берем именно ID размера
    quantity: item.quantity,
  };
  console.log("📥 mapServerToClient:", item, "→", mapped);
  return mapped;
};


// Загрузка корзины
export const fetchCart = createAsyncThunk<CartItem[]>(
  "cart/fetch",
  async () => {
    const token = localStorage.getItem("token");

    if (token) {
      console.log("🔄 [fetchCart] Отправляем запрос на сервер...");
      const res = await axios.get<Cart[]>("http://localhost:8000/api/cart/", {
        headers: { Authorization: `Token ${token}` },
      });
      console.log("✅ [fetchCart] Ответ от сервера:", res.data);
      return res.data.map(mapServerToClient);
    } else {
      const localCart = getCart();
      console.log("🗃️ [fetchCart] Загрузка из localStorage:", localCart);
      return localCart;
    }
  }
);
export const addToCart = createAsyncThunk<CartItem[], CartItem>(
  "cart/addToCart",
  async (cartItem) => {
    const token = localStorage.getItem("token");
    const toServerFormat = (item: CartItem) => ({
      sneaker: item.sneakerId,
      size_id: item.sizeId,
      quantity: item.quantity,
    });

    if (token) {
      const res = await axios.post<Cart>(
        "http://localhost:8000/api/cart/",
        toServerFormat(cartItem),
        { headers: { Authorization: `Token ${token}` } }
      );
      return [mapServerToClient(res.data)];
    } else {
      const cart = getCart();
      const index = cart.findIndex(
        (item) =>
          item.sneakerId === cartItem.sneakerId &&
          item.sizeId === cartItem.sizeId
      );

      if (index >= 0) {
        cart[index].quantity += cartItem.quantity;
      } else {
        cart.push(cartItem);
      }

      saveCart(cart);
      return cart;
    }
  }
);


// Обновление количества
export const updateCartItem = createAsyncThunk<CartItem[], CartItem>(
  "cart/updateCartItem",
  async (cartItem) => {
    const token = localStorage.getItem("token");
    console.log("✏️ [updateCartItem] Изменение количества:", cartItem);

    if (token && cartItem.id !== undefined) {
      const res = await axios.patch<Cart[]>(
        `http://localhost:8000/api/cart/${cartItem.id}/`,
        { quantity: cartItem.quantity },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      console.log("✅ [updateCartItem] Сервер ответил:", res.data);
      return res.data.map(mapServerToClient);
    } else {
      const cart = getCart();
      const index = cart.findIndex(
        (item) =>
          item.sneakerId === cartItem.sneakerId &&
          item.sizeId === cartItem.sizeId  // изменено здесь
      );
      if (index >= 0) {
        cart[index].quantity = cartItem.quantity;
        console.log("📝 [updateCartItem] Обновляем локально:", cart[index]);
        saveCart(cart);
      }
      return cart;
    }
  }
);

// Удаление товара
export const removeCartItem = createAsyncThunk<CartItem[], CartItem>(
  "cart/removeCartItem",
  async (cartItem) => {
    const token = localStorage.getItem("token");
    console.log("🗑️ [removeCartItem] Удаление элемента:", cartItem);

    if (token && cartItem.id !== undefined) {
      const res = await axios.delete<Cart[]>(
        `http://localhost:8000/api/cart/${cartItem.id}/`,
        {
          headers: { Authorization: `Token ${token}` },
          data: {}, // если бэкенд требует тело запроса
        }
      );
      console.log("✅ [removeCartItem] Сервер вернул:", res.data);
      return res.data.map(mapServerToClient);
    } else {
      const cart = getCart().filter(
        (item) =>
          !(
            item.sneakerId === cartItem.sneakerId &&
            item.sizeId === cartItem.sizeId  // изменено здесь
          )
      );
      console.log("🧹 [removeCartItem] Удалили из localStorage:", cartItem);
      saveCart(cart);
      return cart;
    }
  }
);

// Типизация состояния
interface CartState {
  items: CartItem[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: CartState = {
  items: [],
  status: "idle",
};

// Слайс
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      saveCart([]);
      console.log("🧼 [clearCart] Корзина очищена");
    },
  },
  extraReducers: (builder) => {
  builder
    .addCase(fetchCart.pending, (state) => {
      state.status = "loading";
      console.log("⏳ [fetchCart.pending] Загрузка...");
    })
    .addCase(fetchCart.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.items = action.payload;
      console.log("🎯 [fetchCart.fulfilled] Загружено:", action.payload);
    })
    .addCase(fetchCart.rejected, (state) => {
      state.status = "failed";
      console.error("❌ [fetchCart.rejected] Ошибка загрузки корзины");
    })

    .addCase(addToCart.fulfilled, (state, action) => {
      // action.payload - массив с одним элементом, если с сервера, или полный локальный массив
      if (Array.isArray(action.payload) && action.payload.length === 1 && action.payload[0].id !== undefined) {
        // сервер вернул один элемент - обновляем либо добавляем в items
        const newItem = action.payload[0];
        const index = state.items.findIndex(
          (item) =>
            item.id === newItem.id
        );
        if (index >= 0) {
          state.items[index] = newItem;
        } else {
          state.items.push(newItem);
        }
      } else {
        // локальный массив
        state.items = action.payload;
      }
      saveCart(state.items);
      console.log("🎯 [addToCart.fulfilled] Обновлённая корзина:", state.items);
    })

    .addCase(updateCartItem.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        // payload с сервера — обновляем весь список
        state.items = action.payload;
      } else {
        // локально обновляем один элемент
        const updatedItem = action.payload as unknown as CartItem; // для безопасности
        const index = state.items.findIndex(
          (item) =>
            item.sneakerId === updatedItem.sneakerId &&
            item.sizeId === updatedItem.sizeId
        );
        if (index >= 0) {
          state.items[index].quantity = updatedItem.quantity;
        }
      }
      saveCart(state.items);
      console.log("🎯 [updateCartItem.fulfilled] Корзина после обновления:", state.items);
    })

    .addCase(removeCartItem.fulfilled, (state, action) => {
      if (Array.isArray(action.payload)) {
        // сервер вернул обновлённый массив
        state.items = action.payload;
      } else {
        // локальное удаление
        // action.payload - новый локальный массив уже отфильтрован, просто присваиваем
        state.items = action.payload as unknown as CartItem[];
      }
      saveCart(state.items);
      console.log("🎯 [removeCartItem.fulfilled] После удаления:", state.items);
    });
},

});

// Селекторы
export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

// Экспорт
export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
