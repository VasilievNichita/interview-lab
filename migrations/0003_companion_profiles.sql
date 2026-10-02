ALTER TABLE users ADD COLUMN race TEXT NOT NULL DEFAULT 'human' CHECK (race IN ('human','elf','orc','dwarf'));
CREATE INDEX users_transfer_key ON users(recovery_hash);
