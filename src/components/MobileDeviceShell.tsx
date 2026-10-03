export interface ActiveOrderInfo { token: string; orderId?: string; vendor: string; status: string; stage?: 'sent'|'preparing'|'ready'|'declined'; }
interface MobileDeviceShellProps { children: React.ReactNode; activeOrder?: ActiveOrderInfo|null; onClearActiveOrder?: () => void; }
export function MobileDeviceShell({ children, activeOrder, onClearActiveOrder }: MobileDeviceShellProps) {
  return <div className="app-viewport">
    {activeOrder && <button type="button" className="app-order-notice" onClick={onClearActiveOrder}>#{activeOrder.token} · {activeOrder.status}</button>}
    {children}
  </div>;
}
