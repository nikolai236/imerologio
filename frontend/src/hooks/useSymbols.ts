import useApi from "./useApi";

import { type Symbol, type SymbolWithId, type UpdateSymbol } from '../../../shared/trades.types';

const useSymbols = () => {
  const api = useApi();
  const path = '/symbols';

  const getSymbols = async () => {
    const { symbols } = await api.get(path);
    return symbols as SymbolWithId[];
  };

  const createSymbol = async (payload: Symbol) => {
    const { symbol } = await api.post(path,  payload);
    return symbol as SymbolWithId; 
  };

  const updateSymbol = async (id: number, payload: UpdateSymbol) => {
    const { symbol } = await api.patch(path + `/${id}`, payload);
    return symbol as SymbolWithId; 
  };

  return { getSymbols, createSymbol, updateSymbol };
};

export default useSymbols;