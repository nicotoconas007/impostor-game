const express = require('express')
const http = require('http')
const cors = require('cors')
const { Server } = require('socket.io')
const fs = require('fs')
const path = require('path')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
	cors: { origin: '*'}
})

// Cargar palabras desde JSON
let WORDS = []
try {
	const wordsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'))
	WORDS = wordsData.words
	console.log(`Loaded ${WORDS.length} words from words.json`)
} catch (error) {
	console.error('Error loading words.json, using fallback words:', error)
	WORDS = ['Pizza', 'Hamburguesa', 'Empanada', 'Sushi', 'Taco', 'Arepa']
}

// Estado en memoria por sala
const rooms = new Map()

function getOrCreateRoom(roomId) {
	if (!rooms.has(roomId)) {
		rooms.set(roomId, {
			players: new Map(), // id -> { id, name, alive }
			impostorId: null,
			word: null,
			phase: 'join', // join | assigned | vote | results
			votes: new Map(), // voterId -> targetId
			nextTimer: null,
			lastEliminatedWasImpostor: false,
		})
	}
	return rooms.get(roomId)
}

function chooseRandom(array) {
	return array[Math.floor(Math.random() * array.length)]
}

function broadcastRoomState(roomId) {
	const room = getOrCreateRoom(roomId)
	io.to(roomId).emit('room_state', {
		players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, alive: p.alive })),
		phase: room.phase,
	})
}

