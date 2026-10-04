-- Read-only operations checks. Run through a privileged database connection.
begin read only;
select status, count(*) as orders_today, sum(total) as order_amount
from public.orders
where not is_legacy and operating_date = (now() at time zone 'Asia/Kolkata')::date
group by status order by status;

-- A small grace period covers the ten-second expiry schedule.
select id, vendor_id, pickup_number, expires_at
from public.orders
where not is_legacy and status = 'pending' and expires_at < now() - interval '30 seconds'
order by expires_at;

select status, vendor_id, count(*) as unresolved_requests, min(created_at) as oldest_request
from public.order_support where status <> 'resolved'
group by status, vendor_id order by oldest_request;

-- Expected: no rows. Constraints prevent most cases; this also checks lifecycle/payment consistency.
select id, vendor_id, status from public.orders
where not is_legacy and (
  total <> unit_price * quantity
  or (status = 'collected' and (payment_method is null or payment_confirmed_at is null or collected_at is null or cancellation_requested))
  or (status in ('cancelled','declined') and (stock_reserved or payment_confirmed_at is not null))
);

select vendor_id, operating_date, pickup_number, count(*) as duplicates
from public.orders where not is_legacy
group by vendor_id, operating_date, pickup_number having count(*) > 1;

select jobname, schedule, active from cron.job where jobname = 'expire-pickup-orders';
select status, start_time, end_time
from cron.job_run_details where jobid in (select jobid from cron.job where jobname = 'expire-pickup-orders')
order by start_time desc limit 5;
commit;
