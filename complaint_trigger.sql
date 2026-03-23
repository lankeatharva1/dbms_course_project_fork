DELIMITER //

CREATE TRIGGER chg_status
BEFORE UPDATE ON complaint
FOR EACH ROW
BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Only check if the new status is 'closed'
    IF NEW.complaint_status = 'closed' AND OLD.complaint_status = 'open' THEN
        SELECT COUNT(*) INTO v_count
        FROM item
        WHERE complaint_id = OLD.complaint_id
          AND status = 'lost';

        -- If there are lost items, throw an error
        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Cannot close complaint: there are still lost items linked to this complaint.';
        END IF;
        set NEW.complaint_closure_date = now();

    END IF;
END;
//

DELIMITER ;
