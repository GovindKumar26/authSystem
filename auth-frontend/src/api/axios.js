import axios from "axios";

const api = axios.create({
    baseURL: "https://authsystem-yvpe.onrender.com",
    withCredentials: true,
});

export default api;