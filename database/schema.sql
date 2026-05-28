-- ============================================================
--  EcoServe – Waste Collection & Management System
--  Database Schema (MySQL)
-- ============================================================


USE railway;

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  NOT NULL UNIQUE,
  password     VARCHAR(255)  NOT NULL,
  phone        VARCHAR(20),
  role         ENUM('admin','citizen','collector') NOT NULL DEFAULT 'citizen',
  address      TEXT,
  ward_no      VARCHAR(20),
  zone         VARCHAR(50),
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── ZONES / WARDS ──────────────────────────────────────────
CREATE TABLE zones (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  zone_name    VARCHAR(100)  NOT NULL,
  ward_no      VARCHAR(20)   NOT NULL,
  city         VARCHAR(100),
  assigned_collector_id INT,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_collector_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── WASTE PICKUP REQUESTS ───────────────────────────────────
CREATE TABLE pickup_requests (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  citizen_id     INT           NOT NULL,
  waste_type     ENUM('general','recyclable','hazardous','organic','e-waste') NOT NULL,
  quantity_kg    DECIMAL(6,2),
  description    TEXT,
  address        TEXT          NOT NULL,
  ward_no        VARCHAR(20),
  zone           VARCHAR(50),
  preferred_date DATE          NOT NULL,
  preferred_time VARCHAR(30),
  status         ENUM('pending','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
  collector_id   INT,
  notes          TEXT,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── COLLECTION SCHEDULES ───────────────────────────────────
CREATE TABLE schedules (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  collector_id   INT           NOT NULL,
  zone           VARCHAR(50)   NOT NULL,
  ward_no        VARCHAR(20),
  scheduled_date DATE          NOT NULL,
  shift          ENUM('morning','afternoon','evening') DEFAULT 'morning',
  route_notes    TEXT,
  status         ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── COMPLAINTS ──────────────────────────────────────────────
CREATE TABLE complaints (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  citizen_id     INT           NOT NULL,
  subject        VARCHAR(200)  NOT NULL,
  description    TEXT          NOT NULL,
  complaint_type ENUM('missed_pickup','improper_disposal','collector_behavior','bin_damage','other') NOT NULL,
  ward_no        VARCHAR(20),
  status         ENUM('open','under_review','resolved','closed') DEFAULT 'open',
  priority       ENUM('low','medium','high') DEFAULT 'medium',
  admin_response TEXT,
  resolved_at    TIMESTAMP     NULL,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  message      TEXT          NOT NULL,
  type         ENUM('info','success','warning','alert') DEFAULT 'info',
  is_read      TINYINT(1)    DEFAULT 0,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── WASTE REPORTS ──────────────────────────────────────────
CREATE TABLE waste_reports (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  collector_id    INT           NOT NULL,
  request_id      INT,
  total_weight_kg DECIMAL(8,2)  NOT NULL,
  waste_type      ENUM('general','recyclable','hazardous','organic','e-waste') NOT NULL,
  disposal_site   VARCHAR(200),
  collection_date DATE          NOT NULL,
  remarks         TEXT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id)   REFERENCES pickup_requests(id) ON DELETE SET NULL
);

-- ─── SEED DATA ───────────────────────────────────────────────
-- Default admin / collector / citizen
-- Password for all accounts: password
INSERT INTO users (full_name, email, password, role, phone, ward_no, zone) VALUES
('EcoServe Admin', 'admin@ecoserve.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '9999999999', '01', 'Central'),
('Ravi Kumar', 'collector@ecoserve.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'collector', '9876543210', '02', 'North'),
('Priya Sharma', 'citizen@ecoserve.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', '9123456789', '02', 'North');

INSERT INTO zones (zone_name, ward_no, city, assigned_collector_id) VALUES
('Central Zone', '01', 'Jaipur', NULL),
('North Zone',   '02', 'Jaipur', 2),
('South Zone',   '03', 'Jaipur', NULL),
('East Zone',    '04', 'Jaipur', NULL);
