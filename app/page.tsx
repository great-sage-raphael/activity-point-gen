"use client"; // Required for client-side components

import Image from "next/image";
import Link from "next/link";
import { Activity, Upload, Shield, LayoutDashboard, ArrowRight } from "lucide-react";
import { JSX } from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FFE6E6]">
      {/* Header */}
      <header className="bg-[#7469B6] text-white">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <span className="text-xl font-bold">AutoPoint</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#" className="hover:text-[#E1AFD1] transition-colors">Home</Link>
            <Link href="#" className="hover:text-[#E1AFD1] transition-colors">About</Link>
            {/* <Link href="/login" className="hover:text-[#E1AFD1] transition-colors">Login</Link> */}
            <Link href="/login" className="bg-[#AD88C6] px-4 py-2 rounded-lg hover:bg-[#E1AFD1] transition-colors">
              Register / login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-5xl font-bold text-[#7469B6] mb-6">
              Seamlessly Manage Activity Points !
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Transform your academic journey with our intelligent activity points management system. 
              Upload, track, and verify your achievements with ease.
            </p>
            <Link href={`/login`}>
            <button className="bg-[#7469B6] text-white px-8 py-3 rounded-lg flex items-center space-x-2 hover:bg-[#AD88C6] transition-colors">
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            </Link>
          </div>
          <div className="md:w-1/2">
            <Image 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Students collaborating"
              width={800}
              height={500}
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#7469B6] mb-16">
            Why Choose AutoPoint?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Upload className="h-12 w-12 text-[#7469B6] mb-6" />}
              title="Easy Certificate Upload"
              description="Seamlessly upload and organize your certificates and achievements in one secure place."
            />
            <FeatureCard 
              icon={<Shield className="h-12 w-12 text-[#7469B6] mb-6" />}
              title="Automated Verification"
              description="Advanced ML algorithms ensure quick and accurate verification of your certificates."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="h-12 w-12 text-[#7469B6] mb-6" />}
              title="Role-based Dashboards"
              description="Customized dashboards for students, faculty, and administrators for efficient management."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#7469B6] text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Activity className="h-6 w-6" />
              <span className="text-xl font-bold">AutoPoint</span>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="hover:text-[#E1AFD1] transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#E1AFD1] transition-colors">Contact Us</Link>
              <Link href="#" className="hover:text-[#E1AFD1] transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            © {new Date().getFullYear()} AutoPoint. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) => {
  return (
    <div className="bg-[#FFE6E6] p-8 rounded-xl shadow-lg hover:transform hover:-translate-y-2 transition-all">
      {icon}
      <h3 className="text-xl font-semibold text-[#7469B6] mb-4">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};