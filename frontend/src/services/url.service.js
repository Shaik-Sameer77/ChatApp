import axios from "axios"

const apiUrl=`${import.meta.env.VITE_SERVER_URL}/api`;

const getToken = ()=>localStorage.getItem("auth_token")

const axiosInstance= axios.create({
    baseURL:apiUrl,
    // withCredentials:true
})

axiosInstance.interceptors.request.use((config)=>{
    const token = getToken();
    if(token){
        config.headers.Authorization=`Bearer ${token}`
    }
    return config
})

export default axiosInstance;
