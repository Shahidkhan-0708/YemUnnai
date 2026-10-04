# One-shop pilot checklist

Use this only after the Phase 2 staging gates pass. Name the participating shop, operating dates, shop operator, and app-support owner in the pilot report. Production deployment still needs an identified, authorized target.

## Before opening

- Sign in through the shop's PIN flow on the device used at the counter. Verify that the displayed shop is correct.
- Confirm item names, whole-rupee prices, pickup location, and shop-confirmed dietary information. Leave unverified dietary information unknown.
- Set remaining portions for tracked items, or leave the quantity blank for untracked items. Confirm that sold-out items cannot be purchased.
- Mark the shop online only when someone can accept orders within three minutes. Place a staging practice order before the first operating day; do not count it as a real purchase.
- Keep buyer Orders and the vendor dashboard accessible. If updates appear stale, refresh; do not assume an animation confirms the current state.
- Before a migration cutover, settle outstanding legacy purchases with the shop. Historical orders remain read-only in the new lifecycle; no old payment or pickup state is inferred.

## For each purchase

1. Match the buyer's Orders screen to the shop, operating date, pickup number, dish, and quantity. Pickup numbers restart for each shop/day.
2. Accept while Pending; optionally enter an estimated preparation time. Decline if the shop cannot fulfil the purchase. Unaccepted orders expire after three minutes.
3. Prepare the dish, then select **Mark ready**. Ready does not mean collected or paid.
4. Resolve any cancellation request before handover. Approve cancellation or reject it with an explanation to the buyer.
5. At the counter, confirm the amount, receive cash or verify counter UPI payment, hand over the food, then select the payment method and **Confirm collection**. Do not mark Collected before both food and payment are confirmed.
6. Answer order-linked help requests. Help can continue after collection; collected orders cannot be cancelled.

## During and after service

- Mark the shop offline when the operator cannot accept new purchases. Update stock promptly as portions run out.
- Inspect overdue Pending orders and unresolved help daily using the privileged [pilot checks](../supabase/pilot_checks.sql). A selected quantity is a remaining quantity, not a lifetime production count.
- Use pickup Edge logs to count checkout attempts, failures, and repeated attempt IDs. Compare repeated attempts to actual order rows; retrying one attempt is expected recovery, not automatically a duplicate purchase.
- Assign every escalated request to the authenticated app-admin support owner. Record the resolution without copying buyer messages or credentials into public logs.
- Close the shop online status at the end of service and settle outstanding purchases. A closed shop can still finish existing orders.

## If something goes wrong

Stop accepting new purchases for any ownership exposure, confirmed duplicate purchase, stock race, lost confirmed order, or contradictory Collected/Cancelled state. Preserve the order records and resolve buyers' existing purchases. Contact the assigned app-support owner through the shop's normal channel; this checklist sends no messages automatically.

Before deployment, record the compatible previous frontend/Edge versions and verify rollback in staging. Put the shop offline before rollback, preserve access to existing orders, and restore those compatible versions. Keep additive tables and secure database functions. Never restore the retired unrestricted order-writing path. Record the incident and rerun the affected regression check before reopening.

## Pilot report

Record operating dates, real order count, checkout attempt/failure counts, duplicate purchases, overdue orders, stock/payment discrepancies, help outcomes, and actual-device feedback. The proposed evaluation window is seven operating days and at least thirty real orders; extend it if there is insufficient use. Review the rollout conditions in [the Phase 2 plan](phase-2-plan.md) before adding shops.
