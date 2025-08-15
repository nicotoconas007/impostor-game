import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://tu-app-production.up.railway.app'
console.log(import.meta.env)

export const socket = io(SERVER_URL, {
	autoConnect: false,
})


