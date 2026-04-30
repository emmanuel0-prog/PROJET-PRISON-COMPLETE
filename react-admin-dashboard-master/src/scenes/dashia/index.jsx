import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Grid, CircularProgress, Chip, 
  useTheme, alpha, Divider, Button, Avatar, List, ListItem, ListItemText, ListItemIcon, LinearProgress
} from "@mui/material";
import {
  Psychology, Warning, Fingerprint, Timeline, ErrorOutline, 
  Shield, Group, PictureAsPdf, Biotech, TrendingDown
} from "@mui/icons-material";
import { Line, Radar } from "react-chartjs-2";
import axios from "axios";
import "chart.js/auto";

// Assets
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

import api from "../../api"; // Ton instance Axios

const DashboardIA = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const BLUE = "#007FFF";
  const YELLOW = "#F7D618";
  const RED = "#FF3D00";
  const GLASS = isDark ? "rgba(10, 25, 41, 0.7)" : "rgba(255, 255, 255, 0.8)";

  useEffect(() => {
    const fetchIAData = async () => {
      try {
        const res = await api.get("/dashboard/ia-avance/");
        setData(res.data);
      } catch (err) {
        console.error("Erreur IA API:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIAData();
  }, []);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ bgcolor: "#020c1b" }}>
      <CircularProgress sx={{ color: BLUE }} size={80} thickness={2} />
    </Box>
  );

  const { score_visiteurs, faux_noms, anomalies, prediction, alertes } = data;

  // Configuration Chart Prédiction
  const predictionData = {
    labels: prediction.historique.map(h => h.date).reverse(),
    datasets: [{
      label: "Flux de visites",
      data: prediction.historique.map(h => h.visites).reverse(),
      borderColor: BLUE,
      backgroundColor: alpha(BLUE, 0.1),
      fill: true,
      tension: 0.4,
      pointRadius: 5,
    }]
  };

  return (
    <Box p={4} sx={{ 
      minHeight: "100vh", 
      background: isDark ? "radial-gradient(circle at 50% 50%, #0a1929 0%, #020c1b 100%)" : "#f0f2f5" 
    }}>
      
      {/* 🏛️ HEADER DE COMMANDEMENT */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar src={sceauRdc} sx={{ width: 90, height: 90, filter: "drop-shadow(0 0 10px rgba(0,127,255,0.5))" }} />
          <Box>
            <Typography variant="h3" fontWeight={900} sx={{ color: "#fff", letterSpacing: -1 }}>
              CENTRE D'INTELLIGENCE <span style={{ color: BLUE }}>PÉNITENTIAIRE</span>
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Biotech sx={{ color: YELLOW }} />
              <Typography variant="h6" color="grey.400" fontWeight={400}>
                Analyse Prédictive & Surveillance par IA
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box textAlign="right" className="no-print">
          <Button 
            variant="contained" 
            startIcon={<PictureAsPdf />}
            onClick={() => window.print()}
            sx={{ 
              bgcolor: RED, borderRadius: "50px", px: 4, py: 1.5, fontWeight: 900,
              boxShadow: `0 0 20px ${alpha(RED, 0.4)}`,
              "&:hover": { bgcolor: "#cc3100" }
            }}
          >
            RAPPORT DE SÉCURITÉ IA
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: "grey.500" }}>
            Dernière mise à jour : {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* 🚨 ALERTES CRITIQUES IA */}
      <Box mb={4}>
        {alertes.map((al, index) => (
          <Paper key={index} sx={{ 
            p: 2, bgcolor: alpha(RED, 0.15), border: `1px solid ${RED}`, 
            borderRadius: "15px", display: "flex", alignItems: "center", gap: 2,
            animation: "pulse 2s infinite"
          }}>
            <Warning sx={{ color: RED }} />
            <Typography variant="h6" fontWeight={800} color={RED}>{al.message}</Typography>
          </Paper>
        ))}
      </Box>

      <Grid container spacing={4}>
        
        {/* 🕵️ SÉCURITÉ : VISITEURS À HAUT RISQUE */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ 
            p: 3, borderRadius: "25px", bgcolor: GLASS, backdropFilter: "blur(10px)",
            border: `1px solid ${alpha(BLUE, 0.2)}`, height: "100%"
          }}>
            <Typography variant="h5" fontWeight={800} mb={3} display="flex" alignItems="center" gap={2}>
              <Fingerprint sx={{ color: BLUE }} /> Scoring de Risque Visiteurs
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
              {score_visiteurs.map((v, i) => (
                <Box key={i} sx={{ 
                  p: 2, mb: 2, borderRadius: "15px", bgcolor: alpha(BLUE, 0.05),
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: `1px solid ${alpha(BLUE, 0.1)}`
                }}>
                  <Box>
                    <Typography fontWeight={800} variant="body1">ID: {v.piece_identite_numero.substring(0, 15)}...</Typography>
                    <Typography variant="caption" color="grey.500">Tél: {v.telephone} | Visites: {v.nombre_visites}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography fontWeight={900} color={v.score > 30 ? RED : YELLOW} variant="h5">
                      {v.score} <span style={{ fontSize: 12 }}>SCORE IA</span>
                    </Typography>
                    <Box sx={{ width: 100, mt: 0.5 }}>
                      <LinearProgress variant="determinate" value={v.score} sx={{ 
                        height: 6, borderRadius: 5, bgcolor: alpha(BLUE, 0.1),
                        "& .MuiLinearProgress-bar": { bgcolor: v.score > 30 ? RED : YELLOW }
                      }} />
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* ⚠️ FRAUDE : DÉTECTION DE FAUX NOMS */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ 
            p: 3, borderRadius: "25px", bgcolor: alpha(RED, 0.05), 
            border: `1px solid ${alpha(RED, 0.3)}`, height: "100%"
          }}>
            <Typography variant="h5" fontWeight={800} color={RED} mb={3} display="flex" alignItems="center" gap={2}>
              <ErrorOutline /> Alertes d'Identité Frauduleuse
            </Typography>
            {faux_noms.map((f, i) => (
              <Box key={i} sx={{ p: 2, bgcolor: "#fff", borderRadius: "15px", color: "#000", mb: 2 }}>
                <Typography variant="caption" fontWeight={900} color="error">⚠️ USURPATION PROBABLE</Typography>
                <Typography variant="h6" fontWeight={800}>ID: {f.piece_identite_numero.split('/')[2]}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">L'IA a détecté <b>{f.noms_differents} noms différents</b> utilisés avec cette pièce d'identité sur <b>{f.total_visites} visites</b>.</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* 📈 PRÉDICTION : FLUX DE DEMAIN */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: "25px", bgcolor: GLASS, border: `1px solid ${alpha(BLUE, 0.2)}` }}>
            <Typography variant="h5" fontWeight={800} mb={3}>Analyse Prédictive de l'Affluence</Typography>
            <Box height={300}>
              <Line data={predictionData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>

        {/* 🤖 ANOMALIES COMPORTEMENTALES */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: 3, borderRadius: "25px", 
            background: `linear-gradient(135deg, ${BLUE}, #003366)`,
            color: "#fff", textAlign: "center"
          }}>
            <Psychology sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" fontWeight={800}>PRÉDICTION IA DEMAIN</Typography>
            <Typography variant="h2" fontWeight={900}>{prediction.prediction_prochain_jour}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Visites attendues (Marge d'erreur 2%)</Typography>
            
            <Divider sx={{ my: 3, bgcolor: "rgba(255,255,255,0.2)" }} />
            
            <Typography variant="h6" fontWeight={800} mb={2}>Anomalies Temporelles</Typography>
            {anomalies.map((an, i) => (
              <Box key={i} sx={{ bgcolor: "rgba(255,255,255,0.1)", p: 1.5, borderRadius: "10px", mb: 1 }}>
                <Typography variant="caption" display="block">Heure suspecte : {new Date(an.heure_entree).toLocaleTimeString()}</Typography>
                <Typography variant="body2" fontWeight={700}>Tél: {an.telephone}</Typography>
                <Chip label="ANOMALIE DÉTECTÉE" size="small" sx={{ mt: 1, bgcolor: RED, color: "#fff", fontWeight: 900, fontSize: 10 }} />
              </Box>
            ))}
          </Box>
        </Grid>

      </Grid>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.01); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .MuiPaper-root { border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
          }
        `}
      </style>
    </Box>
  );
};

export default DashboardIA;