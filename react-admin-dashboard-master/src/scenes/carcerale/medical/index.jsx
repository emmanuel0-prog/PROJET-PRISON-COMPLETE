import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import dayjs from "dayjs";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// 1. COMPOSANTS DE STRUCTURE & UI (@mui/material)
import { 
  Box, Typography, useTheme, alpha, Button, Grid, Stack, Paper, 
  IconButton, Avatar, LinearProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Badge, Tooltip, Divider, 
  CircularProgress, InputAdornment, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem
} from "@mui/material";

import api from "../../../api"; // Ton instance Axios

// 2. COMPOSANTS DE DONNÉES (@mui/x-data-grid)
import { DataGrid, frFR } from "@mui/x-data-grid";

// 3. ICÔNES (@mui/icons-material)
import { 
  SearchOutlined, 
  PrintOutlined, 
  LocalHospitalOutlined, 
  MonitorHeartOutlined,
  MedicalInformationOutlined,
  WarningAmberOutlined,
  HistoryOutlined,
  MedicationOutlined,
  EventNoteOutlined,
  VerifiedUserOutlined,
  HealthAndSafetyOutlined,
  AssignmentIndOutlined,
  Close // Importé correctement depuis les icônes ici
} from "@mui/icons-material";



// Couleurs Institutionnelles RDC
const RDC_BLUE = "#007FFF";
const RDC_RED = "#CE1021";
const RDC_YELLOW = "#F7D618";
const SuiviMedical = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bc = isDark ? "#fff" : "#000";
  const paperBg = theme.palette.background.paper;

  // --- ÉTATS ---
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, traites: 0, percent: 0 });
  const [loading, setLoading] = useState(false);
  const [openUrgence, setOpenUrgence] = useState(false);
  const [openRdv, setOpenRdv] = useState(false);
  const [openDossier, setOpenDossier] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- NOUVEAUX ÉTATS POUR L'HISTORIQUE ---
  const [historique, setHistorique] = useState([]); // <--- Indispensable pour éviter l'erreur "undefined"
  const [loadingHist, setLoadingHist] = useState(false);

  // États Recherche et Sélection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    motif: "",
    priorite: "NORMALE",
    observations: "",
    prescription: "", // Ajouté pour correspondre à ton modèle Django
    date_rdv: dayjs().format("YYYY-MM-DD")
  });

  // --- LOGIQUE DE RÉCUPÉRATION DE L'HISTORIQUE ---
  const fetchHistoriqueDetenu = async (detenuId) => {
  setLoadingHist(true);
  try {
    const response = await api.get(`/medical/historique/${detenuId}/`);

    // ✅ IMPORTANT : récupérer les deux parties
    setHistorique(response.data.historique || []);
    setPatientInfo(response.data.detenu || null);

  } catch (error) {
    console.error("Erreur historique:", error);
    setHistorique([]);
    setPatientInfo(null);
  } finally {
    setLoadingHist(false);
  }
};

  // --- FONCTION POUR OUVRIR LE DOSSIER (À lier à tes boutons) ---
 const handleOpenDossier = (detenu) => {
  fetchHistoriqueDetenu(detenu.id || detenu.detenu);
  setOpenDossier(true);
};

  // ... reste de ton code
  // --- LOGIQUE BACKEND ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [resRows, resStats] = await Promise.all([
        api.get("/consultations/"),
        api.get("/medical-stats/")
      ]);
      setRows(resRows.data);
      setStats({
        total: resStats.data.total_jour || 0,
        traites: resStats.data.traites_jour || 0,
        percent: resStats.data.pourcentage || 0
      });
    } catch (err) {
      console.error("Erreur API:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Recherche dynamique de détenus
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 3 && !selectedDetenu) {
        handleSearch(searchQuery);
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query) => {
    setIsSearching(true);
    try {
      const res = await api.get(`/detenus/?search=${query}`);
      setSearchResults(res.data);
    } catch (e) { console.error("Erreur recherche"); }
    setIsSearching(false);
  };

  const handleSubmitConsultation = async () => {
    if (!selectedDetenu) return alert("Veuillez sélectionner un détenu identifié.");
    try {
      await api.post("/consultations/", {
        detenu: selectedDetenu.id,
        motif: formData.motif,
        priorite: formData.priorite,
        observations: formData.observations,
        statut: "EN ATTENTE"
      });
      // Reset complet après succès
      setOpenUrgence(false);
      setSelectedDetenu(null);
      setSearchQuery("");
      setFormData({ motif: "", priorite: "NORMALE", observations: "", date_rdv: dayjs().format("YYYY-MM-DD") });
      loadData();
    } catch (err) { alert("Erreur d'enregistrement réseau."); }
  };

  // --- EXPORT PDF OFFICIEL (Version autoTable Directe) ---
  const generateOfficialPDF = (data) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Entête Institutionnel
      doc.setFontSize(10);
      doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", pageWidth / 2, 15, { align: "center" });
      doc.text("MINISTÈRE DE LA JUSTICE ET GARDE DES SCEAUX", pageWidth / 2, 20, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("ADMINISTRATION PÉNITENTIAIRE CENTRALE", pageWidth / 2, 25, { align: "center" });
      
      doc.setDrawColor(0, 127, 255); doc.line(20, 30, 76, 30);
      doc.setDrawColor(247, 214, 24); doc.line(76, 30, 132, 30);
      doc.setDrawColor(206, 16, 33); doc.line(132, 30, 190, 30);

      doc.setFontSize(14);
      doc.text("BULLETIN DE CONSULTATION MÉDICALE", pageWidth / 2, 45, { align: "center" });

      autoTable(doc, {
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        body: [
          ["Identité du Détenu", `${data.nom || "N/A"}`],
          ["Numéro d'Écrou", data.matricule || "SANS MATRICULE"],
           ["Âge", data?.age || "N/A"],
           ["Sexe", data?.sexe || "N/A"],
          ["Cellule", data?.cellule_actuelle || "N/A"],
          ["Urgence", data.priorite || "NORMALE"],
          ["Motif Médical", data.motif || "Non spécifié"],
          ["Observations", data.observations || "Néant"],
          
        
        
       
        
        ],
        styles: { fontSize: 10, cellPadding: 5 }
      });

      const finalY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.text(`Fait à Kinshasa, le ${dayjs().format("DD/MM/YYYY")}`, 140, finalY);
      doc.text("Le Médecin Chef de Service", 140, finalY + 10);
      doc.rect(135, finalY + 15, 50, 20);

      doc.save(`RAPPORT_MED_${data.matricule || 'DOC'}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du PDF.");
    }
  };
  const filteredRows = rows.filter(row => 
  row.nom?.toLowerCase().includes(searchTerm.toLowerCase())
   );
  const generateDailyReport = () => {
    const doc = new jsPDF();
    const today = dayjs().format("DD/MM/YYYY");
    
    doc.setFontSize(10);
    doc.text("RÉPUBLIQUE DÉMOCRATIQUE DU CONGO", 105, 15, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`RAPPORT MÉDICAL JOURNALIER - ${today}`, 105, 25, { align: "center" });

    // Tableau des Stats
    autoTable(doc, {
      startY: 35,
      head: [['Total Consultations', 'Traités', 'En Attente', 'Urgences']],
      body: [[stats.total, stats.traites, stats.total - stats.traites, rows.filter(r => r.priorite === 'URGENT').length]],
      theme: 'grid',
      headStyles: { fillColor: [0, 127, 255] }
    });

    // Liste des cas
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Détenu', 'Motif', 'Triage', 'Statut']],
      body: rows.map(r => [r.nom, r.motif, r.priorite, r.statut]),
      theme: 'striped'
    });

    doc.save(`RAPPORT_JOURNALIER_${today.replace(/\//g, '-')}.pdf`);
  };

 const columns = [
  { field: "date_consultation", headerName: "FLUX", width: 120, renderCell: (p) => {
    const isToday = dayjs(p.value).isSame(dayjs(), 'day');
    return (
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 900, display: 'block' }}>
          {dayjs(p.value).format("DD/MM HH:mm")}
        </Typography>
        {isToday && (
          <Typography variant="caption" sx={{ bgcolor: RDC_BLUE, color: '#fff', px: 0.5, fontSize: '0.6rem', fontWeight: 900 }}>
            AUJOURD'HUI
          </Typography>
        )}
      </Box>
    );
  }},
  { field: "nom", headerName: "IDENTITÉ DÉTENU", flex: 1.5, renderCell: (p) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar sx={{ 
        width: 32, height: 32, fontSize: "0.8rem", fontWeight: 900, borderRadius: 0,
        bgcolor: p.row.priorite === "URGENT" ? RDC_RED : bc,
        color: p.row.priorite === "URGENT" ? "#fff" : paperBg,
        border: `1px solid ${bc}`
      }}>
        {p.value?.substring(0, 2).toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={900}>{p.value}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>{p.row.cellule || "NON CLASSÉ"}</Typography>
      </Box>
    </Stack>
  )},
  { field: "priorite", headerName: "TRIAGE", width: 130, renderCell: (p) => (
    <Box sx={{ 
      px: 1, py: 0.5, border: `1px solid ${p.value === "URGENT" ? RDC_RED : bc}`,
      display: 'flex', alignItems: 'center', gap: 1, bgcolor: p.value === "URGENT" ? alpha(RDC_RED, 0.05) : "transparent"
    }}>
      <Box sx={{ width: 8, height: 8, bgcolor: p.value === "URGENT" ? RDC_RED : RDC_YELLOW, borderRadius: "50%" }} />
      <Typography variant="caption" fontWeight={900}>{p.value}</Typography>
    </Box>
  )},
  { field: "statut", headerName: "PRISE EN CHARGE", width: 170, renderCell: (p) => (
    <select 
      value={p.value} 
      onChange={(e) => api.post(`/consultations/${p.row.id}/update-status/`, {statut: e.target.value}).then(loadData)}
      style={{ width: "100%", background: "transparent", color: bc, border: `1px solid ${alpha(bc, 0.1)}`, fontWeight: 900, fontSize: "0.7rem", padding: "4px" }}
    >
      <option value="EN ATTENTE">⏳ EN ATTENTE</option>
      <option value="EN EXAMEN">🩺 EN EXAMEN</option>
      <option value="TRAITÉ">✅ TRAITÉ</option>
    </select>
  )},
  { field: "actions", headerName: "DOSSIER", width: 140, renderCell: (p) => (
    <Stack direction="row" spacing={1}>
      <Tooltip title="Analyse Approfondie du Cas">
        <IconButton 
          onClick={() => handleOpenDossier(p.row)} // Correction ici : Appelle la fonction de chargement
          sx={{ borderRadius: 0, border: `1px solid ${alpha(bc, 0.2)}`, color: RDC_BLUE }}
        >
          <AssignmentIndOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Imprimer Bulletin Rapide">
        <IconButton onClick={() => generateOfficialPDF(p.row)} sx={{ borderRadius: 0, border: `1px solid ${alpha(bc, 0.2)}` }}>
          <PrintOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )}
];

  return (
    <Box sx={{ p: 4, bgcolor: "background.default", minHeight: "100vh", color: bc }}>
      
      {/* HEADER */}
      <Box sx={{ mb: 4, pb: 2, borderBottom: `8px solid ${bc}` }}>
        <Grid container alignItems="flex-end">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <HealthAndSafetyOutlined sx={{ fontSize: 40 }} />
              <Typography variant="h2" fontWeight={1000} sx={{ letterSpacing: "-3px", textTransform: "uppercase" }}>
                Service de Santé <span style={{ color: RDC_BLUE }}>Pénitentiaire</span>
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight={700} sx={{ opacity: 0.5, letterSpacing: 2 }}>
              DIRECTION GÉNÉRALE DES SERVICES MÉDICAUX | RDC
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: "right" }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => setOpenRdv(true)} variant="outlined" startIcon={<EventNoteOutlined />} sx={{ borderRadius: 0, border: `2px solid ${bc}`, color: bc, fontWeight: 900 }}>
                PLANIFIER RDV
              </Button>
              <Button onClick={() => setOpenUrgence(true)} variant="contained" startIcon={<LocalHospitalOutlined />} sx={{ borderRadius: 0, bgcolor: RDC_RED, color: "#fff", fontWeight: 900 }}>
                ALERTE SANITAIRE
              </Button>
              <Button 
                 onClick={generateDailyReport} 
                 variant="outlined" 
                 startIcon={<HistoryOutlined />} 
                 sx={{ borderRadius: 0, border: `2px solid ${bc}`, color: bc, fontWeight: 900, mr: 1 }}>
                 RAPPORT JOURNALIER 
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      {/* ZONE DE FILTRAGE ET RECHERCHE */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.6 }}>
          {filteredRows.length} RÉSULTAT(S) TROUVÉ(S)
        </Typography>
        <TextField
          placeholder="Rechercher un nom ou matricule..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: bc }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 0, width: 300, bgcolor: paperBg, fontWeight: 700, border: `1px solid ${alpha(bc, 0.2)}` }
          }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 0, border: `2px solid ${bc}`, position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: "4px", height: "100%", bgcolor: RDC_BLUE }} />
              <Typography variant="caption" fontWeight={900}>TRAITEMENTS EFFECTUÉS (24H)</Typography>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h2" fontWeight={1000}>{stats.traites}</Typography>
                <Typography variant="h5" sx={{ opacity: 0.3 }}>/ {stats.total}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stats.percent} sx={{ height: 10, mt: 2, bgcolor: alpha(bc, 0.1), "& .MuiLinearProgress-bar": { bgcolor: bc } }} />
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 0, border: `2px solid ${bc}` }}>
              <Typography variant="h6" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1}>
                <MedicationOutlined /> GESTION PHARMACIE
              </Typography>
              <Stack spacing={2}>
                {[{ label: "Insuline", stock: "12 doses" }, { label: "ARV", stock: "45 boites" }].map((item, idx) => (
                  <Box key={idx} sx={{ p: 1.5, border: `1px solid ${alpha(bc, 0.1)}`, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" fontWeight={900}>{item.label}</Typography>
                    <Typography variant="caption" fontWeight={900} color={RDC_RED}>{item.stock}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper variant="outlined" sx={{ borderRadius: 0, border: `2px solid ${bc}`, height: 750 }}>
            <DataGrid rows={rows} columns={columns} loading={loading} sx={{ border: "none" }} localeText={frFR.components.MuiDataGrid.defaultProps.localeText} />
          </Paper>
        </Grid>
      </Grid>
     {/* =========================================================
          1. MODAL PLANIFICATION RDV (Harmonisée)
          ========================================================= */}
      <Dialog 
        open={openRdv} 
        onClose={() => setOpenRdv(false)} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 0, border: `6px solid ${bc}`, p: 0 } }}
      >
        {/* Bandeau Tricolore RDC en haut de la modal */}
        <Box sx={{ display: 'flex', height: '6px' }}>
          <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} />
          <Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} />
          <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
        </Box>

        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
          <EventNoteOutlined sx={{ fontSize: 40, mb: 1, color: RDC_BLUE }} />
          <Typography variant="h4" fontWeight={1000} sx={{ textTransform: "uppercase" }}>Planification RDV</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, letterSpacing: 1 }}>
            ADMINISTRATION PÉNITENTIAIRE • SANTÉ
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              label="DATE DU RENDEZ-VOUS"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.date_rdv}
              onChange={(e) => setFormData({ ...formData, date_rdv: e.target.value })}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0, fontWeight: 900, bgcolor: alpha(bc, 0.02) } }}
            />

            <TextField
              select
              fullWidth
              label="TYPE DE SPÉCIALITÉ"
              value={formData.specialite || "GENERAL"}
              onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0, fontWeight: 900 } }}
            >
              <MenuItem value="GENERAL">MÉDECINE GÉNÉRALE</MenuItem>
              <MenuItem value="DENTAIRE">CHIRURGIE DENTAIRE</MenuItem>
              <MenuItem value="OPHTALMO">OPHTALMOLOGIE</MenuItem>
              <MenuItem value="PSY">SANTÉ MENTALE / PSY</MenuItem>
            </TextField>

            <TextField
              label="LIEU OU PAVILLON"
              placeholder="Ex: Clinique Ngaliema ou Infirmerie Centrale"
              fullWidth
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: alpha(bc, 0.02), borderTop: `1px solid ${alpha(bc, 0.1)}` }}>
          <Button onClick={() => setOpenRdv(false)} sx={{ color: bc, fontWeight: 900 }}>ANNULER</Button>
          <Button 
            variant="contained" 
            onClick={() => { setOpenRdv(false); alert("RDV Planifié."); }}
            sx={{ bgcolor: bc, color: paperBg, borderRadius: 0, fontWeight: 1000, px: 4 }}
          >
            CONFIRMER LE RDV
          </Button>
        </DialogActions>
      </Dialog>

