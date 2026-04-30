import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { 
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper, 
  IconButton, Avatar, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tooltip, Divider, 
  CircularProgress, InputAdornment, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Chip
} from "@mui/material";
import { DataGrid, frFR } from "@mui/x-data-grid";
import { 
  SearchOutlined, PrintOutlined, LocalHospitalOutlined, 
  HistoryOutlined, MedicationOutlined, EventNoteOutlined, 
  HealthAndSafetyOutlined, AssignmentIndOutlined, Close,
  SaveOutlined, DeleteOutline, Inventory2Outlined
} from "@mui/icons-material";

// Couleurs Institutionnelles RDC
const RDC_BLUE = "#007FFF";
const RDC_RED = "#CE1021";
const RDC_YELLOW = "#F7D618";

const SuiviMedical = () => {
  const theme = useTheme();
  const bc = theme.palette.mode === "dark" ? "#fff" : "#000";
  const paperBg = theme.palette.background.paper;

  // --- ÉTATS ---
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, traites: 0, percent: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [openUrgence, setOpenUrgence] = useState(false);
  const [openDossier, setOpenDossier] = useState(false);
  
  // Patient & Historique
  const [patientInfo, setPatientInfo] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  
  // Prescription & Stock
  const [stock, setStock] = useState([]);
  const [prescriptionForm, setPrescriptionForm] = useState({ medicament: "", quantite: 1 });

  // Recherche Détenus
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [formData, setFormData] = useState({ motif: "", priorite: "NORMALE", observations: "", prescription: "" });

  // --- CHARGEMENT DONNÉES ---
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRows, resStats, resStock] = await Promise.all([
        axios.get("http://localhost:8000/api/consultations/"),
        axios.get("http://localhost:8000/api/medical-stats/"),
        axios.get("http://localhost:8000/api/stock-medicaments/")
      ]);
      setRows(resRows.data);
      setStats({
        total: resStats.data.total_jour,
        traites: resStats.data.traites_jour,
        percent: resStats.data.pourcentage
      });
      setStock(resStock.data);
    } catch (err) { console.error("Erreur Sync:", err); }
    setLoading(false);
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // --- GESTION DOSSIER ET HISTORIQUE ---
  const handleOpenDossier = async (consultation) => {
    setPatientInfo(consultation);
    setOpenDossier(true);
    setLoadingHist(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/medical/historique/${consultation.detenu}/`);
      setHistorique(res.data);
    } catch (e) { setHistorique([]); }
    setLoadingHist(false);
  };

  const handleAddPrescription = async (consultationId) => {
    try {
      await axios.post("http://localhost:8000/api/prescrire/", {
        consultation: consultationId,
        medicament: prescriptionForm.medicament,
        quantite: prescriptionForm.quantite
      });
      // Refresh local
      handleOpenDossier(patientInfo);
      loadInitialData();
      alert("Traitement ajouté au dossier.");
    } catch (e) { alert(e.response?.data?.error || "Erreur stock"); }
  };

  // --- COLONNES DATAGRID ---
  const columns = [
    { field: "date_creation", headerName: "FLUX", width: 130, renderCell: (p) => (
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 900, display: 'block' }}>
          {dayjs(p.value).format("DD/MM HH:mm")}
        </Typography>
        {dayjs(p.value).isSame(dayjs(), 'day') && (
          <Chip label="JOUR" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: RDC_BLUE, color: '#fff', borderRadius: 0 }} />
        )}
      </Box>
    )},
    { field: "nom", headerName: "PATIENT", flex: 1, renderCell: (p) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: bc, color: paperBg, borderRadius: 0 }}>
          {p.row.nom?.[0]}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={800}>{p.row.nom} {p.row.prenom}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>{p.row.matricule}</Typography>
        </Box>
      </Stack>
    )},
    { field: "priorite", headerName: "TRIAGE", width: 120, renderCell: (p) => (
      <Chip 
        label={p.value} 
        variant="outlined"
        size="small"
        sx={{ 
          borderRadius: 0, 
          fontWeight: 900, 
          borderColor: p.value === "URGENT" ? RDC_RED : bc,
          color: p.value === "URGENT" ? RDC_RED : bc
        }} 
      />
    )},
    { field: "statut", headerName: "STATUT", width: 150, renderCell: (p) => (
      <TextField
        select
        size="small"
        value={p.value}
        onChange={(e) => axios.post(`http://localhost:8000/api/consultations/${p.row.id}/update-status/`, {statut: e.target.value}).then(loadInitialData)}
        variant="standard"
        InputProps={{ disableUnderline: true, sx: { fontSize: '0.75rem', fontWeight: 800 } }}
      >
        <MenuItem value="EN ATTENTE">⏳ ATTENTE</MenuItem>
        <MenuItem value="EN EXAMEN">🩺 EXAMEN</MenuItem>
        <MenuItem value="TRAITÉ">✅ TRAITÉ</MenuItem>
      </TextField>
    )},
    { field: "actions", headerName: "OPTIONS", width: 100, renderCell: (p) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton onClick={() => handleOpenDossier(p.row)} size="small" sx={{ border: `1px solid ${alpha(bc, 0.1)}`, borderRadius: 0 }}>
          <AssignmentIndOutlined fontSize="small" color="primary" />
        </IconButton>
        <IconButton size="small" sx={{ border: `1px solid ${alpha(bc, 0.1)}`, borderRadius: 0 }}>
          <PrintOutlined fontSize="small" />
        </IconButton>
      </Stack>
    )}
  ];

  return (
    <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh" }}>
      
      {/* HEADER TECHNIQUE */}
      <Box sx={{ mb: 4, pb: 2, borderBottom: `4px solid ${bc}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <HealthAndSafetyOutlined sx={{ fontSize: 40, color: RDC_BLUE }} />
            <Typography variant="h3" fontWeight={1000} sx={{ letterSpacing: "-2px", textTransform: "uppercase" }}>
              Medical <span style={{ color: RDC_BLUE }}>OS</span> <span style={{ fontSize: '1rem', opacity: 0.4 }}>v2.6</span>
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, letterSpacing: 3 }}>
            SYSTÈME DE SURVEILLANCE SANITAIRE PÉNITENTIAIRE | RDC
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
           <Button onClick={() => setOpenUrgence(true)} variant="contained" startIcon={<LocalHospitalOutlined />} sx={{ borderRadius: 0, bgcolor: RDC_RED, fontWeight: 900 }}>
             NOUVELLE ADMISSION
           </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* DASHBOARD GAUCHE */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, border: `2px solid ${bc}`, position: 'relative', overflow: 'hidden' }}>
              <Typography variant="overline" fontWeight={900}>Flux Journalier</Typography>
              <Typography variant="h2" fontWeight={1000}>{stats.traites}<span style={{fontSize: '1.5rem', opacity: 0.3}}>/ {stats.total}</span></Typography>
              <LinearProgress variant="determinate" value={stats.percent} sx={{ height: 8, mt: 1, borderRadius: 0, bgcolor: alpha(bc, 0.1), "& .MuiLinearProgress-bar": { bgcolor: RDC_BLUE } }} />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 0, border: `1px solid ${alpha(bc, 0.2)}` }}>
              <Typography variant="subtitle2" fontWeight={900} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory2Outlined fontSize="small" /> STOCK CRITIQUE
              </Typography>
              <List dense>
                {stock.filter(s => s.quantite < 10).map((s, i) => (
                  <ListItem key={i} sx={{ px: 0, borderBottom: `1px dashed ${alpha(bc, 0.1)}` }}>
                    <ListItemText primary={s.nom} primaryTypographyProps={{ variant: 'caption', fontWeight: 700 }} />
                    <Typography variant="caption" color="error" fontWeight={900}>{s.quantite}u</Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Stack>
        </Grid>

        {/* LISTE PRINCIPALE */}
        <Grid item xs={12} lg={9}>
          <Paper variant="outlined" sx={{ borderRadius: 0, border: `2px solid ${bc}`, height: 600 }}>
            <DataGrid 
              rows={rows} 
              columns={columns} 
              loading={loading} 
              sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(bc, 0.05), borderRadius: 0 } }} 
              localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* =========================================================
          MODAL DOSSIER MÉDICAL (LE CŒUR DU MODULE)
          ========================================================= */}
      <Dialog open={openDossier} onClose={() => setOpenDossier(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 0, border: `4px solid ${bc}` } }}>
        <DialogTitle sx={{ bgcolor: bc, color: paperBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <AssignmentIndOutlined />
            <Typography variant="h6" fontWeight={900}>DOSSIER MÉDICAL : {patientInfo?.nom}</Typography>
          </Stack>
          <IconButton onClick={() => setOpenDossier(false)} sx={{ color: paperBg }}><Close /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 500 }}>
            {/* Sidebar Historique */}
            <Grid item xs={12} md={4} sx={{ borderRight: `1px solid ${alpha(bc, 0.1)}`, bgcolor: alpha(bc, 0.02) }}>
              <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(bc, 0.1)}` }}>
                <Typography variant="overline" fontWeight={900}>Antécédents & Visites</Typography>
              </Box>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {loadingHist ? <CircularProgress size={20} sx={{ m: 2 }} /> : historique.map((h, i) => (
                  <ListItem key={i} button sx={{ borderBottom: `1px solid ${alpha(bc, 0.05)}` }}>
                    <ListItemText 
                      primary={h.motif} 
                      secondary={dayjs(h.date_creation).format("DD/MM/YYYY")}
                      primaryTypographyProps={{ fontWeight: 800, fontSize: '0.8rem' }}
                    />
                    <Chip label={h.statut} size="small" sx={{ fontSize: '0.6rem', height: 16 }} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {/* Zone de soin active */}
            <Grid item xs={12} md={8} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={900} gutterBottom>Soin en cours</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 0, bgcolor: alpha(RDC_BLUE, 0.05), borderColor: RDC_BLUE }}>
                <Typography variant="caption" fontWeight={900} color={RDC_BLUE}>OBSERVATIONS ACTUELLES</Typography>
                <Typography variant="body2">{patientInfo?.observations || "Aucune observation saisie."}</Typography>
              </Paper>

              <Typography variant="subtitle2" fontWeight={900} mb={1}>PRESCRIPTION ET PHARMACIE</Typography>
              <Stack direction="row" spacing={1} mb={2}>
                <TextField 
                  select 
                  fullWidth 
                  size="small" 
                  label="Choisir un médicament"
                  value={prescriptionForm.medicament}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, medicament: e.target.value})}
                >
                  {stock.map(s => <MenuItem key={s.id} value={s.id}>{s.nom} ({s.quantite} dispo)</MenuItem>)}
                </TextField>
                <TextField 
                  type="number" 
                  size="small" 
                  sx={{ width: 100 }} 
                  label="Qté" 
                  value={prescriptionForm.quantite}
                  onChange={(e) => setPrescriptionForm({...prescriptionForm, quantite: e.target.value})}
                />
                <Button 
                  variant="contained" 
                  onClick={() => handleAddPrescription(patientInfo.id)}
                  sx={{ borderRadius: 0, bgcolor: bc }}
                >
                  AJOUTER
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: alpha(bc, 0.05) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>MÉDICAMENT</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>QTÉ</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>DATE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientInfo?.medicaments?.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{m.nom_medicament}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{m.quantite}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{dayjs(m.date_prescription).format("DD/MM")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SuiviMedical;