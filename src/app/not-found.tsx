import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default function NotFound() {
  // Get the current URL path
  const headersList = headers();
  const url = headersList.get('x-url') || '';
  
  // Check if the current path is in the admin section
  if (url.includes('/admin')) {
    // Redirect to the admin dashboard instead of the store
    redirect('/admin');
  } else {
    // For non-admin routes, redirect to the store as before
    redirect('/store');
  }
} 