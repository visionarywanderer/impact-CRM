"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useParams, useRouter } from "next/navigation"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import { projectsApi, kpisApi, type Project, type KPI } from "@/lib/supabase"
import { getStatusColor, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  Building2,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  FileText,
  Plus,
  Edit,
  Trash2,
} from "lucide-react"
import Link from "next/link"

export default function ProjectDetailsPage() {
  const { userId } = useAuth()
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showKpiModal, setShowKpiModal] = useState(false)
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null)
  const [kpiFormData, setKpiFormData] = useState({
    metric_name: "",
    value: "",
    unit: "",
    date: "",
  })

  useEffect(() => {
    if (userId && projectId) {
      fetchProjectData()
    }
  }, [userId, projectId])

  async function fetchProjectData() {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch all projects to find the specific one
      const allProjects = await projectsApi.getAll(userId)
      const foundProject = allProjects.find((p) => p.id === projectId)

      if (!foundProject) {
        setError("Project not found")
        return
      }

      setProject(foundProject)

      // Fetch KPIs for this project
      const allKpis = await kpisApi.getAll(userId)
      const projectKpis = allKpis.filter((kpi) => kpi.project_id === projectId)
      setKpis(projectKpis)
    } catch (error) {
      console.error("Error fetching project data:", error)
      setError("Failed to load project data")
    } finally {
      setLoading(false)
    }
  }

  async function handleKpiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !project) return

    try {
      const kpiData = {
        ...kpiFormData,
        value: Number.parseFloat(kpiFormData.value),
        project_id: projectId,
        user_id: userId,
      }

      if (editingKpi) {
        await kpisApi.update(editingKpi.id, kpiData)
      } else {
        await kpisApi.create(kpiData)
      }

      await fetchProjectData()
      setShowKpiModal(false)
      setEditingKpi(null)
      setKpiFormData({ metric_name: "", value: "", unit: "", date: "" })
    } catch (error) {
      console.error("Error saving KPI:", error)
    }
  }

  async function handleDeleteKpi(id: string) {
    if (!confirm("Are you sure you want to delete this KPI?")) return

    try {
      await kpisApi.delete(id)
      await fetchProjectData()
    } catch (error) {
      console.error("Error deleting KPI:", error)
    }
  }

  function openEditKpiModal(kpi: KPI) {
    setEditingKpi(kpi)
    setKpiFormData({
      metric_name: kpi.metric_name,
      value: kpi.value.toString(),
      unit: kpi.unit,
      date: kpi.date,
    })
    setShowKpiModal(true)
  }

  function getStatusIcon(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "in progress":
        return <Clock className="w-6 h-6 text-blue-600" />
      case "planning":
        return <TrendingUp className="w-6 h-6 text-yellow-600" />
      case "on hold":
        return <Pause className="w-6 h-6 text-red-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />
    }
  }

  function getKpiSummary() {
    if (kpis.length === 0) return null

    const latestKpis = kpis.slice(0, 3)
    const totalMetrics = new Set(kpis.map((kpi) => kpi.metric_name)).size

    return {
      total: kpis.length,
      uniqueMetrics: totalMetrics,
      latest: latestKpis,
      lastUpdated: kpis.length > 0 ? kpis[0].date : null,
    }
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

  if (error || !project) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || "Project not found"}</h1>
                <p className="text-gray-600 mb-6">
                  The project you're looking for doesn't exist or you don't have permission to view it.
                </p>
                <Link
                  href="/projects"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Link>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  const kpiSummary = getKpiSummary()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header with Back Button */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Link
                  href={project.client_id ? `/clients/${project.client_id}` : "/projects"}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {project.client?.name ? `Back to ${project.client.name}` : "Back to Projects"}
                </Link>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <p className="mt-2 text-gray-600">Project Details & KPI Tracking</p>
                </div>
                <button
                  onClick={() => setShowKpiModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add KPI
                </button>
              </div>
            </div>

            {/* Project Information Card */}
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Project Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Project Name</p>
                      <p className="text-lg font-semibold text-gray-900">{project.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {getStatusIcon(project.status)}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Deadline</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(project.deadline)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Client</p>
                      <p className="text-lg font-semibold text-gray-900">{project.client?.name || "Unknown Client"}</p>
                    </div>
                  </div>
                </div>

                {project.description && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start">
                      <FileText className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Project Description</p>
                        <p className="text-gray-700 leading-relaxed">{project.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Summary Cards */}
            {kpiSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total KPIs</p>
                      <p className="text-2xl font-semibold text-gray-900">{kpiSummary.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unique Metrics</p>
                      <p className="text-2xl font-semibold text-gray-900">{kpiSummary.uniqueMetrics}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {kpiSummary.lastUpdated ? formatDate(kpiSummary.lastUpdated) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100">
                      <CheckCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Data Points</p>
                      <p className="text-2xl font-semibold text-gray-900">{kpis.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Key Performance Indicators</h2>
                  <span className="text-sm text-gray-500">
                    {kpis.length} KPI{kpis.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {kpis.length === 0 ? (
                <div className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking key performance indicators for this project.</p>
                  <button
                    onClick={() => setShowKpiModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First KPI
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metric Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {kpis.map((kpi) => (
                        <tr key={kpi.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{kpi.metric_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-blue-600">
                            {kpi.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kpi.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(kpi.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEditKpiModal(kpi)}
                              className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteKpi(kpi.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* KPI Modal */}
        {showKpiModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{editingKpi ? "Edit KPI" : "Add New KPI"}</h3>
                <form onSubmit={handleKpiSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                    <input
                      type="text"
                      required
                      value={kpiFormData.metric_name}
                      onChange={(e) => setKpiFormData({ ...kpiFormData, metric_name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., CO2 Emissions Reduced"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={kpiFormData.value}
                        onChange={(e) => setKpiFormData({ ...kpiFormData, value: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        required
                        value={kpiFormData.unit}
                        onChange={(e) => setKpiFormData({ ...kpiFormData, unit: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., tons, %, kWh"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      required
                      value={kpiFormData.date}
                      onChange={(e) => setKpiFormData({ ...kpiFormData, date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowKpiModal(false)
                        setEditingKpi(null)
                        setKpiFormData({ metric_name: "", value: "", unit: "", date: "" })
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingKpi ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
