import { create } from 'zustand'

export const useGameStore = create((set) => ({
	roomId: 'default',
	players: [],
	assignment: null,
	votes: {},
	results: null,
	setRoomId: (roomId) => set({ roomId }),
	setPlayers: (players) => set({ players }),
	setAssignment: (assignment) => set({ assignment }),
	setVotes: (votes) => set({ votes }),
	setResults: (results) => set({ results }),
}))


