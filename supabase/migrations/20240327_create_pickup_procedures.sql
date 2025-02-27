-- Function to create a pickup assignment and update slot count
CREATE OR REPLACE FUNCTION create_pickup_assignment(
    p_slot_id UUID,
    p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Create the assignment
        INSERT INTO pickup_slot_assignments (
            slot_id,
            order_id,
            status
        ) VALUES (
            p_slot_id,
            p_order_id,
            'scheduled'
        ) RETURNING jsonb_build_object(
            'id', id,
            'slot_id', slot_id,
            'order_id', order_id,
            'status', status,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;

        -- Update the slot's current_orders count
        UPDATE pickup_slots
        SET current_orders = current_orders + 1,
            is_available = CASE 
                WHEN current_orders + 1 >= max_orders THEN false 
                ELSE true 
            END,
            updated_at = NOW()
        WHERE id = p_slot_id;

        RETURN v_result;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback happens automatically
        RAISE EXCEPTION 'Failed to create pickup assignment: %', SQLERRM;
    END;
END;
$$;

-- Function to update a pickup assignment status
CREATE OR REPLACE FUNCTION update_pickup_assignment(
    p_assignment_id UUID,
    p_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_old_status TEXT;
    v_slot_id UUID;
BEGIN
    -- Start transaction
    BEGIN
        -- Get current status and slot_id
        SELECT status, slot_id
        INTO v_old_status, v_slot_id
        FROM pickup_slot_assignments
        WHERE id = p_assignment_id;

        -- Update the assignment
        UPDATE pickup_slot_assignments
        SET status = p_status,
            updated_at = NOW()
        WHERE id = p_assignment_id
        RETURNING jsonb_build_object(
            'id', id,
            'slot_id', slot_id,
            'order_id', order_id,
            'status', status,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;

        -- If status changed from 'scheduled' to 'cancelled', decrease slot count
        IF v_old_status = 'scheduled' AND p_status = 'cancelled' THEN
            UPDATE pickup_slots
            SET current_orders = current_orders - 1,
                is_available = true,
                updated_at = NOW()
            WHERE id = v_slot_id;
        END IF;

        RETURN v_result;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback happens automatically
        RAISE EXCEPTION 'Failed to update pickup assignment: %', SQLERRM;
    END;
END;
$$;

-- Function to delete a pickup assignment
CREATE OR REPLACE FUNCTION delete_pickup_assignment(
    p_assignment_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot_id UUID;
    v_status TEXT;
BEGIN
    -- Start transaction
    BEGIN
        -- Get slot_id and status
        SELECT slot_id, status
        INTO v_slot_id, v_status
        FROM pickup_slot_assignments
        WHERE id = p_assignment_id;

        -- Delete the assignment
        DELETE FROM pickup_slot_assignments
        WHERE id = p_assignment_id;

        -- If status was 'scheduled', decrease slot count
        IF v_status = 'scheduled' THEN
            UPDATE pickup_slots
            SET current_orders = current_orders - 1,
                is_available = true,
                updated_at = NOW()
            WHERE id = v_slot_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback happens automatically
        RAISE EXCEPTION 'Failed to delete pickup assignment: %', SQLERRM;
    END;
END;
$$; 