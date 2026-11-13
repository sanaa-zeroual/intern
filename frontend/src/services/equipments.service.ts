import api from './api';
import type {
  Equipment,
  BomDetailedItem,
  CreateEquipmentData,
  CreateBomItemData,
} from '../types/equipment.types';

export async function getEquipments(): Promise<Equipment[]> {
  const response = await api.get<Equipment[]>('/equipments');
  return response.data;
}

export async function getEquipmentTree(): Promise<Equipment[]> {
  const response = await api.get<Equipment[]>('/equipments/tree');
  return response.data;
}

export async function getEquipment(id: string): Promise<Equipment> {
  const response = await api.get<Equipment>(`/equipments/${id}`);
  return response.data;
}

export async function createEquipment(data: CreateEquipmentData): Promise<Equipment> {
  const response = await api.post<Equipment>('/equipments', data);
  return response.data;
}

export async function updateEquipment(
  id: string,
  data: Partial<CreateEquipmentData>,
): Promise<Equipment> {
  const response = await api.patch<Equipment>(`/equipments/${id}`, data);
  return response.data;
}

export async function deleteEquipment(id: string): Promise<void> {
  await api.delete(`/equipments/${id}`);
}

export async function getEquipmentBom(equipmentId: string): Promise<BomDetailedItem[]> {
  const response = await api.get<BomDetailedItem[]>(`/equipments/${equipmentId}/bom`);
  return response.data;
}

export async function addBomItem(data: CreateBomItemData): Promise<any> {
  const response = await api.post('/equipments/bom', data);
  return response.data;
}

export async function updateBomItem(
  id: string,
  data: Partial<CreateBomItemData>,
): Promise<any> {
  const response = await api.patch(`/equipments/bom/${id}`, data);
  return response.data;
}

export async function removeBomItem(id: string): Promise<void> {
  await api.delete(`/equipments/bom/${id}`);
}

export async function getArticleEquipments(articleId: string): Promise<any[]> {
  const response = await api.get<any[]>(`/equipments/article/${articleId}`);
  return response.data;
}
