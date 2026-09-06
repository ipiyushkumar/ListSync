import { configureStore } from '@reduxjs/toolkit';
import { mediaApi } from './apiSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      [mediaApi.reducerPath]: mediaApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(mediaApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
