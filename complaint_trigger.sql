DELIMITER //

CREATE TRIGGER chg_status
BEFORE UPDATE ON complaint
FOR EACH ROW
BEGIN
    DECLARE v_count INT DEFAULT 0;

    IF NEW.complaint_status = 'closed' AND OLD.complaint_status = 'open' THEN
        
        SELECT COUNT(*) INTO v_count
        FROM item
        WHERE complaint_id = OLD.complaint_id
        AND status = 'lost';

        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot close complaint: items are still lost.';
        END IF;

        SET NEW.complaint_closure_date = NOW();
    END IF;

END//

DELIMITER ;