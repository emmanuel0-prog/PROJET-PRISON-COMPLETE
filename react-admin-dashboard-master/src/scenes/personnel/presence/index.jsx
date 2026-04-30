import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, useTheme, alpha, Button, Grid, 
  Avatar, Chip, Stack, LinearProgress, Paper, IconButton,
  Dialog, DialogContent, CircularProgress
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import {
  FingerprintOutlined,
  CheckCircleOutline,
  AccessTimeOutlined,
  WarningAmberOutlined,
  FileDownloadOutlined,
  PersonOffOutlined,
  HistoryToggleOffOutlined,
  ShieldOutlined,
  EventNoteOutlined
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

// --- IMAGES ---
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";
import api from "../../../api"; // Import de l'instance axios préconfigurée

// --- COULEURS NATIONALES RDC ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";

/* ---------------- COMPOSANT STAT CARD ---------------- */
const StatBox = ({ title, value, icon, color }) => {
  return (
    <Paper sx={{
      p: 2.5, borderRadius: "16px", flex: 1,
      borderLeft: `6px solid ${color}`,
      background: "#fff",
      boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, textTransform: "uppercase" }}>
            {title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, color: "#1a1a1a" }}>{value}</Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: alpha(color, 0.1), color: color }}>
          {icon}
        </Box>
      </Box>
    </Paper>
  );
};

