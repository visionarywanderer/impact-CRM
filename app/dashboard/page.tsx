"use client"

import { useUser } from "@clerk/nextjs"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import SummaryCards from "@/components/SummaryCards"
import { exportPDF } from "@/lib/utils"
import { Download, FileText, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user } = useUser()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName || "User"}!</h1>
              <p className="mt-2 text-gray-600">Here's an overview of your ESG management dashboard.</p>
            </div>

            <SummaryCards />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/clients"
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-blue-900 font-medium">Manage Clients</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-green-900 font-medium">Track Projects</span>
                  </Link>
                  <button
                    onClick={exportPDF}
                    className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors w-full text-left"
                  >
                    <Download className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-purple-900 font-medium">Export Dashboard to PDF</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span>New client added to portfolio</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span>Project milestone completed</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    <span>KPI data updated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
