import apiClient from './client'
import type { TemplateResponse, TemplateCreate, TemplateUpdate } from '../types'

export async function listTemplates(
  skip = 0,
  limit = 50,
  include_defaults = true,
): Promise<TemplateResponse[]> {
  const { data } = await apiClient.get<TemplateResponse[]>('/templates/', {
    params: { skip, limit, include_defaults },
  })
  return data
}

export async function getTemplate(id: string): Promise<TemplateResponse> {
  const { data } = await apiClient.get<TemplateResponse>(`/templates/${id}`)
  return data
}

export async function createTemplate(
  template: TemplateCreate,
): Promise<TemplateResponse> {
  const { data } = await apiClient.post<TemplateResponse>(
    '/templates/',
    template,
  )
  return data
}

export async function updateTemplate(
  id: string,
  template: TemplateUpdate,
): Promise<TemplateResponse> {
  const { data } = await apiClient.put<TemplateResponse>(
    `/templates/${id}`,
    template,
  )
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/templates/${id}`)
}
