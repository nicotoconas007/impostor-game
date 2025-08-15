import { useEffect, useMemo, useState } from 'react'
import { Container, Box, Typography, TextField, Button, Paper, Grid, List, ListItem, ListItemText, Divider, Chip, Alert, Avatar, ListItemAvatar, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Fade, Slide, CircularProgress, LinearProgress } from '@mui/material'
import { PersonOutline, PersonOff, HowToVote, Close, EmojiEvents, Visibility, VisibilityOff, PlayArrow, Timer } from '@mui/icons-material'
import { socket } from './socket'

function App() {
  const [screen, setScreen] = useState('join') // join | lobby | assigned | vote | results | locked
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('default')
  const [players, setPlayers] = useState([])
  const [assignment, setAssignment] = useState(null) // { role: 'impostor' | 'citizen', word?: string }
  const [votes, setVotes] = useState({})
  const [results, setResults] = useState(null)
  const [phase, setPhase] = useState('join')
  const [lockMsg, setLockMsg] = useState('')
  const [impostorWins, setImpostorWins] = useState(null)
  const [isRevealing, setIsRevealing] = useState(false)

  useEffect(() => {
    socket.on('connect', () => {})
    socket.on('room_state', (state) => {
      setPlayers(state.players)
      setPhase(state.phase)
      if (state.phase === 'join') {
        setScreen('lobby')
        setVotes({}) // Limpiar votos al volver al lobby
        setResults(null)
        setAssignment(null)
      }
    })
    socket.on('assignment', (payload) => {
      setIsRevealing(true)
      setTimeout(() => {
        setAssignment(payload)
        setScreen('assigned')
        setPhase('assigned')
        setIsRevealing(false)
      }, 2000)
    })
    socket.on('phase', (phase) => {
      setScreen(phase)
      setPhase(phase)
    })
    socket.on('vote_state', (voteState) => {
      setVotes(voteState.votes)
    })
    socket.on('round_results', (payload) => {
      setResults(payload)
      setScreen('results')
    })
    socket.on('room_locked', ({ message }) => {
      setLockMsg(message || 'La partida está en curso')
      setScreen('locked')
    })
    socket.on('impostor_wins', (payload) => {
      setImpostorWins(payload)
      setScreen('impostor_wins')
      // Auto cerrar el dialog después de 5 segundos
      setTimeout(() => {
        setImpostorWins(null)
        setScreen('lobby')
      }, 5000)
    })
    return () => {
      socket.off()
    }
  }, [])

  const canStart = useMemo(() => players.length >= 3 && phase === 'join', [players, phase])
  const me = useMemo(() => players.find(p => p.id === socket.id), [players])
  const isAlive = me?.alive !== false

  const handleJoin = () => {
    if (!name) return
    if (!socket.connected) socket.connect()
    socket.emit('join_room', { roomId, name })
  }

  const handleStart = () => {
    socket.emit('start_round', { roomId })
  }

  const handleProceedToVote = () => {
    socket.emit('start_vote', { roomId })
  }

  const handleVote = (targetId) => {
    socket.emit('cast_vote', { roomId, targetId })
  }

  const handleNextRound = () => {
    setResults(null)
    setAssignment(null)
    setVotes({})
    socket.emit('next_round', { roomId })
  }

  const handleCloseImpostorWins = () => {
    setImpostorWins(null)
    setScreen('lobby')
  }

    return (
    <Box sx={{ 
      minHeight: '100dvh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite alternate'
      },
      '@keyframes pulse': {
        '0%': { opacity: 0.5 },
        '100%': { opacity: 1 }
      }
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper elevation={24} sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: 4,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: screen === 'join' ? 'shimmer 2s infinite' : 'none'
            },
            '@keyframes shimmer': {
              '0%': { left: '-100%' },
              '100%': { left: '100%' }
            }
          }}>
            {/* Header con logo animado */}
            <Box sx={{ textAlign: 'center', mb: 3, position: 'relative' }}>
              <Typography variant="h3" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1)',
                backgroundSize: '200% 200%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                animation: 'gradient 3s ease infinite',
                textShadow: '0 0 30px rgba(255,107,107,0.5)',
                '@keyframes gradient': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                }
              }}>
                🎭 IMPOSTOR
              </Typography>
              {screen !== 'join' && (
                <Typography variant="subtitle2" sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'medium',
                  opacity: 0.8
                }}>
                  Sala: {roomId}
                </Typography>
              )}
            </Box>

            {/* Loader para revelación */}
            {isRevealing && (
              <Fade in timeout={300}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
                  <Typography variant="h6" color="primary">
                    Revelando tu rol...
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Pantalla bloqueada */}
            {screen === 'locked' && (
              <Slide direction="down" in timeout={500}>
                <Alert severity="error" sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: '2rem'
                  }
                }}>
                  <Typography variant="h6">{lockMsg}</Typography>
                </Alert>
              </Slide>
            )}
            {/* Pantalla de ingreso */}
            {screen === 'join' && !isRevealing && (
              <Slide direction="up" in timeout={600}>
                <Box display="flex" flexDirection="column" gap={3}>
                  <TextField 
                    label="Tu nombre" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                  <TextField 
                    label="Sala" 
                    value={roomId} 
                    onChange={(e) => setRoomId(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleJoin} 
                    disabled={!name}
                    size="large"
                    startIcon={<PlayArrow />}
                    sx={{
                      borderRadius: 3,
                      py: 1.5,
                      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 6px 20px rgba(255, 105, 135, .4)'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #ccc 30%, #bbb 90%)'
                      }
                    }}
                  >
                    Entrar al Juego
                  </Button>
                </Box>
              </Slide>
            )}
            {/* Lista de jugadores */}
            {screen !== 'join' && screen !== 'locked' && !isRevealing && (
              <Fade in timeout={1000}>
                <Box mb={3}>
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    fontWeight: 'bold',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    👥 Jugadores ({players.length})
                  </Typography>
                  <List sx={{ 
                    bgcolor: 'rgba(255,255,255,0.7)', 
                    borderRadius: 3, 
                    p: 1,
                    backdropFilter: 'blur(10px)'
                  }}>
                    {players.map((p, index) => {
                      const isMe = p.id === socket.id
                      const eliminated = p.alive === false
                      return (
                        <Slide direction="right" in timeout={300 + index * 100} key={p.id}>
                          <ListItem sx={{ 
                            borderRadius: 2, 
                            mb: 0.5,
                            bgcolor: isMe ? 'linear-gradient(135deg, rgba(25,118,210,0.15) 0%, rgba(25,118,210,0.05) 100%)' : 'transparent',
                            opacity: eliminated ? 0.6 : 1,
                            border: eliminated ? '2px dashed' : isMe ? '2px solid' : '1px solid transparent',
                            borderColor: eliminated ? 'error.main' : isMe ? 'primary.main' : 'transparent',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: eliminated ? 'none' : 'translateX(5px)',
                              bgcolor: isMe ? 'linear-gradient(135deg, rgba(25,118,210,0.2) 0%, rgba(25,118,210,0.1) 100%)' : 'rgba(0,0,0,0.02)'
                            }
                          }}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {isMe && <Chip size="small" color="primary" label="Yo" sx={{ fontWeight: 'bold' }} />}
                                {eliminated ? (
                                  <Close sx={{ color: 'error.main', fontSize: 20 }} />
                                ) : (
                                  <HowToVote sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                              </Box>
                            }>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: eliminated ? 'error.main' : (isMe ? 'primary.main' : 'secondary.main'), 
                                color: 'white',
                                width: 40, 
                                height: 40,
                                fontWeight: 'bold',
                                boxShadow: eliminated ? 'none' : '0 4px 14px rgba(0,0,0,0.3)',
                                animation: isMe ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                  '0%': { boxShadow: '0 4px 14px rgba(25,118,210,0.3)' },
                                  '50%': { boxShadow: '0 4px 20px rgba(25,118,210,0.6)' },
                                  '100%': { boxShadow: '0 4px 14px rgba(25,118,210,0.3)' }
                                }
                              }}>
                                {p.name?.[0]?.toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Typography sx={{ 
                                textDecoration: eliminated ? 'line-through' : 'none', 
                                fontWeight: isMe ? 'bold' : 'medium',
                                fontSize: '1.1rem',
                                color: eliminated ? 'error.main' : 'text.primary'
                              }}>
                                {p.name}
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip 
                                  size="small" 
                                  label={eliminated ? 'Eliminado' : (isMe ? 'Activo' : 'Puede votar')}
                                  color={eliminated ? 'error' : (isMe ? 'primary' : 'success')}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </ListItem>
                        </Slide>
                      )
                    })}
                  </List>
                </Box>
              </Fade>
            )}
            {/* Asignación de rol */}
            {screen === 'assigned' && assignment && !isRevealing && (
              <Slide direction="up" in timeout={800}>
                <Card sx={{ 
                  background: assignment.role === 'impostor' 
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                    : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                  color: 'white',
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 4,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: assignment.role === 'impostor' 
                      ? 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 2s ease-in-out infinite alternate'
                  }
                }}>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    {assignment.role === 'impostor' ? (
                      <>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 'bold', 
                          mb: 2,
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                          animation: 'shake 0.5s ease-in-out infinite alternate'
                        }}>
                          🎭 IMPOSTOR
                        </Typography>
                        <Typography variant="h6" sx={{ opacity: 0.9 }}>
                          Tu misión: ¡Engaña a todos!
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold', 
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <Visibility /> Tu palabra secreta
                        </Typography>
                        <Typography variant="h2" sx={{ 
                          fontWeight: 'bold',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          mb: 2,
                          p: 2,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderRadius: 3,
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}>
                          {assignment.word}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Recuerda esta palabra. ¡Encuentra al impostor!
                        </Typography>
                      </>
                    )}
                    <Box sx={{ mt: 4 }}>
                      <Button 
                        variant="contained" 
                        onClick={handleProceedToVote}
                        size="large"
                        startIcon={<HowToVote />}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          borderRadius: 3,
                          py: 1.5,
                          px: 4,
                          fontWeight: 'bold',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                          }
                        }}
                      >
                        Ir a Votación
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            )}
            {/* Pantalla de votación */}
            {screen === 'vote' && !isRevealing && (
              <Fade in timeout={600}>
                <Box>
                  {isAlive ? (
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                      color: 'white',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <CardContent>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold', 
                          mb: 3,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 1,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}>
                          <HowToVote /> ¿Quién es el impostor?
                        </Typography>
                        <Grid container spacing={2}>
                          {players.filter(p => p.id !== socket.id && p.alive !== false).map((p, index) => (
                            <Grid xs={6} key={p.id}>
                              <Slide direction="up" in timeout={400 + index * 100}>
                                <Button 
                                  fullWidth 
                                  variant="contained" 
                                  startIcon={<PersonOutline />} 
                                  onClick={() => handleVote(p.id)}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    borderRadius: 3,
                                    py: 1.5,
                                    fontWeight: 'bold',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,255,255,0.3)',
                                      transform: 'translateY(-3px)',
                                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                                    }
                                  }}
                                >
                                  {p.name}
                                </Button>
                              </Slide>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
                      color: 'white',
                      textAlign: 'center',
                      borderRadius: 4
                    }}>
                      <CardContent>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 'bold',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <Close /> Eliminado
                        </Typography>
                        <Typography variant="body1">
                          Espera a que termine la partida
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Votos emitidos */}
                  <Box mt={3}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      🗳️ Votos Emitidos
                    </Typography>
                    <Card sx={{ 
                      bgcolor: 'rgba(255,255,255,0.8)', 
                      borderRadius: 3,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        {Object.entries(votes).length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {Object.entries(votes).map(([voterId, targetId], index) => {
                              const voter = players.find(p => p.id === voterId)
                              const target = players.find(p => p.id === targetId)
                              return (
                                <Slide direction="left" in timeout={200 + index * 100} key={voterId}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2,
                                    p: 1.5,
                                    bgcolor: 'rgba(25,118,210,0.1)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(25,118,210,0.2)'
                                  }}>
                                    <Avatar sx={{ 
                                      bgcolor: 'primary.main', 
                                      width: 24, 
                                      height: 24,
                                      fontSize: '0.8rem'
                                    }}>
                                      {voter?.name?.[0]}
                                    </Avatar>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      {voter?.name}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">→</Typography>
                                    <Avatar sx={{ 
                                      bgcolor: 'error.main', 
                                      width: 24, 
                                      height: 24,
                                      fontSize: '0.8rem'
                                    }}>
                                      {target?.name?.[0]}
                                    </Avatar>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                      {target?.name}
                                    </Typography>
                                  </Box>
                                </Slide>
                              )
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            Esperando votos...
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              </Fade>
            )}
            {/* Pantalla de resultados */}
            {screen === 'results' && results && !isRevealing && (
              <Slide direction="up" in timeout={800}>
                <Card sx={{ 
                  background: results.eliminatedWasImpostor 
                    ? 'linear-gradient(135deg, #00b894 0%, #00a085 100%)'
                    : 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
                  color: 'white',
                  textAlign: 'center',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 'bold', 
                      mb: 3,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      {results.eliminatedWasImpostor ? '🎉 ¡Victoria!' : '⚠️ Continúa el juego'}
                    </Typography>
                    
                    <Box sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      borderRadius: 3, 
                      p: 3, 
                      mb: 3,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Eliminado: {results.eliminatedName}
                      </Typography>
                      {results.impostorName && (
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                          Impostor era: {results.impostorName}
                        </Typography>
                      )}
                      <Typography variant="body1" sx={{ 
                        fontWeight: 'medium',
                        fontSize: '1.1rem'
                      }}>
                        {results.eliminatedWasImpostor ? '¡Descubrieron al impostor!' : 'No era el impostor.'}
                      </Typography>
                    </Box>

                    {results.eliminatedWasImpostor ? (
                      <Box>
                        <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                          Nueva partida empezará automáticamente...
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                          <CircularProgress size={24} sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          5 segundos
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {isAlive && (
                          <Button 
                            variant="contained" 
                            onClick={handleNextRound}
                            size="large"
                            startIcon={<PlayArrow />}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              borderRadius: 3,
                              py: 1.5,
                              px: 4,
                              fontWeight: 'bold',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.3)',
                              mb: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                              }
                            }}
                          >
                            Siguiente Ronda
                          </Button>
                        )}
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                          Auto-continúa en 10s si nadie toca
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Slide>
            )}

            {/* Botón empezar ronda */}
            {phase === 'join' && screen === 'lobby' && !isRevealing && (
              <Fade in timeout={1200}>
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    disabled={!canStart} 
                    onClick={handleStart}
                    size="large"
                    startIcon={<PlayArrow />}
                    sx={{
                      borderRadius: 4,
                      py: 2,
                      px: 4,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #ccc 30%, #bbb 90%)',
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Empezar Ronda
                  </Button>
                  {!canStart && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Mínimo 3 jugadores para comenzar
                    </Typography>
                  )}
                </Box>
              </Fade>
            )}
          </Paper>
        </Fade>
      </Container>

      {/* Dialog para cuando el impostor gana */}
      <Dialog 
        open={!!impostorWins} 
        onClose={handleCloseImpostorWins} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)',
            color: 'white',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite alternate'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          position: 'relative',
          zIndex: 1,
          py: 3,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontSize: '2rem'
        }}>
          <EmojiEvents sx={{ fontSize: '3rem', animation: 'bounce 1s infinite' }} />
          ¡IMPOSTOR GANA!
        </DialogTitle>
        <DialogContent sx={{ 
          textAlign: 'center', 
          position: 'relative',
          zIndex: 1,
          pb: 4
        }}>
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            borderRadius: 3, 
            p: 3, 
            mb: 3,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              mb: 2,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}>
              🎉 {impostorWins?.impostorName} 🎉
            </Typography>
            <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>
              Último eliminado: {impostorWins?.eliminatedName}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              El impostor ganó al quedar en minoría
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} sx={{ color: 'rgba(255,255,255,0.8)' }} />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              Nueva partida en 5 segundos...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default App
