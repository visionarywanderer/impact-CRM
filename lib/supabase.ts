import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Client {
  id: string
  name: string
  industry: string
  esg_risk_level: "Low" | "Medium" | "High"
  email: string
  created_at: string
  user_id: string
}

export interface Project {
  id: string
  name: string
  client_id: string
  status: "Planning" | "In Progress" | "Completed" | "On Hold"
  deadline: string
  description?: string
  created_at: string
  user_id: string
  client?: Client
}

export interface KPI {
  id: string
  metric_name: string
  value: number
  unit: string
  project_id: string
  date: string
  created_at: string
  user_id: string
  project?: Project
}

// Database operations
export const clientsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Client[]
  },

  async create(client: Omit<Client, "id" | "created_at">) {
    const { data, error } = await supabase.from("clients").insert([client]).select().single()

    if (error) throw error
    return data as Client
  },

  async update(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data as Client
  },

  async delete(id: string) {
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) throw error
  },
}

export const projectsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:clients(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Project[]
  },

  async create(project: Omit<Project, "id" | "created_at">) {
    const { data, error } = await supabase.from("projects").insert([project]).select().single()

    if (error) throw error
    return data as Project
  },

  async update(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data as Project
  },

  async delete(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) throw error
  },
}

export const kpisApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("kpis")
      .select(`
        *,
        project:projects(
          *,
          client:clients(*)
        )
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (error) throw error
    return data as KPI[]
  },

  async create(kpi: Omit<KPI, "id" | "created_at">) {
    const { data, error } = await supabase.from("kpis").insert([kpi]).select().single()

    if (error) throw error
    return data as KPI
  },

  async update(id: string, updates: Partial<KPI>) {
    const { data, error } = await supabase.from("kpis").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data as KPI
  },

  async delete(id: string) {
    const { error } = await supabase.from("kpis").delete().eq("id", id)

    if (error) throw error
  },
}
