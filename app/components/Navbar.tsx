"use client";  // Ensure this is a Client Component

import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname(); // Alternative to useRouter()

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-lg font-bold">AutoPoint</h1>
        <p className="text-gray-400">Current Page: {pathname}</p>
      </div>
    </nav>
  );
};

export default Navbar;