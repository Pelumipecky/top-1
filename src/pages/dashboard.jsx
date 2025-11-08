import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the admin dashboard route
    router.replace('/dashboard_admin');
  }, [router]);

  return (
    <div style={{padding:20}}>
  <h2>Redirecting to dashboard…</h2>
  <p>If you are not redirected automatically, <Link href="/dashboard_admin">click here</Link>.</p>
    </div>
  );
}