{/* =========================================================
    2. MODAL ALERTE / SIGNALEMENT (VERSION PRO)
    ========================================================= */}
<Dialog 
  open={openUrgence} 
  onClose={() => setOpenUrgence(false)} 
  fullWidth 
  maxWidth="sm" 
  PaperProps={{ 
    sx: { 
      borderRadius: 0, 
      border: `1px solid ${alpha(bc, 0.1)}`, 
      boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      p: 0 
    } 
  }}
>
  {/* Barre d'état tricolore RDC */}
  <Box sx={{ display: 'flex', height: '4px' }}>
    <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} />
    <Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} />
    <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
  </Box>

  <DialogTitle sx={{ p: 3, borderBottom: `1px solid ${alpha(bc, 0.08)}` }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar sx={{ bgcolor: RDC_RED, borderRadius: 0, width: 48, height: 48 }}>
        <LocalHospitalOutlined sx={{ color: '#fff' }} />
      </Avatar>
      <Box>
        <Typography variant="h6" fontWeight={1000} sx={{ lineHeight: 1.2 }}>
          SIGNALEMENT MÉDICAL D'URGENCE
        </Typography>
        <Typography variant="caption" sx={{ color: RDC_RED, fontWeight: 800, textTransform: 'uppercase' }}>
          Registre National de Santé Pénitentiaire
        </Typography>
      </Box>
    </Stack>
  </DialogTitle>

  <DialogContent sx={{ p: 4 }}>
    <Stack spacing={3} sx={{ mt: 1 }}>
      
      {/* SECTION 1 : IDENTIFICATION PATIENT */}
      <Box>
        <Typography variant="overline" sx={{ fontWeight: 900, color: alpha(bc, 0.5), mb: 1, display: 'block' }}>
          Identification du Patient
        </Typography>
        
        {/* Affichage si sélectionné, sinon barre de recherche */}
        {selectedDetenu ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(RDC_BLUE, 0.05), border: `1px solid ${RDC_BLUE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>{selectedDetenu.nom}</Typography>
              <Typography variant="caption" display="block">MATRICULE: {selectedDetenu.matricule}</Typography>
            </Box>
            <Button size="small" onClick={() => setSelectedDetenu(null)} sx={{ color: RDC_RED, fontWeight: 800 }}>Changer</Button>
          </Paper>
        ) : (
          <Box position="relative">
            <TextField 
              fullWidth 
              placeholder="Rechercher Matricule ou Nom..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>,
                endAdornment: isSearching && <CircularProgress size={20} />,
                sx: { borderRadius: 0, bgcolor: alpha(bc, 0.02), fontWeight: 700 }
              }}
            />
            {/* Résultats de recherche flottants */}
            {searchResults.length > 0 && (
              <Paper sx={{ position: 'absolute', zIndex: 100, width: '100%', borderRadius: 0, mt: 0.5, maxHeight: 200, overflow: 'auto', border: `1px solid ${alpha(bc, 0.2)}` }}>
                {searchResults.map(d => (
                  <MenuItem key={d.id} onClick={() => { setSelectedDetenu(d); setSearchResults([]); }} sx={{ p: 2, borderBottom: `1px solid ${alpha(bc, 0.05)}` }}>
                    <ListItemText primary={d.nom} secondary={`Matricule: ${d.matricule} | ${d.cellule_actuelle}`} />
                  </MenuItem>
                ))}
              </Paper>
            )}
          </Box>
        )}
      </Box>

      {/* SECTION 2 : TRIAGE & MOTIF */}
      <Box>
        <Typography variant="overline" sx={{ fontWeight: 900, color: alpha(bc, 0.5), mb: 1, display: 'block' }}>
          Évaluation Clinique
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField 
              select 
              fullWidth 
              label="Niveau de Triage" 
              value={formData.priorite} 
              onChange={(e) => setFormData({...formData, priorite: e.target.value})}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0, fontWeight: 700 } }}
            >
              <MenuItem value="NORMALE">🟢 CONSULTATION ROUTINE</MenuItem>
              <MenuItem value="HAUTE">🟡 URGENCE RELATIVE</MenuItem>
              <MenuItem value="URGENT">🔴 URGENCE VITALE</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Motif de Référence" 
              placeholder="Ex: Douleurs thoraciques..."
              value={formData.motif}
              onChange={(e) => setFormData({...formData, motif: e.target.value})} 
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0 } }} 
            />
          </Grid>
        </Grid>
      </Box>

      {/* SECTION 3 : PRESCRIPTION & OBSERVATIONS */}
      <Box>
        <Typography variant="overline" sx={{ fontWeight: 900, color: alpha(bc, 0.5), mb: 1, display: 'block' }}>
          Détails Médicaux & Soins
        </Typography>
        <Stack spacing={2}>
          <TextField 
            fullWidth
            label="Prescription Immédiate (Ordonnance)" 
            multiline 
            rows={2} 
            placeholder="Médicaments administrés ou à administrer..."
            value={formData.prescription}
            onChange={(e) => setFormData({...formData, prescription: e.target.value})} 
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0, bgcolor: alpha(RDC_BLUE, 0.02) } }}
          />
          <TextField 
            fullWidth
            label="Observations Cliniques (Infirmier)"
            multiline 
            rows={3} 
            placeholder="Signes vitaux, état de conscience, etc..."
            value={formData.observations}
            onChange={(e) => setFormData({...formData, observations: e.target.value})} 
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 0, bgcolor: alpha(bc, 0.01) } }}
          />
        </Stack>
      </Box>
    </Stack>
  </DialogContent>

  <DialogActions sx={{ p: 3, bgcolor: alpha(bc, 0.02), borderTop: `1px solid ${alpha(bc, 0.05)}` }}>
    <Button onClick={() => setOpenUrgence(false)} sx={{ color: alpha(bc, 0.6), fontWeight: 900 }}>
      ANNULER
    </Button>
    <Button 
      variant="contained" 
      disabled={!selectedDetenu || !formData.motif} 
      onClick={handleSubmitConsultation} 
      sx={{ 
        bgcolor: bc, color: "#fff", borderRadius: 0, fontWeight: 1000, px: 4,
        '&:hover': { bgcolor: alpha(bc, 0.8) }
      }}
    >
      TRANSMETTRE AU MÉDECIN
    </Button>
  </DialogActions>
</Dialog>

     {/* =========================================================
    MODAL : DOSSIER D'ANALYSE MÉDICALE (CAS DU DÉTENU)
    ========================================================= */}
<Dialog 
  open={openDossier} 
  onClose={() => setOpenDossier(false)} 
  fullWidth 
  maxWidth="md"
  PaperProps={{ sx: { borderRadius: 0, border: `1px solid ${bc}`, p: 0 } }}
>
  {/* Drapeau RDC en haut */}
  <Box sx={{ display: 'flex', height: '4px' }}>
    <Box sx={{ flex: 1, bgcolor: RDC_BLUE }} />
    <Box sx={{ flex: 1, bgcolor: RDC_YELLOW }} />
    <Box sx={{ flex: 1, bgcolor: RDC_RED }} />
  </Box>

  <DialogTitle sx={{ p: 3, borderBottom: `1px solid ${alpha(bc, 0.1)}`, bgcolor: alpha(bc, 0.01) }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: bc, borderRadius: 0, width: 50, height: 50 }}>
          <MedicalInformationOutlined />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={1000} sx={{ textTransform: 'uppercase', lineHeight: 1 }}>
            Dossier Médical : {patientInfo?.nom}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: RDC_BLUE }}>
            MATRICULE : {patientInfo?.matricule} • CELLULE : {patientInfo?.cellule_actuelle || "N/A"}
          </Typography>
        </Box>
      </Stack>
      <IconButton onClick={() => setOpenDossier(false)}><Close /></IconButton>
    </Stack>
  </DialogTitle>

  <DialogContent sx={{ p: 4 }}>
    <Grid container spacing={4}>
      
      {/* Colonne GAUCHE : Profil & Alertes */}
      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <Box sx={{ p: 2, border: `2px solid ${bc}`, bgcolor: "#fff" }}>
            <Typography variant="overline" sx={{ fontWeight: 1000, color: alpha(bc, 0.4) }}>PROFIL ÉCROU</Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="body2">Sexe: <b>{patientInfo?.sexe || "Masculin"}</b></Typography>
            <Typography variant="body2">Âge: <b>{patientInfo?.age || "N/A"} ans</b></Typography>
            <Typography variant="body2">Régime: <b>Commun</b></Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Groupe Sanguin: <b style={{color: RDC_RED}}>{patientInfo?.groupe_sanguin || "O+"}</b></Typography>
          </Box>

          <Box sx={{ p: 2, border: `2px solid ${RDC_RED}`, bgcolor: alpha(RDC_RED, 0.05) }}>
            <Typography variant="caption" sx={{ fontWeight: 1000, color: RDC_RED }}>⚠️ ALERTES MÉDICALES</Typography>
            <Typography variant="body2" fontWeight={800} sx={{ mt: 1, color: RDC_RED }}>
              {patientInfo?.alertes || "AUCUNE ALLERGIE SIGNALÉE"}
            </Typography>
          </Box>
        </Stack>
      </Grid>

      {/* Colonne DROITE : Historique Connecté au Backend */}
      <Grid item xs={12} md={8}>
        <Typography variant="overline" sx={{ fontWeight: 1000, color: alpha(bc, 0.4) }}>
          HISTORIQUE DES INTERVENTIONS (BACKEND)
        </Typography>
        
        <TableContainer sx={{ mt: 1, border: `1px solid ${alpha(bc, 0.1)}`, maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, bgcolor: alpha(bc, 0.03) }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: alpha(bc, 0.03) }}>MOTIF</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: alpha(bc, 0.03) }}>PRESCRIPTION / SOINS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historique.length > 0 ? historique.map((h, index) => (
                <TableRow key={index} sx={{ '&:hover': { bgcolor: alpha(bc, 0.01) } }}>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {dayjs(h.date_creation).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {h.motif}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    {h.prescription ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MedicationOutlined sx={{ fontSize: 16, color: RDC_BLUE }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {h.prescription}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic' }}>
                        Observations: {h.observations || "RAS"}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3, opacity: 0.5 }}>
                    <CircularProgress size={20} sx={{ mb: 1 }} /><br />
                    Chargement de l'historique...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(RDC_BLUE, 0.05), borderLeft: `5px solid ${RDC_BLUE}` }}>
          <Typography variant="caption" sx={{ fontWeight: 1000, color: RDC_BLUE }}>NOTE DU MÉDECIN CHEF</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            "Suivi rigoureux du régime alimentaire pour le pavillon {patientInfo?.pavillon_actuel}. Toute anomalie doit être signalée immédiatement."
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </DialogContent>

  <DialogActions sx={{ p: 3, bgcolor: alpha(bc, 0.01), borderTop: `1px solid ${alpha(bc, 0.05)}` }}>
    <Button 
      variant="outlined" 
      startIcon={<PrintOutlined />} 
      onClick={() => generateOfficialPDF(patientInfo, historique)}
      sx={{ borderRadius: 0, fontWeight: 900, border: `2px solid ${bc}`, color: bc }}
    >
      IMPRIMER LA FICHE COMPLÈTE
    </Button>
    <Button 
      variant="contained" 
      onClick={() => setOpenDossier(false)}
      sx={{ bgcolor: bc, color: "#fff", borderRadius: 0, fontWeight: 900, px: 4 }}
    >
      FERMER L'ANALYSE
    </Button>
  </DialogActions>
</Dialog>
    </Box>



  );
  
  
};

export default SuiviMedical;