-- ══════════════════════════════════════════════════════════
-- Dormn WhatsApp Automation — Database Migration
-- Run this SQL against your dormncom_dormn_db database
-- ══════════════════════════════════════════════════════════

-- 1. WhatsApp Message Logs (Deduplication + Audit Trail)
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL COMMENT 'booking_new, booking_status, payment_received, maintenance_request, kyc_submitted',
  event_ref_id VARCHAR(100) NOT NULL COMMENT 'Unique reference: booking_id, request_id, etc.',
  recipient_phone VARCHAR(20) NOT NULL COMMENT 'Phone number in 91XXXXXXXXXX format',
  message_status ENUM('sent', 'failed', 'queued') DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event (event_type, event_ref_id, recipient_phone),
  INDEX idx_sent_at (sent_at),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Maintenance Requests Table (Currently localStorage-only, now persisted in DB)
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pg_id INT NOT NULL,
  student_id INT NOT NULL,
  category VARCHAR(100) DEFAULT 'General' COMMENT 'Electrical, Plumbing, Furniture, Internet, Cleaning, etc.',
  location VARCHAR(200) DEFAULT NULL COMMENT 'My Room, Common Area, Bathroom, Kitchen, etc.',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('Low', 'Normal', 'Urgent', 'Emergency') DEFAULT 'Normal',
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  resolution_note TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pg_id) REFERENCES pgs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pg_status (pg_id, status),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
