import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box, Grid, Paper, Typography, Card, CardContent, Stack, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Avatar, IconButton, useTheme, LinearProgress, alpha, Dialog, 
  DialogTitle, DialogContent, Divider, List, ListItem, ListItemText, 
  Slide, CircularProgress, Alert, Tooltip as MuiTooltip
} from "@mui/material";
import {
  WarningAmber, Security, PeopleAlt, NotificationsActive, 
  Refresh, Hub, Visibility, History, ErrorOutline, Close as CloseIcon,
  DeviceHub, Fingerprint, Terminal, Warning, Radar, AssignmentInd
} from "@mui/icons-material";
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from "recharts";


import api from "../../../api"; // ✅ API CENTRALISÉE
// --- CONFIGURATION ---
const API_BASE_URL = "/intelligence/dashboard/";
const API_IA_URL = "/dashboard/ia-avance/";

// Transition pour l'ouverture du modal
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const IntelligenceDashboard = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // --- PALETTE OFFICIELLE RDC & CYBER ---
  const RDC_COLORS = {
    blue: "#007FFF",      // Bleu ciel du drapeau
    yellow: "#F7D618",    // Jaune de l'étoile
    red: "#CE1021",       // Rouge de la bande
    darkBlue: "#004C99",  // Bleu profond pour les contrastes
    surface: isDarkMode ? "#0F172A" : "#F8FAFC",
    card: isDarkMode ? "#1E293B" : "#FFFFFF",
    text: isDarkMode ? "#F1F5F9" : "#0F172A",
    muted: isDarkMode ? "#94A3B8" : "#64748B",
    cyberBlack: "#050505", // Noir pur pour les terminaux IA
    neonRed: "#FF3366",    // Rouge néon pour les alertes IA
  };

  // --- ÉTATS DASHBOARD CLASSIQUE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalVisiteursJour: 0, alertesWatchlist: 0, visitesEnCours: 0 });
  const [fluxHebdo, setFluxHebdo] = useState([]);
  const [repartitionMotifs, setRepartitionMotifs] = useState([]);
  const [intelligenceData, setIntelligenceData] = useState([]);
  const [topCibles, setTopCibles] = useState([]);

  // --- ÉTATS IA AVANCÉE ---
  const [iaData, setIaData] = useState({
    score_visiteurs: [],
    faux_noms: [],
    anomalies: []
  });

  // --- ÉTATS MODAL ---
  const [selectedSujet, setSelectedSujet] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const handleOpenDetails = (sujet) => {
    setSelectedSujet(sujet);
    setOpenModal(true);
  };

  // --- LOGIQUE DE RÉCUPÉRATION DOUBLE API ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Promise.allSettled permet de ne pas tout crasher si l'API IA est down
      const [baseRes, iaRes] = await Promise.allSettled([
        api.get(API_BASE_URL),
        api.get(API_IA_URL)
      ]);

      // 1. Traitement API Base
      if (baseRes.status === "fulfilled") {
        const data = baseRes.value.data;
        setStats(data.stats || { totalVisiteursJour: 0, alertesWatchlist: 0, visitesEnCours: 0 });
        setFluxHebdo(data.fluxHebdo || []);
        setRepartitionMotifs(data.repartitionMotifs || []);
        setIntelligenceData(data.intelligenceData || []);
        setTopCibles(data.topCibles || []);
        setError(null);
      } else {
        throw new Error("Base API failed");
      }

      // 2. Traitement API IA Avancée
      if (iaRes.status === "fulfilled") {
        setIaData({
          score_visiteurs: iaRes.value.data.score_visiteurs || [],
          faux_noms: iaRes.value.data.faux_noms || [],
          anomalies: iaRes.value.data.anomalies || []
        });
      } else {
        console.warn("API IA indisponible, affichage des données de base uniquement.");
      }

    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Échec de la synchronisation avec le serveur central.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // 5 min
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // --- COMPOSANTS UI ---
  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card elevation={0} sx={{ 
      bgcolor: RDC_COLORS.card, 
      borderRadius: '24px', 
      border: `1px solid ${alpha(color, 0.2)}`,
      position: 'relative', overflow: 'hidden'
    }}>
      <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: alpha(color, 0.1) }} />
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: color, color: '#FFF', width: 52, height: 52, borderRadius: '16px', boxShadow: `0 8px 16px ${alpha(color, 0.4)}` }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ color: RDC_COLORS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ color: RDC_COLORS.text, fontWeight: 900 }}>{value}</Typography>
          </Box>
          {trend && (
            <Chip label={trend} size="small" sx={{ bgcolor: alpha(color, 0.1), color: color, fontWeight: 800 }} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  // --- ÉTAT DE CHARGEMENT ---
  if (loading && !stats.totalVisiteursJour) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: RDC_COLORS.surface }}>
        <CircularProgress sx={{ color: RDC_COLORS.blue, mb: 2 }} />
        <Typography variant="h6" sx={{ color: RDC_COLORS.text, fontWeight: 700 }}>DÉCRYPTAGE DES FLUX DRP & IA EN COURS...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", bgcolor: RDC_COLORS.surface }}>
      
      {/* --- HEADER --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Hub sx={{ color: RDC_COLORS.blue, fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, color: RDC_COLORS.text, display: 'flex', alignItems: 'center', gap: 1 }}>
               <span style={{ color: RDC_COLORS.blue }}>MINISTERE DE LA </span><span style={{ color: RDC_COLORS.yellow }}>JUSTICE </span> <span style={{ color: RDC_COLORS.red }}>ET GARDE DES SCEAUX</span>
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ color: RDC_COLORS.muted, fontWeight: 600 }}>
             Direction du Renseignement Pénitentiaire • Centre des Opérations
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          {error && <Alert severity="error" icon={<ErrorOutline />} sx={{ borderRadius: '12px', py: 0 }}>{error}</Alert>}
          <IconButton 
            onClick={fetchDashboardData} 
            disabled={loading}
            sx={{ bgcolor: RDC_COLORS.card, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <Refresh sx={{ color: RDC_COLORS.blue, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* --- LIGNE 1 : STATS GLOBALES --- */}
        <Grid item xs={12} md={4}>
          <StatCard title="Flux Visiteurs (24H)" value={stats.totalVisiteursJour} icon={<PeopleAlt />} color={RDC_COLORS.blue} trend="ACTIF" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Réseaux Suspects" value={stats.alertesWatchlist} icon={<WarningAmber />} color={RDC_COLORS.red} trend="ALERTE" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Usurpations IA (Faux Noms)" value={iaData.faux_noms.length} icon={<Fingerprint />} color={RDC_COLORS.neonRed} trend="CRITIQUE" />
        </Grid>

        {/* --- LIGNE 2 : GRAPHIQUES --- */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '28px', bgcolor: RDC_COLORS.card, border: `1px solid ${alpha(RDC_COLORS.blue, 0.1)}` }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 4, color: RDC_COLORS.text }}>Analyse du Flux Hebdomadaire</Typography>
            <Box sx={{ height: 350, width: '100%' }}>
              <ResponsiveContainer>
                <AreaChart data={fluxHebdo}>
                  <defs>
                    <linearGradient id="colorRdc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RDC_COLORS.blue} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={RDC_COLORS.blue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(RDC_COLORS.muted, 0.2)} />
                  <XAxis dataKey="jour" axisLine={false} tickLine={false} tick={{fill: RDC_COLORS.muted, fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: RDC_COLORS.muted, fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: RDC_COLORS.card, color: RDC_COLORS.text }} />
                  <Area type="monotone" dataKey="visiteurs" stroke={RDC_COLORS.blue} strokeWidth={4} fill="url(#colorRdc)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '28px', bgcolor: RDC_COLORS.card, border: `1px solid ${alpha(RDC_COLORS.blue, 0.1)}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: RDC_COLORS.text }}>Nature des Visites</Typography>
            <Box sx={{ height: 280, width: '100%', flexGrow: 1 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={repartitionMotifs} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {repartitionMotifs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[RDC_COLORS.blue, RDC_COLORS.yellow, RDC_COLORS.darkBlue, RDC_COLORS.red][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: RDC_COLORS.card, color: RDC_COLORS.text, borderRadius: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* --- LIGNE 3 : MATRICE LIVE & TOP CIBLES --- */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ borderRadius: '28px', bgcolor: RDC_COLORS.card, border: `1px solid ${alpha(RDC_COLORS.blue, 0.1)}`, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha(RDC_COLORS.blue, 0.05) }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: RDC_COLORS.darkBlue }}>Matrice d'Intelligence : Accès Live</Typography>
              <Chip icon={<NotificationsActive sx={{ color: '#FFF !important' }} />} label="SURVEILLANCE ACTIVE" sx={{ bgcolor: RDC_COLORS.red, color: '#FFF', fontWeight: 900 }} />
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(RDC_COLORS.muted, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Sujet (Visiteur)</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Détenu Cible</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Fréq. Cible</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Vol. Mois</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Risque</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {intelligenceData.length > 0 ? intelligenceData.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: row.alerte ? RDC_COLORS.red : RDC_COLORS.blue }}>{row.nom[0]}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.nom}</Typography>
                            <Typography variant="caption" sx={{ color: RDC_COLORS.muted }}>{row.type}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.detenu}</TableCell>
                      <TableCell>
                        <Chip label={`${row.frequenceDetenu}x`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(RDC_COLORS.blue, 0.1), color: RDC_COLORS.blue }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ fontWeight: 800, width: 20 }}>{row.nbVisitesCeMois}</Typography>
                          <LinearProgress variant="determinate" value={Math.min((row.nbVisitesCeMois / 15) * 100, 100)} sx={{ width: 40, height: 6, borderRadius: 3, bgcolor: alpha(RDC_COLORS.muted, 0.2), '& .MuiLinearProgress-bar': { bgcolor: row.nbVisitesCeMois > 10 ? RDC_COLORS.red : RDC_COLORS.blue } }} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDetails(row)} sx={{ color: RDC_COLORS.blue, bgcolor: alpha(RDC_COLORS.blue, 0.1) }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} align="center">Aucune donnée disponible.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: '28px', bgcolor: RDC_COLORS.card, border: `1px solid ${alpha(RDC_COLORS.red, 0.3)}`, height: '100%', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', bgcolor: RDC_COLORS.red }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: RDC_COLORS.red, mb: 1 }}>TOP CIBLES SURVEILLÉES</Typography>
            <Stack spacing={2} mt={3}>
               {topCibles.map((cible, i) => (
                 <Box key={i} sx={{ p: 2, bgcolor: alpha(RDC_COLORS.muted, 0.05), borderRadius: 3, border: `1px solid ${alpha(RDC_COLORS.muted, 0.1)}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{cible.matricule}</Typography>
                        <Typography variant="caption" sx={{ color: RDC_COLORS.muted }}>{cible.pavillon}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: RDC_COLORS.blue }}>{cible.visites}</Typography>
                      </Box>
                    </Stack>
                 </Box>
               ))}
            </Stack>
          </Paper>
        </Grid>

        {/* ===================================================================== */}
        {/* === NOUVELLE SECTION : MODULE INTELLIGENCE ARTIFICIELLE (ANR/DRP) === */}
        {/* ===================================================================== */}
        
        <Grid item xs={12}>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, mb: 2 }}>
             <Radar sx={{ color: RDC_COLORS.neonRed, fontSize: 32, animation: 'pulse 2s infinite' }} />
             <Typography variant="h5" sx={{ fontWeight: 900, color: RDC_COLORS.text, letterSpacing: '2px' }}>
               MODULE I.A. TACTIQUE : SURVEILLANCE & CROISEMENT DE DONNÉES
             </Typography>
             <Box sx={{ flexGrow: 1, height: '1px', bgcolor: alpha(RDC_COLORS.neonRed, 0.3) }} />
           </Box>
        </Grid>

        {/* -- CROSS MATCHING FAUX NOMS -- */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ borderRadius: '24px', bgcolor: RDC_COLORS.card, border: `1px solid ${RDC_COLORS.neonRed}`, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ p: 2, bgcolor: alpha(RDC_COLORS.neonRed, 0.1), display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeviceHub sx={{ color: RDC_COLORS.neonRed }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: RDC_COLORS.neonRed }}>DÉTECTION D'IDENTITÉS MULTIPLES (USURPATION)</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: RDC_COLORS.card, fontWeight: 800 }}>PIÈCE D'IDENTITÉ</TableCell>
                    <TableCell sx={{ bgcolor: RDC_COLORS.card, fontWeight: 800 }} align="center">NOMS ASSOCIÉS</TableCell>
                    <TableCell sx={{ bgcolor: RDC_COLORS.card, fontWeight: 800 }} align="center">VISITES TOTALES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {iaData.faux_noms.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontFamily: 'monospace', color: RDC_COLORS.blue, fontWeight: 'bold' }}>
                        <AssignmentInd sx={{ fontSize: '14px', mr: 1, verticalAlign: 'middle' }} />
                        {row.piece_identite_numero}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${row.noms_differents} ALIAS`} size="small" sx={{ bgcolor: RDC_COLORS.neonRed, color: 'white', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>{row.total_visites}</TableCell>
                    </TableRow>
                  ))}
                  {iaData.faux_noms.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3 }}>Aucune usurpation détectée.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* -- SCORING DES VISITEURS -- */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={0} sx={{ borderRadius: '24px', p: 3, bgcolor: RDC_COLORS.card, border: `1px solid ${alpha(RDC_COLORS.muted, 0.2)}`, height: '100%', overflowY: 'auto', maxHeight: 365 }}>
             <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: RDC_COLORS.darkBlue }} /> PROFILAGE DES CIBLES À HAUT RISQUE (SCORING)
             </Typography>
             <Stack spacing={2}>
               {iaData.score_visiteurs.sort((a,b) => b.score - a.score).slice(0, 5).map((v, i) => (
                 <Box key={i} sx={{ p: 2, borderRadius: 2, border: `1px solid ${v.score > 30 ? alpha(RDC_COLORS.neonRed, 0.4) : alpha(RDC_COLORS.blue, 0.2)}`, bgcolor: v.score > 30 ? alpha(RDC_COLORS.neonRed, 0.05) : 'transparent' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontFamily: 'monospace' }}>TÉL: {v.telephone}</Typography>
                        <Typography variant="caption" sx={{ color: RDC_COLORS.muted }}>ID: {v.piece_identite_numero.substring(0, 15)}...</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip label={`SCORE IA: ${v.score}`} size="small" sx={{ fontWeight: 900, bgcolor: v.score > 30 ? RDC_COLORS.neonRed : RDC_COLORS.blue, color: 'white' }} />
                        <Typography variant="caption" display="block" mt={0.5}>{v.alerte_count} Alertes antérieures</Typography>
                      </Box>
                    </Stack>
                 </Box>
               ))}
             </Stack>
          </Paper>
        </Grid>

        {/* -- TERMINAL DES ANOMALIES COMPORTEMENTALES -- */}
        <Grid item xs={12}>
          <Box sx={{ 
            bgcolor: RDC_COLORS.cyberBlack, 
            borderRadius: '16px', 
            border: `1px solid ${RDC_COLORS.neonRed}`, 
            p: 3, 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 0 20px ${alpha(RDC_COLORS.neonRed, 0.2)}`
          }}>
             <Typography variant="subtitle1" sx={{ fontWeight: 900, color: RDC_COLORS.neonRed, mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace' }}>
               <Terminal /> TERMINAL LOGS : ANOMALIES COMPORTEMENTALES (OUTLIERS)
             </Typography>
             
             <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: RDC_COLORS.neonRed, borderRadius: '10px' } }}>
               {iaData.anomalies.map((anom, i) => (
                 <Box key={i} sx={{ 
                   minWidth: 320, p: 2, 
                   bgcolor: alpha(RDC_COLORS.neonRed, 0.05), 
                   border: `1px solid ${alpha(RDC_COLORS.neonRed, 0.3)}`, 
                   borderRadius: '8px', 
                   fontFamily: 'monospace' 
                 }}>
                   <Typography sx={{ color: '#FFF', fontWeight: 'bold' }}>&gt; ALERT_TYPE: FREQUENTATION_ANORMALE</Typography>
                   <Typography sx={{ color: RDC_COLORS.muted, fontSize: '13px', mt: 1 }}>SOURCE_TEL: <span style={{color: RDC_COLORS.blue}}>{anom.telephone}</span></Typography>
                   <Typography sx={{ color: RDC_COLORS.muted, fontSize: '13px' }}>TIMESTAMP: {new Date(anom.heure_entree).toLocaleString()}</Typography>
                   <Typography sx={{ color: RDC_COLORS.muted, fontSize: '13px' }}>ANOMALY_SCORE: <span style={{color: RDC_COLORS.neonRed}}>{anom.anomaly}</span></Typography>
                   <Typography sx={{ color: '#4ADE80', fontSize: '11px', mt: 1 }}>// Visite détectée en dehors des patterns horaires habituels.</Typography>
                 </Box>
               ))}
               {iaData.anomalies.length === 0 && (
                 <Typography sx={{ color: '#4ADE80', fontFamily: 'monospace' }}>&gt; SYSTEM_IDLE: Aucune anomalie détectée dans les dernières 24H.</Typography>
               )}
             </Stack>
             
             <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
               <Typography variant="caption" sx={{ color: RDC_COLORS.neonRed, animation: 'pulse 1.5s infinite', fontWeight: 'bold' }}>● LIVE SCAN</Typography>
             </Box>
          </Box>
        </Grid>

      </Grid>
      
      {/* --- ANIMATIONS CSS --- */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* --- MODAL DE PROFIL (INCHANGÉ) --- */}
      <Dialog
        open={openModal}
        TransitionComponent={Transition}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '28px', bgcolor: RDC_COLORS.card, position: 'relative' } }}
      >
        {selectedSujet && (
          <>
            <IconButton
              onClick={() => setOpenModal(false)}
              sx={{ position: 'absolute', right: 16, top: 16, color: RDC_COLORS.muted, '&:hover': { color: RDC_COLORS.red, bgcolor: alpha(RDC_COLORS.red, 0.1) } }}
            >
              <CloseIcon />
            </IconButton>

            <DialogTitle sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h5" component="div" sx={{ fontWeight: 900, color: RDC_COLORS.text }}>
                  Fiche de Renseignement : {selectedSujet.nom}
                </Typography>
                <Chip label={selectedSujet.risque} color={selectedSujet.risque === 'CRITIQUE' ? "error" : "primary"} sx={{ fontWeight: 900 }} />
              </Stack>
            </DialogTitle>
            
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={selectedSujet.photo_url || "/placeholder_agent.png"}
                      sx={{ width: '100%', height: 320, borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: `4px solid ${selectedSujet.alerte ? RDC_COLORS.red : RDC_COLORS.blue}` }}
                      variant="rounded"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: RDC_COLORS.muted }}>DOC. IDENTITÉ / MATRICULE</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedSujet.id_document || "NON RENSEIGNÉ"}</Typography>
                    </Box>
                    <Divider />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: RDC_COLORS.darkBlue }}>Historique des activités (Réel)</Typography>
                    
                    <List sx={{ bgcolor: alpha(RDC_COLORS.surface, 0.5), borderRadius: '16px', maxHeight: 300, overflow: 'auto' }}>
                      {selectedSujet.historique && selectedSujet.historique.length > 0 ? (
                        selectedSujet.historique.map((visite, index) => (
                          <ListItem key={index} divider={index !== selectedSujet.historique.length - 1}>
                            <History sx={{ mr: 2, color: RDC_COLORS.blue }} />
                            <ListItemText 
                              primary={`Visite à : ${visite.detenu}`}
                              secondary={`${visite.date} • Motif: ${visite.motif}`}
                              primaryTypographyProps={{ fontWeight: 700 }}
                            />
                            <Chip label={visite.statut} size="small" variant="outlined" color={visite.statut === "En cours" ? "warning" : "success"} />
                          </ListItem>
                        ))
                      ) : (
                        <Typography sx={{ p: 3, textAlign: 'center', color: RDC_COLORS.muted }}>Aucun historique disponible pour ce sujet.</Typography>
                      )}
                    </List>

                    <Box sx={{ p: 2, bgcolor: alpha(RDC_COLORS.red, 0.05), borderRadius: '12px', border: `1px dashed ${RDC_COLORS.red}` }}>
                      <Typography variant="caption" sx={{ color: RDC_COLORS.red, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmber fontSize="small" /> 
                        ANALYSE DRP : Sujet identifié comme {selectedSujet.type}. Fréquence cible : {selectedSujet.frequenceDetenu} fois/mois.
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default IntelligenceDashboard;