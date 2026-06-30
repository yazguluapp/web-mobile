-- E-commerce demo şeması (Turkcell GCP eğitim lab)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  city        TEXT        NOT NULL,
  country     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id        SERIAL PRIMARY KEY,
  name      TEXT          NOT NULL,
  category  TEXT          NOT NULL,
  price     NUMERIC(10,2) NOT NULL
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  customer_id   INT           NOT NULL REFERENCES customers(id),
  order_date    TIMESTAMPTZ   NOT NULL,
  status        TEXT          NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT           NOT NULL REFERENCES orders(id),
  product_id  INT           NOT NULL REFERENCES products(id),
  quantity    INT           NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date     ON orders(order_date);
CREATE INDEX idx_order_items_ord ON order_items(order_id);
