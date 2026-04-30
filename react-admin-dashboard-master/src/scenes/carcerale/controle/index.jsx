import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, alpha, Button, Grid, Stack, Paper,
  Avatar, Divider, LinearProgress, Tooltip, CircularProgress
} from "@mui/material";
import {
  Fingerprint, Face, Visibility, Favorite, 
  PlayArrow, Stop, Warning, Security, CheckCircle, Sync
} from "@mui/icons-material";
import Header from "../../../components/Header";
import api from "../../../api"; // Ton instance Axios

// --- COMPOSANT ECG (ANIMATION DU CŒUR) ---
const ECGMonitor = ({ isActive, color = "#CE1021" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.width;
    let height = canvas.height;
    let x = 0;
    let points = [];
    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = isActive ? color : "#444";
      ctx.lineWidth = 2;
      ctx.shadowBlur = isActive ? 8 : 0;
      ctx.shadowColor = color;
      ctx.beginPath();

      if (points.length > width / 2) points.shift();
      
      let y = height / 2;
      // Si actif, on fait des pics de battements, sinon une ligne plate
      if (isActive && x % 50 === 0) {
         points.push(y - 25, y + 10); 
      } else {
         points.push(y + (isActive ? Math.random() * 2 - 1 : 0));
      }

      for (let i = 0; i < points.length; i++) {
        ctx.lineTo(i * 2, points[i]);
      }
      ctx.stroke();
      x++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, color]);

  return (
    <Box sx={{ width: '100%', height: 60, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden', mt: 1 }}>
      <canvas ref={canvasRef} width={400} height={60} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

// --- COMPOSANT PRINCIPAL ---
const IdentificationTerminal = () => {
  // États de session
  const [session, setSession] = useState({ active: false, type: null });
  // États de scan
  const [scanStatus, setScanStatus] = useState("IDLE"); // IDLE, SCANNING, WAITING_FINGER, AUTHENTICATING, SUCCESS
  const [progress, setProgress] = useState(0);

  // Simulation du démarrage (Autorité)
  const handleStart = (type) => {
    setSession({ active: true, type });
    setScanStatus("SCANNING");
    setProgress(0);
  };

  // Logique du scan facial automatique
  useEffect(() => {
    if (scanStatus === "SCANNING") {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setScanStatus("WAITING_FINGER");
            return 100;
          }
          return prev + 5;
        });
      }, 150);
      return () => clearInterval(timer);
    }
  }, [scanStatus]);

  // Simulation du scan de l'empreinte (Action utilisateur)
  const simulateFingerprint = () => {
    if (scanStatus !== "WAITING_FINGER") return;
    
    setScanStatus("AUTHENTICATING");
    setTimeout(() => {
      setScanStatus("SUCCESS");
    }, 2000);
  };

  return (
    <Box m="20px">
      <Header title="TERMINAL BIOMÉTRIQUE V3" subtitle="Contrôle Pénitentiaire Haute Sécurité" />

      {/* BARRE D'AUTORITÉ */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `10px solid ${session.active ? "#F7D618" : "#ccc"}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Security color={session.active ? "primary" : "disabled"} />
          <Box>
            <Typography variant="subtitle2" fontWeight={900}>STATUT DU SYSTÈME</Typography>
            <Typography variant="caption" sx={{ textTransform: 'uppercase' }}>
              {session.active ? `CONTRÔLE ${session.type} EN COURS` : "EN ATTENTE D'INITIALISATION"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          {!session.active ? (
            <>
              <Button size="small" variant="outlined" startIcon={<PlayArrow />} onClick={() => handleStart("MATINAL")}>Appel 06:00</Button>
              <Button size="small" variant="contained" color="error" startIcon={<Warning />} onClick={() => handleStart("SURPRISE")}>Appel Surprise</Button>
            </>
          ) : (
            <Button size="small" variant="contained" color="inherit" onClick={() => {setSession({active:false}); setScanStatus("IDLE")}}>Clôturer Session</Button>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* SECTION GAUCHE : SCANNER VISUEL */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ 
            p: 4, height: '580px', bgcolor: '#050505', color: '#00ff00', 
            position: 'relative', overflow: 'hidden', border: '2px solid #333' 
          }}>
            {/* Overlay de veille */}
            {!session.active && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.8)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ letterSpacing: 4, color: '#444' }}>OFFLINE</Typography>
              </Box>
            )}

            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>[ BIOMETRIC_SCAN_UNIT_RD-01 ]</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              {/* VISEUR FACIAL */}
              <Box sx={{ 
                width: 240, height: 240, border: '1px solid rgba(0,255,0,0.3)', 
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Face sx={{ fontSize: 180, opacity: 0.2 }} />
                
                {/* Scanner Laser */}
                {scanStatus === "SCANNING" && (
                  <Box sx={{ 
                    position: 'absolute', width: '100%', height: '2px', 
                    bgcolor: '#00ff00', top: `${progress}%`, boxShadow: '0 0 15px #00ff00' 
                  }} />
                )}

                {/* Coins du viseur */}
                <Box sx={{ position: 'absolute', inset: -5, border: '2px solid #00ff00', clipPath: 'polygon(0 0, 15% 0, 0 15%, 85% 0, 100% 0, 100% 15%, 100% 85%, 100% 100%, 85% 100%, 15% 100%, 0 100%, 0 85%)' }} />
              </Box>

              <Typography variant="h5" sx={{ mt: 3, fontFamily: 'monospace', fontWeight: 900 }}>
                {scanStatus === "SCANNING" && `RECONNAISSANCE FACIALE : ${progress}%`}
                {scanStatus === "WAITING_FINGER" && "EN ATTENTE D'EMPREINTE..."}
                {scanStatus === "AUTHENTICATING" && "VÉRIFICATION BASE DE DONNÉES..."}
                {scanStatus === "SUCCESS" && "IDENTITÉ VÉRIFIÉE - ACCÈS OK"}
              </Typography>
            </Box>

            {/* ZONE INTERACTIVE D'EMPREINTE */}
            <Box sx={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <Tooltip title={scanStatus === "WAITING_FINGER" ? "Posez le doigt ici" : ""}>
                    <Box 
                      onClick={simulateFingerprint}
                      sx={{ 
                        width: 100, height: 120, border: `2px solid ${scanStatus === "WAITING_FINGER" ? '#00ff00' : '#222'}`,
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: scanStatus === "WAITING_FINGER" ? 'pointer' : 'default',
                        transition: 'all 0.3s',
                        bgcolor: scanStatus === "AUTHENTICATING" ? alpha('#00ff00', 0.1) : 'transparent',
                        '&:hover': { bgcolor: scanStatus === "WAITING_FINGER" ? alpha('#00ff00', 0.2) : 'transparent' }
                      }}
                    >
                        {scanStatus === "AUTHENTICATING" ? (
                            <Sync sx={{ fontSize: 50, animation: 'spin 1s infinite linear' }} />
                        ) : (
                            <Fingerprint sx={{ 
                                fontSize: 70, 
                                color: scanStatus === "WAITING_FINGER" ? '#00ff00' : '#333',
                                filter: scanStatus === "WAITING_FINGER" ? 'drop-shadow(0 0 10px #00ff00)' : 'none'
                            }} />
                        )}
                    </Box>
                </Tooltip>
                <Typography variant="caption" sx={{ mt: 1, display: 'block', color: scanStatus === "WAITING_FINGER" ? '#00ff00' : '#444' }}>
                    LECTEUR BIOMÉTRIQUE
                </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* SECTION DROITE : SIGNES VITAUX & FICHE */}
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            {/* MODULE VITAUX */}
            <Paper sx={{ p: 3, borderTop: '4px solid #CE1021', borderRadius: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                    <Favorite color="error" sx={{ animation: session.active ? 'pulse 1s infinite' : 'none' }} />
                    <Typography variant="h6" fontWeight={900}>SIGNES VITAUX</Typography>
                </Box>
                {scanStatus === "SUCCESS" && <CheckCircle color="success" />}
              </Stack>

              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">RYTHME CARDIAQUE</Typography>
                <Typography variant="h3" fontWeight={900} color="#CE1021">
                    {session.active ? "74" : "--"} <span style={{fontSize: '15px'}}>BPM</span>
                </Typography>
                <ECGMonitor isActive={session.active} />
              </Box>

              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">OXYGÈNE (SpO2)</Typography>
                    <Typography variant="h6" fontWeight={900}>{session.active ? "98%" : "--"}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">TEMPÉRATURE</Typography>
                    <Typography variant="h6" fontWeight={900}>{session.active ? "36.7°C" : "--"}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* FICHE RÉSULTAT */}
            <Paper sx={{ p: 3, bgcolor: "#111", color: "#fff", minHeight: '200px', borderRadius: 0, position: 'relative' }}>
                {scanStatus === "SUCCESS" ? (
                  <>
                    <Typography variant="overline" color="primary" sx={{ fontWeight: 900 }}>DÉTENU IDENTIFIÉ</Typography>
                    <Box display="flex" gap={2} mt={1}>
                        <Avatar variant="square" sx={{ width: 90, height: 110, border: '1px solid #00ff00' }} />
                        <Box>
                            <Typography variant="h5" fontWeight={900}>TSHILOMBO M. Jean</Typography>
                            <Typography color="primary" variant="body2">N° MATRICULE : 2026-X90</Typography>
                            <Divider sx={{ bgcolor: '#333', my: 1 }} />
                            <Typography variant="caption" display="block">CELLULE : B-04 (HAUTE SÉCURITÉ)</Typography>
                            <Typography variant="caption" display="block">STATUT : PRÉVENU</Typography>
                        </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', opacity: 0.3 }}>
                    <Face sx={{ fontSize: 60, mb: 1 }} />
                    <Typography variant="caption">EN ATTENTE D'AUTHENTIFICATION</Typography>
                  </Box>
                )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* ANIMATIONS CSS */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>
    </Box>
  );
};

export default IdentificationTerminal;