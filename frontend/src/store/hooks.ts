// src/store/hooks.ts
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from ".";

// Хук для типизированного dispatch
export const useAppDispatch: () => AppDispatch = useDispatch;

// Хук для типизированного useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;