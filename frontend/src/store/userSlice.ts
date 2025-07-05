import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk<User, string>(
  "user/fetchProfile",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get<User>("http://localhost:8000/api/profile/", {
        headers: { Authorization: `Token ${token}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || "Ошибка при загрузке профиля");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: { payload: User }) {
      state.user = action.payload;
      state.error = null;
    },
    setUserLoggedOut(state) {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, setUserLoggedOut } = userSlice.actions;
export const selectUser = (state: any) => state.user.user;

export default userSlice.reducer;
