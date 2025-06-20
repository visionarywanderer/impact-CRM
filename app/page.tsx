"use client"

import { useAuth, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { FileText, TrendingUp, Users, BarChart3 } from "lucide-react"

export default function HomePage() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard")
    }
  }, [isLoaded, userId, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <SignedIn>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-center min-h-screen py-12">
              <div className="text-center">
                <div className="flex justify-center mb-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-gray-900">Impact CRM</span>
                  </div>
                </div>

                <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                  ESG Management
                  <span className="text-blue-600"> Simplified</span>
                </h1>

                <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                  Comprehensive sustainability and ESG management platform. Track clients, manage projects, and monitor
                  key performance indicators all in one place.
                </p>

                <div className="mt-10">
                  <RedirectToSignIn>
                    <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                      Get Started
                    </button>
                  </RedirectToSignIn>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Client Management</h3>
                    <p className="mt-2 text-gray-600">Track ESG risk levels and manage your client portfolio</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Project Tracking</h3>
                    <p className="mt-2 text-gray-600">Monitor sustainability initiatives and their progress</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">KPI Analytics</h3>
                    <p className="mt-2 text-gray-600">Visualize performance metrics with interactive charts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  )
}
