-- sql/schema.sql

-- 1. create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  product_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'shipped', 'delivered')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. function to notify on change, with operation + data
CREATE OR REPLACE FUNCTION notify_order_changes() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'data', row_to_json(OLD)
    );
    PERFORM pg_notify('order_changes', payload::text);
    RETURN OLD;
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'data', row_to_json(NEW)
    );
    PERFORM pg_notify('order_changes', payload::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. trigger on insert, update, delete
DROP TRIGGER IF EXISTS orders_notify_trigger ON orders;

CREATE TRIGGER orders_notify_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_order_changes();
