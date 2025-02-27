-- Create function to complete referral and award points
CREATE OR REPLACE FUNCTION complete_referral(
  referral_id UUID,
  referrer_points INTEGER,
  referred_points INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get referral record and lock it
  SELECT * INTO v_referral
  FROM referrals
  WHERE id = referral_id
  AND status = 'pending'
  AND points_awarded = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already processed referral';
  END IF;

  -- Update referral status
  UPDATE referrals
  SET 
    status = 'completed',
    points_awarded = true,
    completed_at = NOW()
  WHERE id = referral_id;

  -- Award points to referrer
  INSERT INTO transactions (
    user_id,
    description,
    points,
    type
  ) VALUES (
    v_referral.referrer_id,
    'Referral Reward - Successful Referral',
    referrer_points,
    'EARN'
  );

  -- Update referrer's points
  UPDATE profiles
  SET points = COALESCE(points, 0) + referrer_points
  WHERE id = v_referral.referrer_id;

  -- Award points to referred user
  INSERT INTO transactions (
    user_id,
    description,
    points,
    type
  ) VALUES (
    v_referral.referred_id,
    'Referral Reward - Welcome Bonus',
    referred_points,
    'EARN'
  );

  -- Update referred user's points
  UPDATE profiles
  SET points = COALESCE(points, 0) + referred_points
  WHERE id = v_referral.referred_id;

  -- Prepare result
  v_result = jsonb_build_object(
    'referral_id', referral_id,
    'referrer_points_awarded', referrer_points,
    'referred_points_awarded', referred_points,
    'completed_at', NOW()
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Roll back any changes if there's an error
    RAISE;
END;
$$; 