const PresencePersonnel = () => {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openScan, setOpenScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stats, setStats] = useState({ presents: 0, retards: 0, absents: 0, taux: "0%" });
  const [alerteCritique, setAlerteCritique] = useState(false);

  // Mise à jour de l'heure et date chaque seconde
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPointages, resStats] = await Promise.all([
        api.get("/pointages/"),
        api.get("/pointages/statistiques_du_jour/")
      ]);
      
      const formattedRows = resPointages.data.map(p => ({
        id: p.id,
        nom: `${p.nom_agent} ${p.postnom_agent}`,
        matricule: p.matricule_agent,
        arrivee: p.heure_arrivee ? p.heure_arrivee.substring(0, 5) : "--:--",
        statut: p.statut,
        methode: p.methode
      }));

      setRows(formattedRows);
      const total = resStats.data.presents + resStats.data.retards + resStats.data.absents;
      const tauxCalculé = total > 0 ? Math.round(((resStats.data.presents + resStats.data.retards) / total) * 100) : 0;
      setStats({ ...resStats.data, taux: `${tauxCalculé}%` });
      setAlerteCritique((resStats.data.presents + resStats.data.retards) < 5);
    } catch (err) {
      console.error("Erreur", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSimulateScan = async () => {
    setScanning(true);
    try {
      await api.post("/pointages/scanner/", { matricule: "AP-2093" });
      setTimeout(() => {
        setScanning(false);
        setOpenScan(false);
        fetchData();
      }, 1500);
    } catch (err) {
      alert("Erreur de scan");
      setScanning(false);
    }
  };

  const columns = [
    {
      field: "agent",
      headerName: "Agent Pénitentiaire",
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 35, height: 35, bgcolor: RDC_BLUE, fontWeight: 800, border: `2px solid ${RDC_YELLOW}` }}>
            {params.row.nom[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={800}>{params.row.nom}</Typography>
            <Typography variant="caption" sx={{ color: RDC_BLUE, fontWeight: 700 }}>{params.row.matricule}</Typography>
          </Box>
        </Box>
      )
    },
    { 
      field: "arrivee", 
      headerName: "Heure Arrivée", 
      width: 130,
      renderCell: (params) => <Typography variant="body2" fontWeight={700} color="#1a1a1a">{params.value}</Typography>
    },
    {
      field: "statut",
      headerName: "Statut",
      width: 150,
      renderCell: ({ value }) => {
        const color = value === "PRÉSENT" ? "#2e7d32" : value === "RETARD" ? RDC_RED : "#757575";
        return (
          <Chip 
            label={value} 
            size="small" 
            sx={{ fontWeight: 900, bgcolor: alpha(color, 0.1), color: color, borderRadius: "4px" }} 
          />
        );
      }
    },
    {
      field: "methode",
      headerName: "Authentification",
      flex: 1,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <FingerprintOutlined sx={{ fontSize: 18, color: RDC_BLUE }} />
          <Typography variant="caption" fontWeight={700}>{params.value}</Typography>
        </Stack>
      )
    },
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "#f4f7f9", minHeight: "100vh" }}>
      
      {/* HEADER OFFICIEL AVEC DATE ET LOGOS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box component="img" src={sceauRdc} sx={{ height: 80, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: 1, color: RDC_BLUE, lineHeight: 1.2 }}>
              RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Ministère de la Justice • Service de Biométrie
            </Typography>
            <Box sx={{ display: 'flex', mt: 0.5, height: 3, width: 100 }}>
                <Box sx={{ flex: 4, bgcolor: RDC_BLUE }} />
                <Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} />
                <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
            </Box>
          </Box>
        </Stack>

        <Stack direction="row" spacing={4} alignItems="center">
          <Box sx={{ textAlign: 'right' }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <AccessTimeOutlined sx={{ color: RDC_BLUE, fontSize: 28 }} />
              <Typography variant="h4" fontWeight={900} sx={{ color: "#1a1a1a" }}>
                {currentTime.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <EventNoteOutlined sx={{ color: RDC_RED, fontSize: 18 }} />
              <Typography variant="body1" fontWeight={700} sx={{ color: "text.secondary", textTransform: 'capitalize' }}>
                {currentTime.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            </Stack>
          </Box>
          <Box component="img" src={drapeauRdc} sx={{ height: 45, borderRadius: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
        </Stack>
      </Box>

      {/* KPI SECTION */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
        <StatBox title="Présents" value={stats.presents} icon={<CheckCircleOutline />} color="#2e7d32" />
        <StatBox title="Retards" value={stats.retards} icon={<AccessTimeOutlined />} color={RDC_YELLOW} />
        <StatBox title="Absents" value={stats.absents} icon={<PersonOffOutlined />} color={RDC_RED} />
        <StatBox title="Taux de présence" value={stats.taux} icon={<HistoryToggleOffOutlined />} color={RDC_BLUE} />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
            <Box p={2} bgcolor="#fff" borderBottom="1px solid #eee" display="flex" justifyContent="space-between" alignItems="center">
               <Typography variant="body1" fontWeight={800}>Journal de l'Unité Biométrique</Typography>
               <Button onClick={() => setOpenScan(true)} size="small" variant="contained" sx={{ bgcolor: RDC_BLUE, fontWeight: 800 }}>
                 Nouveau Pointage
               </Button>
            </Box>
            <Box sx={{ height: 500 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                sx={{ border: "none", "& .MuiDataGrid-columnHeader": { bgcolor: "#f8f9fa" } }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: "16px", height: "100%", bgcolor: "#fff" }}>
            <Typography variant="h6" fontWeight={800} mb={3}>Analyse de Sécurité</Typography>
            
            <Stack spacing={4}>
                <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" fontWeight={800}>QUOTA SÉCURITÉ NORD</Typography>
                        <Typography variant="caption" fontWeight={800} color={alerteCritique ? RDC_RED : "success.main"}>
                            {stats.presents} AGENTS ACTIFS
                        </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(stats.presents * 20, 100)} sx={{ height: 10, borderRadius: 5, bgcolor: "#eee", "& .MuiLinearProgress-bar": { bgcolor: alerteCritique ? RDC_RED : RDC_BLUE } }} />
                </Box>

                <AnimatePresence>
                  {alerteCritique ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Box sx={{ 
                        p: 2.5, bgcolor: alpha(RDC_RED, 0.05), border: `2px dashed ${RDC_RED}`, borderRadius: "12px",
                        animation: "blink-red 2s infinite"
                      }}>
                        <Stack direction="row" spacing={1} mb={1}>
                          <WarningAmberOutlined sx={{ color: RDC_RED }} />
                          <Typography variant="subtitle2" fontWeight={900} color={RDC_RED}>ALERTE EFFECTIF CRITIQUE</Typography>
                        </Stack>
                        <Typography variant="body2" fontSize="0.8rem" fontWeight={600} color={RDC_RED}>
                          Le système a détecté un manque d'officiers. 
                          <strong> Les transferts de détenus doivent être suspendus.</strong>
                        </Typography>
                      </Box>
                    </motion.div>
                  ) : (
                    <Box sx={{ p: 2.5, bgcolor: alpha("#2e7d32", 0.05), border: `1px solid #2e7d32`, borderRadius: "12px" }}>
                       <Stack direction="row" spacing={1} mb={1}>
                          <CheckCircleOutline sx={{ color: "#2e7d32" }} />
                          <Typography variant="subtitle2" fontWeight={900} color="#2e7d32">SÉCURITÉ OPÉRATIONNELLE</Typography>
                        </Stack>
                        <Typography variant="body2" fontSize="0.8rem">Effectif suffisant pour les opérations.</Typography>
                    </Box>
                  )}
                </AnimatePresence>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* MODAL SCAN */}
      <Dialog open={openScan} onClose={() => !scanning && setOpenScan(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          {scanning ? (
            <Stack alignItems="center" spacing={3}>
              <CircularProgress size={60} sx={{ color: RDC_BLUE }} />
              <Typography variant="h6" fontWeight={800}>VÉRIFICATION BIOMÉTRIQUE...</Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={3}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(RDC_BLUE, 0.1), color: RDC_BLUE }}>
                <FingerprintOutlined sx={{ fontSize: 45 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={900}>SCANNER REQUIS</Typography>
                <Typography variant="body2" color="text.secondary">Placez l'index sur le terminal</Typography>
              </Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleSimulateScan}
                sx={{ bgcolor: "#1a1a1a", fontWeight: 800, py: 1.5 }}
              >
                Simuler Authentification
              </Button>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes blink-red {
            0% { border-color: ${RDC_RED}; }
            50% { border-color: transparent; }
            100% { border-color: ${RDC_RED}; }
          }
        `}
      </style>
    </Box>
  );
};

export default PresencePersonnel;