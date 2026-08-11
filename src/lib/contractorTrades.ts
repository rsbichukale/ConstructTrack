import { Contractor, TradeType } from './types';

export function getContractorTradeTypes(contractor: Contractor): TradeType[] {
  if (Array.isArray(contractor.tradeTypes) && contractor.tradeTypes.length > 0) {
    return contractor.tradeTypes;
  }
  if (contractor.tradeType) {
    return [contractor.tradeType];
  }
  return [];
}

export function contractorHasTrade(contractor: Contractor, trade: TradeType): boolean {
  return getContractorTradeTypes(contractor).includes(trade);
}

export function getContractorPrimaryTrade(contractor: Contractor): TradeType | undefined {
  return getContractorTradeTypes(contractor)[0];
}

export function getContractorTradeLabel(contractor: Contractor): string {
  const trades = getContractorTradeTypes(contractor);
  return trades.length > 0 ? trades.join(', ') : 'UNASSIGNED';
}
