# User Information Gathering & Rewards System

## Objective

Implement a progressive user information gathering system that incentivizes users to complete their profiles by offering reward points. This approach will improve user engagement while collecting valuable customer data gradually.

## Tasks

### 1. Database Updates ✅

- [x] Add necessary columns to profiles table:
  - `phone_number` (TEXT)
  - `birth_date` (DATE)
  - `address` (JSONB)
  - `preferences` (JSONB)
  - `info_points_claimed` (JSONB) to track which info rewards have been claimed
- [x] Add referral system tables and functions:
  - [x] referrals table
  - [x] complete_referral stored procedure
  - [x] referral processing middleware

### 2. Profile Completion Rewards System 🔴

- [ ] Define point rewards for each information type:
  - Phone Number Verification: 500 points
  - Birthday Addition: 500 points
  - Address Information: 750 points
  - Shopping Preferences: 250 points
  - Email Newsletter Signup: 250 points
  - Profile Picture Upload: 250 points
  - Total Possible: 2,500 points

### 3. Progressive UI Implementation 🔴

- [ ] Create InfoRewards component:
  - Progress bar showing total profile completion
  - Cards for each information type showing:
    - Points available
    - Input form
    - Verification status
  - Success animations for points earned
- [ ] Add InfoRewards section to user profile page
- [ ] Implement mobile-responsive design

### 4. Information Collection Features 🟡

- [ ] Phone number verification:
  - SMS verification system
  - International phone number support
  - Rate limiting for verification attempts
- [ ] Address validation:
  - Integration with address validation service
  - Support for multiple addresses (shipping/billing)
  - Geocoding for delivery radius checks
- [ ] Shopping preferences:
  - Product category preferences
  - Communication preferences
  - Shopping frequency
  - Preferred shopping times

### 5. Points System Integration ✅

- [x] Create API endpoints:
  - [x] POST /api/referrals/complete
  - [ ] POST /api/profile/update-info
  - [ ] POST /api/profile/verify-phone
  - [ ] POST /api/profile/claim-points
- [x] Implement points awarding logic:
  - [x] Verify information validity
  - [x] Check if points were already claimed
  - [x] Award points atomically
  - [x] Update profile completion status

### 6. Notification System 🟡

- [ ] Email notifications:
  - Welcome series with profile completion prompts
  - Points earned confirmations
  - Profile completion reminders
- [ ] In-app notifications:
  - Real-time points updates
  - Profile completion prompts
  - Verification status updates

### 7. Admin Features ⚪

- [ ] Add to admin dashboard:
  - Profile completion statistics
  - Points awarded tracking
  - Information verification status
  - Data quality metrics
- [ ] Manual override capabilities:
  - Reset verification status
  - Adjust awarded points
  - Update user information

### 8. Testing & Validation ⚪

- [ ] Unit tests:
  - Points calculation
  - Information validation
  - API endpoints
- [ ] Integration tests:
  - Complete user flows
  - Edge cases
  - Rate limiting
- [ ] User acceptance testing:
  - Mobile responsiveness
  - Accessibility
  - User experience

## Next Steps

1. Implement the InfoRewards component for progressive profile completion
2. Set up phone number verification system
3. Create address validation integration
4. Implement shopping preferences collection UI

## Implementation Notes

### Points Awarding Rules

1. Points are awarded only once per information type
2. Information must be verified when applicable (phone, email)
3. Points are awarded immediately after successful verification
4. Users can update information without losing points
5. Admin can revoke points if information is found to be invalid

### Security Considerations

1. Rate limit verification attempts
2. Validate all user inputs
3. Encrypt sensitive information
4. Implement fraud detection for points system
5. Regular security audits

### User Experience Guidelines

1. Clear indication of available points
2. Simple, step-by-step information collection
3. Immediate feedback on submission
4. Easy access to support
5. Clear privacy policy and data usage information

## Color Legend

- ✅ Completed
- 🔴 High Priority
- 🟡 Medium Priority
- ⚪ Testing/QA
