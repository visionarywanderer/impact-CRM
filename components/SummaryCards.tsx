"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { clientsApi, projectsApi, kpisApi } from "@/lib/supabase"
import { BarChart3, Building2, Users } from "lucide-react"

interface SummaryData {
  totalClients: number
  activeProjects: number
  totalKPIs: number
}

export default function SummaryCards() {
  const { userId } = useAuth()
  const [data, setData] = useState<SummaryData>({
    totalClients: 0,
    activeProjects: 0,
    totalKPIs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummaryData() {
      if (!userId) return

      try {
        const [clients, projects, kpis] = await Promise.all([
          clientsApi.getAll(userId),
          projectsApi.getAll(userId),
          kpisApi.getAll(userId),
        ])

        setData({
          totalClients: clients.length,
          activeProjects: projects.filter((p) => p.status === "In Progress").length,
          totalKPIs: kpis.length,
        })
      } catch (error) {
        console.error("Error fetching summary data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryData()
  }, [userId])

  const cards = [
    {
      title: "Total Clients",
      value: data.totalClients,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Projects",
      value: data.activeProjects,
      icon: Building2,
      color: "bg-green-500",
    },
    {
      title: "Total KPIs",
      value: data.totalKPIs,
      icon: BarChart3,
      color: "bg-purple-500",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${card.color}`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
