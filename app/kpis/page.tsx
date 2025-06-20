"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import { kpisApi, projectsApi, type KPI, type Project } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2, TrendingUp, Filter } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function KPIs() {
  const { userId } = useAuth()
  const [kpis, setKpis] = useState<KPI[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredKpis, setFilteredKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null)
  const [filters, setFilters] = useState({
    project: "",
    dateFrom: "",
    dateTo: "",
    metric: "",
  })
  const [formData, setFormData] = useState({
    metric_name: "",
    value: "",
    unit: "",
    project_id: "",
    date: "",
  })

  const searchParams = useSearchParams()
  const projectFilter = searchParams.get("project")

  useEffect(() => {
    fetchData()
  }, [userId])

  useEffect(() => {
    applyFilters()
  }, [kpis, filters])

  useEffect(() => {
    if (projectFilter) {
      setFilters((prev) => ({ ...prev, project: projectFilter }))
    }
  }, [projectFilter])

  async function fetchData() {
    if (!userId) return

    try {
      const [kpisData, projectsData] = await Promise.all([kpisApi.getAll(userId), projectsApi.getAll(userId)])
      setKpis(kpisData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...kpis]

    if (filters.project) {
      filtered = filtered.filter((kpi) => kpi.project_id === filters.project)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((kpi) => kpi.date >= filters.dateFrom)
    }

    if (filters.dateTo) {
      filtered = filtered.filter((kpi) => kpi.date <= filters.dateTo)
    }

    if (filters.metric) {
      filtered = filtered.filter((kpi) => kpi.metric_name.toLowerCase().includes(filters.metric.toLowerCase()))
    }

    setFilteredKpis(filtered)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    try {
      const kpiData = {
        ...formData,
        value: Number.parseFloat(formData.value),
        user_id: userId,
      }

      if (editingKpi) {
        await kpisApi.update(editingKpi.id, kpiData)
      } else {
        await kpisApi.create(kpiData)
      }

      await fetchData()
      setShowModal(false)
      setEditingKpi(null)
      setFormData({ metric_name: "", value: "", unit: "", project_id: "", date: "" })
    } catch (error) {
      console.error("Error saving KPI:", error)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this KPI?")) return

    try {
      await kpisApi.delete(id)
      await fetchData()
    } catch (error) {
      console.error("Error deleting KPI:", error)
    }
  }

  function openEditModal(kpi: KPI) {
    setEditingKpi(kpi)
    setFormData({
      metric_name: kpi.metric_name,
      value: kpi.value.toString(),
      unit: kpi.unit,
      project_id: kpi.project_id,
      date: kpi.date,
    })
    setShowModal(true)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">KPIs</h1>
                <p className="mt-2 text-gray-600">Track your key performance indicators</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add KPI
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex items-center mb-3">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label>
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={filters.metric}
                    onChange={(e) => setFilters({ ...filters, metric: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
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
                        Linked Project
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
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredKpis.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No KPIs found. Add your first KPI to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredKpis.map((kpi) => (
                        <tr key={kpi.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{kpi.metric_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                            {kpi.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kpi.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {kpi.project?.name || "Unknown Project"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(kpi.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openEditModal(kpi)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(kpi.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{editingKpi ? "Edit KPI" : "Add New KPI"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Metric Name</label>
                    <input
                      type="text"
                      required
                      value={formData.metric_name}
                      onChange={(e) => setFormData({ ...formData, metric_name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        required
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Linked Project</label>
                    <select
                      required
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingKpi(null)
                        setFormData({ metric_name: "", value: "", unit: "", project_id: "", date: "" })
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
