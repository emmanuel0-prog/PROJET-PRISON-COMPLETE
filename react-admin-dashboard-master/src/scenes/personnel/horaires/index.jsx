import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Typography, useTheme, alpha, Button, Grid, Paper, Stack, 
  IconButton, Divider, LinearProgress, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Avatar, Autocomplete, Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  SecurityOutlined, Fingerprint, Sync, CheckCircle, Cancel, 
  LocalPolice, WarningAmber, FileDownload, Today, EventNote, Print,
  Radar, Shield
} from "@mui/icons-material";
import axios from "axios";

// Bibliothèques d'export
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../../../api"; // Import de l'instance axios préconfigurée

// ASSETS NATIONAUX
import sceauRdc from "../../../assets/gouvernement rdc.png"; 
import drapeauRdc from "../../../assets/rdc.png";


// --- COULEURS OFFICIELLES ---
const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";

// --- COMPOSANT : CARTE TACTIQUE AMÉLIORÉE ---
const TacticalCard = ({ label, value, color, icon: Icon, subText }) => {
  const theme = useTheme();
  return (
    <Paper sx={{ 
      p: 2, borderRadius: "16px", 
      border: `1px solid ${alpha(color, 0.3)}`,
      background: theme.palette.mode === 'dark' 
        ? `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.15)} 100%)`
        : `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(color, 0.08)} 100%)`,
      flex: 1, minWidth: "150px",
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 20px ${alpha(color, 0.2)}` }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box sx={{ zIndex: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, letterSpacing: 1 }}>{label}</Typography>
          <Typography variant="h4" sx={{ color: color, fontWeight: 900, my: 0.5 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Radar sx={{ fontSize: 12 }} /> {subText}
          </Typography>
        </Box>
        <Icon sx={{ fontSize: 50, color: alpha(color, 0.15), position: 'absolute', right: -5, bottom: -5 }} />
      </Box>
    </Paper>
  );
};

const HorairesConges = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // États
  const [absences, setAbsences] = useState([]);
  const [plannings, setPlannings] = useState([]);
  const [agents, setAgents] = useState([]);
  const [shiftStats, setShiftStats] = useState({ matin: {taux:0}, apres_midi: {taux:0}, nuit: {taux:0} });
  const [loading, setLoading] = useState(true);
  const [filterToday, setFilterToday] = useState(false);
  
  const [scanMatricule, setScanMatricule] = useState("");
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({ 
    agent_matricule: "", date: new Date().toISOString().split('T')[0], 
    vacation: "MATIN", secteur_affecte: "" 
  });

  // --- CHARGEMENT ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAbs, resStats, resAgents, resPlan] = await Promise.all([
        api.get("/absences/"),
        api.get("/plannings/statistiques_shifts/"),
        api.get("/agents/"),
        api.get("/plannings/")
      ]);
      setAbsences(resAbs.data);
      setShiftStats(resStats.data);
      setAgents(resAgents.data);
      setPlannings(resPlan.data);
    } catch (err) { console.error("Erreur Backend", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE FILTRE AUJOURD'HUI ---
  const planningsAffiches = useMemo(() => {
    if (!filterToday) return plannings;
    const today = new Date().toISOString().split('T')[0];
    return plannings.filter(p => p.date === today);
  }, [plannings, filterToday]);

  // --- FONCTIONS EXPORT ---
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(planningsAffiches);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `SNGD_Planning_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("S.N.G.D. - ORDRE DE GARDE OFFICIEL", 14, 22);
    doc.setFontSize(11);
    doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 30);
    const tableColumn = ["Officier", "Date", "Vacation", "Secteur", "Statut"];
    const tableRows = planningsAffiches.map(p => [
      p.agent_nom_complet, p.date, p.vacation, p.secteur_affecte, p.est_present ? "PRESENT" : "ATTENDU"
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 35, theme: 'grid' });
    doc.save("Ordre_de_Garde.pdf");
  };

  // --- ACTIONS ---
  const handleQuickPointage = async () => {
    if (!scanMatricule) return;
    try {
      await api.post("/pointages/scanner/", { matricule: scanMatricule });
      setScanMatricule("");
      fetchData();
    } catch (err) { alert(err.response?.data?.error || "Erreur de scan"); }
  };

  const handleDecisionAbsence = async (id, decision) => {
    try {
      await api.patch(`/absences/${id}/changer_statut/`, { statut: decision });
      fetchData();
    } catch (err) { alert("Erreur"); }
  };

  const handleAffecterGarde = async () => {
    try {
      await api.post("/plannings/", shiftForm);
      setOpenShiftModal(false);
      fetchData();
    } catch (err) { alert("Erreur d'affectation : Conflit de planning ou ID invalide."); }
  };

  // --- STYLES COMMUNS ---
  const glassPaper = {
    borderRadius: "20px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    overflow: "hidden",
    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
  };

  const gridStyle = {
    border: 'none',
    '& .MuiDataGrid-columnHeaders': {
      bgcolor: isDark ? alpha(theme.palette.primary.main, 0.05) : "#F8FAFC",
      fontWeight: 900,
      borderBottom: `2px solid ${theme.palette.divider}`
    },
    '& .MuiDataGrid-cell': { borderBottom: `1px solid ${theme.palette.divider}` },
    '& .MuiDataGrid-row:hover': { bgcolor: alpha(RDC_BLUE, 0.04) }
  };

  // --- COLONNES ---
  const columnsAbsence = [
    { field: "agent_nom_complet", headerName: "OFFICIER", flex: 1, renderCell: (p) => (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ width: 30, height: 30, bgcolor: RDC_BLUE, fontSize: 12, fontWeight: 900 }}>{p.value?.charAt(0)}</Avatar>
        <Typography variant="body2" fontWeight={700}>{p.value}</Typography>
      </Stack>
    )},
    { field: "type_absence", headerName: "MOTIF", width: 150, renderCell: (p) => (
        <Typography variant="caption" fontWeight={800} sx={{ color: "text.secondary" }}>{p.value}</Typography>
    )},
    { field: "statut", headerName: "STATUT", width: 130, renderCell: (p) => (
        <Chip 
            label={p.value} 
            size="small" 
            sx={{ 
                fontWeight: 900, fontSize: '0.65rem',
                bgcolor: p.value === "APPROUVÉ" ? alpha("#4CAF50", 0.1) : alpha(RDC_YELLOW, 0.1),
                color: p.value === "APPROUVÉ" ? "#4CAF50" : RDC_YELLOW,
                border: `1px solid ${p.value === "APPROUVÉ" ? "#4CAF50" : RDC_YELLOW}`
            }} 
        />
    )},
    { field: "actions", headerName: "DÉCISION", width: 100, sortable: false, renderCell: (p) => (
      p.row.statut === "EN_ATTENTE" && (
        <Stack direction="row" spacing={1}>
          <IconButton size="small" sx={{ color: "#4CAF50", bgcolor: alpha("#4CAF50", 0.1) }} onClick={() => handleDecisionAbsence(p.row.id, "APPROUVÉ")}><CheckCircle fontSize="small" /></IconButton>
          <IconButton size="small" sx={{ color: RDC_RED, bgcolor: alpha(RDC_RED, 0.1) }} onClick={() => handleDecisionAbsence(p.row.id, "REFUSÉ")}><Cancel fontSize="small" /></IconButton>
        </Stack>
      )
    )}
  ];

  const columnsPlanning = [
    { field: "agent_nom_complet", headerName: "OFFICIER", flex: 1, renderCell: (p) => <Typography variant="body2" fontWeight={700}>{p.value}</Typography> },
    { field: "vacation", headerName: "VACATION", width: 130, renderCell: (p) => (
        <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 800, borderColor: theme.palette.divider }} />
    )},
    { field: "secteur_affecte", headerName: "POSTE DE GARDE", flex: 1, renderCell: (p) => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Shield sx={{ fontSize: 14, color: RDC_BLUE }} />
            <Typography variant="caption" fontWeight={700}>{p.value}</Typography>
        </Stack>
    )},
    { field: "est_present", headerName: "POINTAGE", width: 120, renderCell: (p) => (
      <Chip 
        label={p.value ? "PRÉSENT" : "ATTENDU"} 
        color={p.value ? "success" : "default"} 
        variant={p.value ? "filled" : "outlined"} 
        size="small" 
        sx={{ fontWeight: 900, fontSize: '0.65rem' }}
        icon={p.value ? <CheckCircle /> : <Radar />}
      />
    )}
  ];

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: theme.palette.background.default, 
      minHeight: "100vh",
      backgroundImage: isDark 
        ? `linear-gradient(${alpha('#fff', 0.02)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#fff', 0.02)} 1px, transparent 1px)` 
        : `linear-gradient(${alpha('#000', 0.02)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#000', 0.02)} 1px, transparent 1px)`,
      backgroundSize: '40px 40px'
    }}>
      
      {/* HEADER OFFICIEL GOUV */}
      <Paper sx={{ ...glassPaper, p: 2, mb: 4, borderTop: `4px solid ${RDC_BLUE}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
            <img src={sceauRdc} alt="Sceau" style={{ height: 60, filter: isDark ? 'drop-shadow(0 0 10px rgba(255,255,255,0.2))' : 'none' }} />
            <Box>
                <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, color: isDark ? "#fff" : "#1A2027" }}>
                    S.N.G.D. <span style={{ color: RDC_BLUE }}>| GESTION TACTIQUE</span>
                </Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: "text.secondary", letterSpacing: 1.5 }}>
                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                </Typography>
            </Box>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                    variant="contained" 
                    startIcon={<LocalPolice />} 
                    onClick={() => setOpenShiftModal(true)} 
                    sx={{ bgcolor: RDC_BLUE, fontWeight: 900, borderRadius: "10px", '&:hover': { bgcolor: alpha(RDC_BLUE, 0.8) } }}
                >
                    Affecter Garde
                </Button>
                <Divider orientation="vertical" flexItem />
                <img src={drapeauRdc} alt="RDC" style={{ width: 35, borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
            </Stack>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* SIDEBAR : CONTROLE TACTIQUE */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* SCANNER BIOMÉTRIQUE - LOOK DARK TECH */}
            <Paper sx={{ 
                p: 3, 
                bgcolor: "#0F172A", 
                color: "#fff", 
                borderRadius: "20px",
                border: `2px solid ${alpha(RDC_YELLOW, 0.3)}`,
                position: 'relative', overflow: 'hidden'
            }}>
              <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, bgcolor: alpha(RDC_YELLOW, 0.1), borderRadius: '0 0 0 12px' }}>
                <Radar sx={{ fontSize: 16, color: RDC_YELLOW, animation: 'spin 4s linear infinite' }} />
              </Box>
              <Typography variant="body2" sx={{ color: RDC_YELLOW, mb: 2, fontWeight: 900, letterSpacing: 1.5 }}>POINTAGE BIOMÉTRIQUE</Typography>
              <TextField 
                fullWidth placeholder="SCANNER MATRICULE..." value={scanMatricule}
                onChange={(e) => setScanMatricule(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickPointage()}
                InputProps={{ 
                    startAdornment: <Fingerprint sx={{ mr: 1, color: RDC_YELLOW }} />,
                    style: { color: "#fff", fontWeight: 900, fontFamily: 'monospace', letterSpacing: 2 } 
                }}
                sx={{ 
                    bgcolor: alpha("#fff", 0.05), 
                    borderRadius: "12px",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.2) },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: RDC_YELLOW }
                }}
              />
              <Typography variant="caption" sx={{ mt: 1.5, display: 'block', opacity: 0.6, fontSize: '0.65rem' }}>
                Système d'authentification centralisé v2.4 - Chiffrement AES-256 actif.
              </Typography>
            </Paper>

            {/* STATS SHIFTS - VISUALISATION */}
            <Paper sx={{ ...glassPaper, p: 3 }}>
                <Typography variant="subtitle2" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1}>
                    <SecurityOutlined sx={{ color: RDC_BLUE }} /> COUVERTURE OPÉRATIONNELLE
                </Typography>
                {Object.entries(shiftStats).map(([key, data]) => (
                    <Box key={key} mb={2.5}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" fontWeight={900} sx={{ opacity: 0.8 }}>{key.replace('_', ' ').toUpperCase()}</Typography>
                            <Typography variant="caption" fontWeight={900} color={RDC_BLUE}>{data.taux}%</Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={data.taux} 
                            sx={{ 
                                height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.5),
                                "& .MuiLinearProgress-bar": { bgcolor: data.taux < 50 ? RDC_RED : RDC_BLUE, borderRadius: 4 }
                            }} 
                        />
                    </Box>
                ))}
            </Paper>

            <Stack direction="row" spacing={2}>
                <TacticalCard label="Congés" value={absences.filter(a=>a.statut==="APPROUVÉ").length} color={RDC_BLUE} icon={EventNote} subText="Approuvés" />
                <TacticalCard label="Alertes" value={absences.filter(a=>a.statut==="EN_ATTENTE").length} color={RDC_RED} icon={WarningAmber} subText="En attente" />
            </Stack>
          </Stack>
        </Grid>

        {/* REGISTRES - CENTRAL DATA */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            
            {/* TABLEAU 1 : PLANNING TACTIQUE */}
            <Paper sx={glassPaper}>
              <Box p={2.5} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" fontWeight={900} sx={{ letterSpacing: -0.5 }}>ORDRE DE GARDE</Typography>
                    <Button 
                        size="small" 
                        variant={filterToday ? "contained" : "outlined"}
                        startIcon={<Today />}
                        onClick={() => setFilterToday(!filterToday)}
                        sx={{ 
                            borderRadius: "10px", fontWeight: 800, textTransform: 'none',
                            bgcolor: filterToday ? RDC_BLUE : 'transparent',
                            borderColor: filterToday ? RDC_BLUE : theme.palette.divider
                        }}
                    >
                        Aujourd'hui
                    </Button>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Imprimer Ordre de Mission"><IconButton onClick={exportPDF} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }} color="primary"><Print fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Export Système Excel"><IconButton onClick={exportExcel} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }} color="success"><FileDownload fontSize="small" /></IconButton></Tooltip>
                    <IconButton onClick={fetchData} size="small" sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}><Sync fontSize="small" /></IconButton>
                </Stack>
              </Box>
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid rows={planningsAffiches} columns={columnsPlanning} loading={loading} sx={gridStyle} density="compact" />
              </Box>
            </Paper>

            {/* TABLEAU 2 : ABSENCES */}
            <Paper sx={glassPaper}>
              <Box p={2.5} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={900}>MOUVEMENTS & CONGÉS UNITAIRES</Typography>
              </Box>
              <Box sx={{ height: 350, width: '100%' }}>
                <DataGrid rows={absences} columns={columnsAbsence} loading={loading} sx={gridStyle} />
              </Box>
            </Paper>

          </Stack>
        </Grid>
      </Grid>

      {/* MODAL AFFECTATION TACTIQUE */}
      <Dialog 
        open={openShiftModal} 
        onClose={() => setOpenShiftModal(false)} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px', border: `1px solid ${RDC_BLUE}`, backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, textAlign: "center", borderBottom: `1px solid ${theme.palette.divider}`, mb: 1 }}>
            DÉPLOIEMENT OPÉRATIONNEL
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Autocomplete
                options={agents}
                getOptionLabel={(o) => `[${o.matricule}] ${o.nom} ${o.postnom}`}
                onChange={(e, v) => setShiftForm({...shiftForm, agent_matricule: v ? v.matricule : ""})}
                renderInput={(p) => <TextField {...p} label="Sélectionner Officier" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />}
            />
            <TextField type="date" label="Date de Mission" fullWidth InputLabelProps={{shrink:true}} value={shiftForm.date} onChange={(e)=>setShiftForm({...shiftForm, date:e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <TextField select label="Vacation (Shift)" fullWidth value={shiftForm.vacation} onChange={(e)=>setShiftForm({...shiftForm, vacation:e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                <MenuItem value="MATIN">MATIN (06:00 - 14:00)</MenuItem>
                <MenuItem value="APRES_MIDI">APRÈS-MIDI (14:00 - 22:00)</MenuItem>
                <MenuItem value="NUIT">NUIT (22:00 - 06:00)</MenuItem>
            </TextField>
            <TextField label="Poste de Garde / Secteur" placeholder="Ex: MIRADOR SUD" fullWidth value={shiftForm.secteur_affecte} onChange={(e)=>setShiftForm({...shiftForm, secteur_affecte:e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button variant="outlined" onClick={() => setOpenShiftModal(false)} sx={{ borderRadius: '10px', fontWeight: 800 }}>ANNULER</Button>
          <Button variant="contained" fullWidth onClick={handleAffecterGarde} sx={{ bgcolor: RDC_BLUE, fontWeight: 900, borderRadius: '10px', py: 1.5 }}>
            CONFIRMER LE DÉPLOIEMENT
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}
      </style>
    </Box>
  );
};

export default HorairesConges;