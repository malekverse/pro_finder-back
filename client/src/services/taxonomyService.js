import axios from "axios";

const API = "http://localhost:5000/categories";

/* CATEGORY */

export const getCategories = () => axios.get(`${API}/categories`);

export const createCategory = (data) =>
  axios.post(`${API}/createCategory`, data);

export const updateCategory = (id,data) =>
  axios.put(`${API}/updateCategory/${id}`, data);

export const deleteCategory = (id) =>
  axios.delete(`${API}/deleteCategory/${id}`);


/* SUBCATEGORY */

export const getSubCategories = () =>
  axios.get(`${API}/subcategories`);

export const createSubCategory = (data) =>
  axios.post(`${API}/createSubCategory`, data);

export const updateSubCategory = (id,data) =>
  axios.put(`${API}/updateSubCategory/${id}`, data);

export const deleteSubCategory = (id) =>
  axios.delete(`${API}/deleteSubCategory/${id}`);


/* SERVICES */

export const getServices = () =>
  axios.get(`${API}/services`);

export const createService = (data) =>
  axios.post(`${API}/createService`, data);

export const updateService = (id,data) =>
  axios.put(`${API}/updateService/${id}`, data);

export const deleteService = (id) =>
  axios.delete(`${API}/deleteService/${id}`);