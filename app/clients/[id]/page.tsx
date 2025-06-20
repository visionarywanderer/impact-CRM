"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useParams, useRouter } from "next/navigation"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import { clientsApi, projectsApi, kpisApi, type Client, type Project, type KPI } from "@/lib/supabase"
import { getRiskColor, getStatusColor, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
} from "lucide-react"
import Link from "next/link"

import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function ClientDetailsPage() {
  const { userId } = useAuth()
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectKpis, setProjectKpis] = useState<Record<string, KPI[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<"3months" | "1year" | "3years">("1year")

  useEffect(() => {
    if (userId && clientId) {
      fetchClientData()
    }
  }, [userId, clientId])

  async function fetchClientData() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch all clients to find the specific one
      const allClients = await clientsApi.getAll(userId)
      const foundClient = allClients.find((c) => c.id === clientId)

      if (!foundClient) {
        setError("Client not found")
        return
      }

      setClient(foundClient)

      // Fetch projects for this client
      const allProjects = await projectsApi.getAll(userId)
      const clientProjects = allProjects.filter((p) => p.client_id === clientId)
      setProjects(clientProjects)

      // Fetch KPIs for each project
      const allKpis = await kpisApi.getAll(userId)
      const kpisByProject: Record<string, KPI[]> = {}

      clientProjects.forEach((project) => {
        kpisByProject[project.id] = allKpis.filter((kpi) => kpi.project_id === project.id)
      })

      setProjectKpis(kpisByProject)
    } catch (error) {
      console.error("Error fetching client data:", error)
      setError("Failed to load client data")
    } finally {
      setLoading(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "in progress":
        return <Clock className="w-5 h-5 text-blue-600" />
      case "planning":
        return <TrendingUp className="w-5 h-5 text-yellow-600" />
      case "on hold":
        return <Pause className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  function getRiskIcon(risk: string) {
    switch (risk.toLowerCase()) {
      case "low":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "medium":
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case "high":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />
    }
  }

  function getFilteredKPIsForChart() {
    const allKpis = Object.values(projectKpis).flat()
    const now = new Date()
    let startDate: Date

    switch (timePeriod) {
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "1year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      case "3years":
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
        break
    }

    return allKpis
      .filter((kpi) => new Date(kpi.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  function getChartData() {
    const filteredKpis = getFilteredKPIsForChart()

    if (filteredKpis.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Group by metric name
    const groupedByMetric = filteredKpis.reduce(
      (acc, kpi) => {
        if (!acc[kpi.metric_name]) {
          acc[kpi.metric_name] = []
        }
        acc[kpi.metric_name].push(kpi)
        return acc
      },
      {} as Record<string, KPI[]>,
    )

    const colors = [
      "rgb(59, 130, 246)", // blue
      "rgb(16, 185, 129)", // green
      "rgb(245, 158, 11)", // yellow
      "rgb(239, 68, 68)", // red
      "rgb(139, 92, 246)", // purple
      "rgb(236, 72, 153)", // pink
    ]

    const datasets = Object.entries(groupedByMetric).map(([metricName, kpiData], index) => {
      const color = colors[index % colors.length]

      return {
        label: metricName,
        data: kpiData.map((kpi) => ({
          x: kpi.date,
          y: kpi.value,
        })),
        borderColor: color,
        backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.1)"),
        tension: 0.1,
        fill: false,
      }
    })

    // Get unique dates for labels
    const uniqueDates = [...new Set(filteredKpis.map((kpi) => kpi.date))].sort()

    return {
      labels: uniqueDates,
      datasets,
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Impact Trends Over Time - ${client.name}`,
      },
    },
    scales: {
      x: {
        type: "category" as const,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        title: {
          display: true,
          text: "Value",
        },
      },
    },
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !client) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || "Client not found"}</h1>
                <p className="text-gray-600 mb-6">
                  The client you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Link
                  href="/clients"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Clients
                </Link>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header with Back Button */}
            <div className="mb-8">
              <Link
                href="/clients"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </Link>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                  <p className="mt-2 text-gray-600">Client Details & Project Overview</p>
                </div>
              </div>
            </div>

            {/* Client Information Card */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company Name</p>
                      <p className="text-lg font-semibold text-gray-900">{client.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Industry</p>
                      <p className="text-lg font-semibold text-gray-900">{client.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {getRiskIcon(client.esg_risk_level)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">ESG Risk Level</p>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(client.esg_risk_level)}`}
                      >
                        {client.esg_risk_level}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Mail className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact Email</p>
                      <a
                        href={`mailto:${client.email}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact Chart Section */}
            {Object.values(projectKpis).flat().length > 0 && (
              <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Impact Over Time</h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setTimePeriod("3months")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          timePeriod === "3months"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        3 Months
                      </button>
                      <button
                        onClick={() => setTimePeriod("1year")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          timePeriod === "1year"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        1 Year
                      </button>
                      <button
                        onClick={() => setTimePeriod("3years")}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          timePeriod === "3years"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        3 Years
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {getFilteredKPIsForChart().length > 0 ? (
                    <div className="h-96">
                      <Line data={getChartData()} options={chartOptions} />
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No data available for the selected time period</p>
                        <p className="text-sm">Try selecting a different time range</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Projects Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Related Projects</h2>
                  <span className="text-sm text-gray-500">
                    {projects.length} project{projects.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-6">This client doesn't have any projects assigned yet.</p>
                  <Link
                    href="/projects"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Project
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {projects.map((project) => {
                    const kpis = projectKpis[project.id] || []
                    const kpiCount = kpis.length

                    return (
                      <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              {getStatusIcon(project.status)}
                              <h3 className="text-lg font-semibold text-gray-900 ml-3">{project.name}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}
                                >
                                  {project.status}
                                </span>
                              </div>

                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Deadline</p>
                                  <p className="text-sm text-gray-900">{formatDate(project.deadline)}</p>
                                </div>
                              </div>

                              <div className="flex items-center">
                                <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">KPIs Tracked</p>
                                  <p className="text-sm text-gray-900">
                                    {kpiCount} metric{kpiCount !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {project.description && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                                <p className="text-sm text-gray-700">{project.description}</p>
                              </div>
                            )}

                            {/* KPI Summary */}
                            {kpiCount > 0 && (
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent KPIs</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {kpis.slice(0, 3).map((kpi) => (
                                    <div key={kpi.id} className="bg-white rounded p-3 border">
                                      <p className="text-xs font-medium text-gray-500 truncate">{kpi.metric_name}</p>
                                      <p className="text-lg font-semibold text-blue-600">
                                        {kpi.value.toLocaleString()} {kpi.unit}
                                      </p>
                                      <p className="text-xs text-gray-500">{formatDate(kpi.date)}</p>
                                    </div>
                                  ))}
                                </div>
                                {kpiCount > 3 && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    +{kpiCount - 3} more metric{kpiCount - 3 !== 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-6 flex flex-col space-y-2">
                            <Link
                              href={`/projects/${project.id}`}
                              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Building2 className="w-4 h-4 mr-2" />
                              View Project
                            </Link>

                            <Link
                              href={`/kpis?project=${project.id}`}
                              className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              View KPIs
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary Stats */}
            {projects.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Projects</p>
                      <p className="text-2xl font-semibold text-gray-900">{projects.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {projects.filter((p) => p.status === "Completed").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {projects.filter((p) => p.status === "In Progress").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total KPIs</p>
                      <p className="text-2xl font-semibold text-gray-900">{Object.values(projectKpis).flat().length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
