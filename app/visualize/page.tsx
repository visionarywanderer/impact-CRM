"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import { kpisApi, projectsApi, clientsApi, type KPI, type Project, type Client } from "@/lib/supabase"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { BarChart3, TrendingUp, Filter } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function Visualize() {
  const { userId } = useAuth()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    client: "",
    project: "",
    metric: "",
    dateFrom: "",
    dateTo: "",
    chartType: "line" as "line" | "bar",
  })

  useEffect(() => {
    fetchData()
  }, [userId])

  async function fetchData() {
    if (!userId) return

    try {
      const [kpisData, projectsData, clientsData] = await Promise.all([
        kpisApi.getAll(userId),
        projectsApi.getAll(userId),
        clientsApi.getAll(userId),
      ])
      setKpis(kpisData)
      setProjects(projectsData)
      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  function getFilteredKPIs() {
    let filtered = [...kpis]

    if (filters.client) {
      const clientProjects = projects.filter((p) => p.client_id === filters.client).map((p) => p.id)
      filtered = filtered.filter((kpi) => clientProjects.includes(kpi.project_id))
    }

    if (filters.project) {
      filtered = filtered.filter((kpi) => kpi.project_id === filters.project)
    }

    if (filters.metric) {
      filtered = filtered.filter((kpi) => kpi.metric_name.toLowerCase().includes(filters.metric.toLowerCase()))
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((kpi) => kpi.date >= filters.dateFrom)
    }

    if (filters.dateTo) {
      filtered = filtered.filter((kpi) => kpi.date <= filters.dateTo)
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  function getChartData() {
    const filteredKPIs = getFilteredKPIs()

    if (filteredKPIs.length === 0) {
      return {
        labels: [],
        datasets: [],
      }
    }

    // Group by metric name
    const groupedByMetric = filteredKPIs.reduce(
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
      }
    })

    // Get unique dates for labels
    const uniqueDates = [...new Set(filteredKPIs.map((kpi) => kpi.date))].sort()

    return {
      labels: uniqueDates,
      datasets,
    }
  }

  function getMetricSummary() {
    const filteredKPIs = getFilteredKPIs()

    const summary = filteredKPIs.reduce(
      (acc, kpi) => {
        if (!acc[kpi.metric_name]) {
          acc[kpi.metric_name] = {
            count: 0,
            total: 0,
            latest: 0,
            unit: kpi.unit,
          }
        }
        acc[kpi.metric_name].count++
        acc[kpi.metric_name].total += kpi.value
        acc[kpi.metric_name].latest = kpi.value
        return acc
      },
      {} as Record<string, { count: number; total: number; latest: number; unit: string }>,
    )

    return Object.entries(summary).map(([metric, data]) => ({
      metric,
      count: data.count,
      average: data.total / data.count,
      latest: data.latest,
      unit: data.unit,
    }))
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "KPI Trends Over Time",
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">KPI Visualization</h1>
              <p className="mt-2 text-gray-600">Visualize your key performance indicators with interactive charts</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Filters & Chart Options</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    value={filters.client}
                    onChange={(e) => setFilters({ ...filters, client: e.target.value, project: "" })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Clients</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Projects</option>
                    {projects
                      .filter((p) => !filters.client || p.client_id === filters.client)
                      .map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={filters.metric}
                    onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                  <select
                    value={filters.chartType}
                    onChange={(e) => setFilters({ ...filters, chartType: e.target.value as "line" | "bar" })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {getMetricSummary()
                .slice(0, 4)
                .map((summary) => (
                  <div key={summary.metric} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 truncate">{summary.metric}</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {summary.latest.toLocaleString()} {summary.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Avg: {summary.average.toFixed(1)} {summary.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">KPI Trends</h3>
                </div>
                <div className="text-sm text-gray-500">{getFilteredKPIs().length} data points</div>
              </div>

              {getFilteredKPIs().length > 0 ? (
                <div className="h-96">
                  {filters.chartType === "line" ? (
                    <Line data={getChartData()} options={chartOptions} />
                  ) : (
                    <Bar data={getChartData()} options={chartOptions} />
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No data available for the selected filters</p>
                    <p className="text-sm">Try adjusting your filter criteria</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