io.on('connection', (socket) => {
	let currentRoomId = null

	socket.on('join_room', ({ roomId, name }) => {
		currentRoomId = roomId || 'default'
		const room = getOrCreateRoom(currentRoomId)
		if (room.phase !== 'join') {
			io.to(socket.id).emit('room_locked', { message: 'La partida ya está en curso' })
			return
		}
		socket.join(currentRoomId)
		room.players.set(socket.id, { id: socket.id, name, alive: true })
		broadcastRoomState(currentRoomId)
	})

	socket.on('start_round', ({ roomId }) => {
		const room = getOrCreateRoom(roomId)
		if (room.players.size < 3) return
		for (const p of room.players.values()) { p.alive = true }
		room.phase = 'assigned'
		room.impostorId = chooseRandom(Array.from(room.players.keys()))
		room.word = chooseRandom(WORDS)
		// enviar a cada jugador su asignación
		for (const [id, player] of room.players) {
			if (id === room.impostorId) {
				io.to(id).emit('assignment', { role: 'impostor' })
			} else {
				io.to(id).emit('assignment', { role: 'citizen', word: room.word })
			}
		}
		io.to(roomId).emit('phase', 'assigned')
	})

	socket.on('start_vote', ({ roomId }) => {
		const room = getOrCreateRoom(roomId)
		if (!room.players.get(socket.id)?.alive) return
		room.phase = 'vote'
		room.votes.clear()
		io.to(roomId).emit('phase', 'vote')
	})

	socket.on('cast_vote', ({ roomId, targetId }) => {
		const room = getOrCreateRoom(roomId)
		if (room.phase !== 'vote') return
		if (!room.players.get(socket.id)?.alive) return
		if (!room.players.get(targetId)?.alive) return
		// no permitir múltiples cambios de voto si ya votó y está eliminado ahora
		// (simple: siempre sobreescribir; se mantiene última elección)
		room.votes.set(socket.id, targetId)
		io.to(roomId).emit('vote_state', {
			votes: Object.fromEntries(room.votes),
		})
		// Si todos los jugadores votaron, calcular resultados
		const aliveIds = Array.from(room.players.values()).filter(p => p.alive).map(p => p.id)
		if (room.votes.size === aliveIds.length) {
			const tally = {}
			for (const [, votedId] of room.votes) {
				tally[votedId] = (tally[votedId] || 0) + 1
			}
			
			// Encontrar el máximo de votos
			let maxVotes = Math.max(...Object.values(tally))
			
			// Encontrar todos los jugadores con el máximo de votos
			const playersWithMaxVotes = Object.entries(tally)
				.filter(([id, count]) => count === maxVotes)
				.map(([id, count]) => id)
			
			// Si hay empate, volver a votar
			if (playersWithMaxVotes.length > 1) {
				room.votes.clear()
				const tiedPlayerNames = playersWithMaxVotes
					.map(id => room.players.get(id)?.name)
					.filter(Boolean)
					
				io.to(roomId).emit('vote_tie', {
					tiedPlayers: tiedPlayerNames,
					message: `Empate entre: ${tiedPlayerNames.join(', ')}. ¡Voten de nuevo!`
				})
				io.to(roomId).emit('vote_state', { votes: {} })
				return
			}
			
			// Si no hay empate, eliminar al jugador con más votos
			const eliminatedId = playersWithMaxVotes[0]
			const eliminated = room.players.get(eliminatedId)
			const impostor = room.players.get(room.impostorId)
			const eliminatedWasImpostor = eliminatedId === room.impostorId
			if (eliminated) eliminated.alive = false
			
			// Enviar estado actualizado inmediatamente después de la eliminación
			broadcastRoomState(roomId)
			
			// Verificar si el impostor gana (solo él queda vivo O quedan 2 personas y una es el impostor)
			const aliveAfterElimination = Array.from(room.players.values()).filter(p => p.alive)
			const impostorIsAlive = aliveAfterElimination.some(p => p.id === room.impostorId)
			const impostorWins = impostorIsAlive && aliveAfterElimination.length <= 2
			
			room.phase = 'results'
			room.lastEliminatedWasImpostor = !!eliminatedWasImpostor
			
			if (impostorWins) {
				// El impostor gana
				io.to(roomId).emit('impostor_wins', {
					impostorName: impostor?.name,
					eliminatedName: eliminated?.name,
				})
				// Auto reiniciar partida después de 5 segundos
				setTimeout(() => {
					room.phase = 'join'
					room.votes.clear()
					room.impostorId = null
					room.word = null
					for (const p of room.players.values()) p.alive = true
					broadcastRoomState(roomId)
				}, 5000)
			} else {
				io.to(roomId).emit('round_results', {
					impostorName: eliminatedWasImpostor ? impostor?.name : null,
					eliminatedName: eliminated?.name,
					eliminatedWasImpostor,
				})
				clearTimeout(room.nextTimer)
				if (!eliminatedWasImpostor) {
					room.nextTimer = setTimeout(() => {
						room.phase = 'vote'
						room.votes.clear()
						io.to(roomId).emit('phase', 'vote')
						io.to(roomId).emit('vote_state', { votes: {} })
					}, 10000)
				} else {
					// Si se descubrió al impostor, reiniciar automáticamente después de 5 segundos
					setTimeout(() => {
						room.phase = 'join'
						room.votes.clear()
						room.impostorId = null
						room.word = null
						for (const p of room.players.values()) p.alive = true
						broadcastRoomState(roomId)
					}, 5000)
				}
			}
		}
	})

	socket.on('next_round', ({ roomId }) => {
		const room = getOrCreateRoom(roomId)
		if (!room.players.get(socket.id)?.alive) return
		clearTimeout(room.nextTimer)
		if (room.lastEliminatedWasImpostor) {
			room.phase = 'join'
			room.votes.clear()
			room.impostorId = null
			room.word = null
			for (const p of room.players.values()) p.alive = true
			broadcastRoomState(roomId)
		} else {
			room.phase = 'vote'
			room.votes.clear()
			io.to(roomId).emit('phase', 'vote')
			io.to(roomId).emit('vote_state', { votes: {} })
		}
	})

	socket.on('disconnect', () => {
		if (!currentRoomId) return
		const room = getOrCreateRoom(currentRoomId)
		room.players.delete(socket.id)
		if (room.players.size === 0) {
			rooms.delete(currentRoomId)
		} else {
			broadcastRoomState(currentRoomId)
		}
	})
})

app.get('/', (_req, res) => {
	res.send('Impostor server running')
})

const PORT = process.env.PORT || 3001
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Server listening on http://localhost:${PORT}`)
	console.log(`Network access: http://[tu-ip-local]:${PORT}`)
})


