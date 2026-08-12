import type { Trade } from "@/types/trade";
export function tradeStats(trades:Trade[]){
  const wins=trades.filter(t=>t.outcome==="win").length,losses=trades.filter(t=>t.outcome==="loss").length,breakeven=trades.filter(t=>t.outcome==="breakeven").length;
  return{total:trades.length,wins,losses,breakeven,winRate:wins+losses?wins/(wins+losses)*100:0,totalPnl:trades.reduce((n,t)=>n+(t.pnl??0),0),pnlCount:trades.filter(t=>t.pnl!=null).length};
}
export function performanceStats(trades:Trade[]){
  const pnlValues=trades.flatMap(t=>t.pnl==null?[]:[t.pnl]);
  const winningPnl=pnlValues.filter(value=>value>0),losingPnl=pnlValues.filter(value=>value<0);
  const grossProfit=winningPnl.reduce((sum,value)=>sum+value,0),grossLoss=Math.abs(losingPnl.reduce((sum,value)=>sum+value,0));
  const signedR=trades.flatMap(t=>t.rr==null||!t.outcome?[]:[t.rr*(t.outcome==="loss"?-1:t.outcome==="win"?1:0)]);
  return{averageWin:winningPnl.length?grossProfit/winningPnl.length:null,averageLoss:losingPnl.length?-grossLoss/losingPnl.length:null,profitFactor:grossLoss?grossProfit/grossLoss:null,netR:signedR.reduce((sum,value)=>sum+value,0),averageR:signedR.length?signedR.reduce((sum,value)=>sum+value,0)/signedR.length:null};
}
