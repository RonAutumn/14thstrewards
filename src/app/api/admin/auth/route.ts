import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Database } from "@/types/supabase";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });
    
    const { email, password } = await request.json();

    // First, attempt to sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      console.error("No user or session returned");
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      // Sign out the user if there's an error checking admin status
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Error verifying admin status" }, { status: 500 });
    }

    if (!profile?.is_admin) {
      console.log("User is not an admin:", authData.user.email);
      // Sign out the user if they're not an admin
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    // Set admin session data
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        is_admin: true,
        admin_session: true,
        admin_login_time: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
    }

    // Create a response with session cookie
    const response = NextResponse.json({ 
      user: authData.user,
      message: "Admin authentication successful",
      session: authData.session
    });

    // Set a cookie to indicate admin status
    response.cookies.set('admin_authenticated', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle admin logout
export async function DELETE() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ 
    cookies: () => cookieStore 
  });
  
  await supabase.auth.signOut();
  
  const response = NextResponse.json({ message: "Logged out successfully" });
  
  // Clear admin cookie
  response.cookies.set('admin_authenticated', '', {
    path: '/',
    expires: new Date(0)
  });
  
  return response;
} 