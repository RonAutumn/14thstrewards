# Order Confirmation Process Improvements

## Overview

We are transitioning from a sistersite-based order confirmation process to an improved, real-time system using Supabase. This new process leverages Supabase's realtime subscriptions, edge functions, and database triggers to deliver an instant and robust order status update experience.

## Objectives

- **Realtime Subscriptions:** Provide immediate UI feedback when order statuses update.
- **Edge Functions:** Use Supabase Edge Functions as webhook endpoints to update order records upon payment confirmation.
- **Database Triggers:** Automatically update audit fields (e.g., `updated_at`) and enforce business rules.
- **Direct Payment Integration:** Where possible, reduce dependency on sistersite by integrating directly with the payment provider.

## Tasks

### 1. Implement Realtime Subscriptions

- [ ] **Create a React Hook (e.g., `useOrderStatus`):**
  - Develop a hook that subscribes to real-time changes on the `orders` table based on `orderId`.
  - Verify that on each update, the UI reflects the current order status immediately.
- [ ] **Integrate the Hook in the Order Confirmation Page:**
  - Update the order confirmation page to use the `useOrderStatus` hook.
  - Ensure that the page reacts instantly to status changes.

### 2. Deploy Supabase Edge Function

- [ ] **Develop the Edge Function:**
  - Create an Edge Function that handles incoming webhook events (e.g., payment notifications) from the payment provider.
  - The function should update the corresponding order record in Supabase with the new status.
- [ ] **Secure and Deploy:**
  - Add security measures (API keys or signature verification) to protect the endpoint.
  - Deploy the function on Supabase and update sistersite (or the payment provider) to point to this new endpoint.
- [ ] **Test the Edge Function:**
  - Simulate payment confirmation events to ensure the order status is updated correctly.

### 3. Enhance Database Triggers

- [ ] **Create a Trigger Function:**
  - Write a PostgreSQL function to automatically update the `updated_at` field on any changes made to the orders table.
- [ ] **Attach the Trigger:**
  - Create a trigger on the `orders` table that calls the trigger function on each update.
- [ ] **Test Trigger Functionality:**
  - Verify that any update to an order record automatically refreshes its `updated_at` field.

### 4. Integrate Direct Payment Provider Callbacks

- [ ] **Review Payment Provider Webhooks:**
  - Evaluate options for integrating directly with the payment provider to receive real-time payment status callbacks.
- [ ] **Implement Integration:**
  - Replace or supplement sistersite callbacks with direct payment provider webhooks that route to your Supabase Edge Function.
- [ ] **Test the End-to-End Flow:**
  - Ensure that direct webhook calls properly update the order status in Supabase.

### 5. Documentation and Quality Assurance

- [ ] **Update Documentation:**
  - Document all new processes, endpoints, and integrations in the internal documentation.
- [ ] **Conduct End-to-End Testing:**
  - Run comprehensive tests covering all order types (pickup, delivery, shipping) and payment methods.
- [ ] **Collect Feedback and Iterate:**
  - Gather feedback from stakeholders and users.
  - Address any discovered issues or edge cases to refine the process.

## Additional Considerations

- **Error Handling:**  
  Implement robust error handling and logging within both the Edge Functions and realtime subscription hooks.
- **Backward Compatibility:**  
  Maintain compatibility with legacy systems during the transition.
- **Monitoring and Alerts:**  
  Set up monitoring on the Edge Function logs and realtime subscription events to quickly detect and respond to issues.
