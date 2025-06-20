"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import AuthGuard from "@/components/AuthGuard"
import Navbar from "@/components/Navbar"
import { clientsApi, projectsApi, kpisApi } from "@/lib/supabase"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"

interface CSVRow {
  [key: string]: string
}

interface FieldMapping {
  csvField: string
  dbField: string
  required: boolean
}

export default function UploadPage() {
  const { userId } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [dataType, setDataType] = useState<"clients" | "projects" | "kpis">("clients")
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")

  const fieldOptions = {
    clients: [
      { dbField: "name", label: "Client Name", required: true },
      { dbField: "industry", label: "Industry", required: true },
      { dbField: "esg_risk_level", label: "ESG Risk Level", required: true },
      { dbField: "email", label: "Email", required: true },
    ],
    projects: [
      { dbField: "name", label: "Project Name", required: true },
      { dbField: "client_id", label: "Client ID", required: true },
      { dbField: "status", label: "Status", required: true },
      { dbField: "deadline", label: "Deadline", required: true },
      { dbField: "description", label: "Description", required: false },
    ],
    kpis: [
      { dbField: "metric_name", label: "Metric Name", required: true },
      { dbField: "value", label: "Value", required: true },
      { dbField: "unit", label: "Unit", required: true },
      { dbField: "project_id", label: "Project ID", required: true },
      { dbField: "date", label: "Date", required: true },
    ],
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  function parseCSV(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length === 0) return

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const data = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: CSVRow = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        return row
      })

      setHeaders(headers)
      setCsvData(data)

      // Initialize field mappings
      const mappings = fieldOptions[dataType].map((field) => ({
        csvField: "",
        dbField: field.dbField,
        required: field.required,
      }))
      setFieldMappings(mappings)
    }
    reader.readAsText(file)
  }

  function updateFieldMapping(dbField: string, csvField: string) {
    setFieldMappings((prev) =>
      prev.map((mapping) => (mapping.dbField === dbField ? { ...mapping, csvField } : mapping)),
    )
  }

  async function handleUpload() {
    if (!userId || !csvData.length) return

    setUploading(true)
    setUploadStatus("idle")

    try {
      const mappedData = csvData.map((row) => {
        const mappedRow: any = { user_id: userId }

        fieldMappings.forEach((mapping) => {
          if (mapping.csvField && row[mapping.csvField]) {
            let value = row[mapping.csvField]

            // Type conversion for specific fields
            if (mapping.dbField === "value" && dataType === "kpis") {
              value = Number.parseFloat(value)
            }

            mappedRow[mapping.dbField] = value
          }
        })

        return mappedRow
      })

      // Upload data based on type
      if (dataType === "clients") {
        for (const client of mappedData) {
          await clientsApi.create(client)
        }
      } else if (dataType === "projects") {
        for (const project of mappedData) {
          await projectsApi.create(project)
        }
      } else if (dataType === "kpis") {
        for (const kpi of mappedData) {
          await kpisApi.create(kpi)
        }
      }

      setUploadStatus("success")
      setUploadMessage(`Successfully uploaded ${mappedData.length} ${dataType}`)

      // Reset form
      setFile(null)
      setCsvData([])
      setHeaders([])
      setFieldMappings([])
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setUploadMessage("Failed to upload data. Please check your mappings and try again.")
    } finally {
      setUploading(false)
    }
  }

  const canUpload = csvData.length > 0 && fieldMappings.filter((m) => m.required).every((m) => m.csvField)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Upload CSV Data</h1>
              <p className="mt-2 text-gray-600">Upload CSV files to bulk import clients, projects, or KPIs</p>
            </div>

            <div className="space-y-6">
              {/* Data Type Selection */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Data Type</h3>
                <div className="grid grid-cols-3 gap-4">
                  {(["clients", "projects", "kpis"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setDataType(type)}
                      className={`p-4 border-2 rounded-lg text-center capitalize ${
                        dataType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {file ? file.name : "Choose a CSV file"}
                        </span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">CSV files only</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Mapping */}
              {headers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Map CSV Fields</h3>
                  <div className="space-y-4">
                    {fieldMappings.map((mapping) => {
                      const fieldOption = fieldOptions[dataType].find((f) => f.dbField === mapping.dbField)
                      return (
                        <div key={mapping.dbField} className="flex items-center space-x-4">
                          <div className="w-1/3">
                            <label className="block text-sm font-medium text-gray-700">
                              {fieldOption?.label}
                              {mapping.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                          </div>
                          <div className="w-1/3">
                            <select
                              value={mapping.csvField}
                              onChange={(e) => updateFieldMapping(mapping.dbField, e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select CSV column</option>
                              {headers.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-1/3 text-sm text-gray-500">
                            {mapping.csvField && csvData[0]?.[mapping.csvField] && (
                              <span>Preview: {csvData[0][mapping.csvField]}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              {csvData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Data Preview ({csvData.length} rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {headers.slice(0, 5).map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 3).map((row, index) => (
                          <tr key={index}>
                            {headers.slice(0, 5).map((header) => (
                              <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row[header]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {csvData.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Ready to Upload</h3>
                      <p className="text-sm text-gray-600">
                        {csvData.length} rows will be uploaded as {dataType}
                      </p>
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={!canUpload || uploading}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        canUpload && !uploading
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {uploading ? "Uploading..." : "Upload Data"}
                    </button>
                  </div>

                  {/* Status Messages */}
                  {uploadStatus === "success" && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-green-700">{uploadMessage}</span>
                      </div>
                    </div>
                  )}

                  {uploadStatus === "error" && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700">{uploadMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
