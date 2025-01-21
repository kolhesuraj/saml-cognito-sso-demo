/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    RawAxiosRequestHeaders
  } from 'axios';
  import * as qs from 'qs';
  
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  
  const handleResponse = (response: AxiosResponse<any, any>) => {
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    throw new Error(response.statusText);
  };
  
  const handleError = (error: any) => {
    console.log(error);
    if (error?.response) {
      // if (error?.config?.url?.includes('/self')) {
      //   throw new Error('Unauthorized');
      // }
      throw new Error(
        error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.response?.data?.body?.error ||
          'Something went wrong'
      );
    } else if (error?.request) {
      throw new Error('No response received from the server');
    } else {
      throw new Error(error?.message || 'Something went wrong');
    }
  };
  
  export const getToken = () => localStorage.getItem('__token');
  export const getCompany = () => localStorage.getItem('__activeCompany');
  export const getResellerCompany = () =>
    localStorage.getItem('__resellerCompany');
  
  export const logout = () => {
    localStorage.removeItem('__activeCompany');
    localStorage.removeItem('__resellerCompany');
    localStorage.removeItem('__token');
    localStorage.removeItem('__sidebarOpen');
    sessionStorage.clear();
  };
  
  const apiRequest = async (
    method: string,
    path: string,
    payload: any = null,
    headers: RawAxiosRequestHeaders = {},
    secure: boolean
  ) => {
    let url = `${API_BASE_URL}${path}`;
    const methodIsGet = method === 'GET' || method === 'DELETE';
  
    if (methodIsGet) {
      url = payload ? `${url}?${qs.stringify(payload)}` : url;
    }
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
  
    if (payload && !methodIsGet) {
      config.data = payload;
    }
  
    if (secure) {
      const token = getToken();
      const activeCompany = getCompany();
      const resellerCompany = getResellerCompany();
  
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}${
          activeCompany && resellerCompany
            ? ` ${activeCompany} ${resellerCompany}`
            : activeCompany
              ? ` ${activeCompany}`
              : ''
        }`;
      } else {
        throw new Error('Need to login first. Please login and try again.');
      }
    }
  
    try {
      const response = await axios(config);
      return handleResponse(response);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        logout();
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
      handleError(error);
    }
  };
  
  export const get = (
    path: string,
    queryParams = {},
    headers = {},
    secure = true
  ) => {
    return apiRequest('GET', path, queryParams, headers, secure);
  };
  export const post = (path: string, body: any, headers = {}, secure = true) => {
    return apiRequest('POST', path, body, headers, secure);
  };
  export const put = (path: string, body: any, headers = {}, secure = true) => {
    return apiRequest('PUT', path, body, headers, secure);
  };
  export const patch = (path: string, body: any, headers = {}, secure = true) => {
    return apiRequest('PATCH', path, body, headers, secure);
  };
  export const del = (
    path: string,
    queryParams = {},
    headers = {},
    secure = true
  ) => {
    return apiRequest('DELETE', path, queryParams, headers, secure);
  };
  