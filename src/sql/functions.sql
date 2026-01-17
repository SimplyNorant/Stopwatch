CREATE OR REPLACE FUNCTION swap_task_positions(
  task_id_1 UUID,
  task_id_2 UUID
) RETURNS JSON AS $$
DECLARE
  pos1 INT;
  pos2 INT;
BEGIN
  -- Get positions with locking to prevent race conditions
  SELECT position INTO pos1 FROM tasks WHERE id = task_id_1 FOR UPDATE;
  SELECT position INTO pos2 FROM tasks WHERE id = task_id_2 FOR UPDATE;
  
  -- Swap positions
  UPDATE tasks SET position = pos2 WHERE id = task_id_1;
  UPDATE tasks SET position = pos1 WHERE id = task_id_2;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;