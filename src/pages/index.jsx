import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("activeUser") || "null");
    if (user?.admin) {
      // Admin dashboard route is `/dashboard_admin`
      router.push('/dashboard_admin');
    } else if (user?.id) {
      router.push('/profile');
    } else {
      router.push('/signin');
    }
  }, [router]);

  return null; // or a loading spinner
}