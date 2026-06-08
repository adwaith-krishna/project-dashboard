import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("dashboard-session")?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie));
    if (session.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/portal/dashboard");
    }
  } catch (e) {
    console.error("Failed to parse session cookie on landing page:", e);
    redirect("/login");
  }

  return null;
}
